const crypto = require('node:crypto');
const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const env = require('../../config/env');
const AppError = require('../../utils/app-error');

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 300;
const DOWNLOAD_URL_TTL_SECONDS = 60;
let client;

function getClient() {
  if (!env.DOCUMENT_STORAGE_BUCKET || !env.DOCUMENT_STORAGE_REGION) {
    throw new AppError('Provider document storage is not configured', 503, 'DOCUMENT_STORAGE_UNAVAILABLE');
  }
  if (!client) {
    client = new S3Client({
      region: env.DOCUMENT_STORAGE_REGION,
      ...(env.DOCUMENT_STORAGE_ENDPOINT ? { endpoint: env.DOCUMENT_STORAGE_ENDPOINT } : {}),
      forcePathStyle: env.DOCUMENT_STORAGE_FORCE_PATH_STYLE,
      ...(env.DOCUMENT_STORAGE_ACCESS_KEY_ID
        ? {
          credentials: {
            accessKeyId: env.DOCUMENT_STORAGE_ACCESS_KEY_ID,
            secretAccessKey: env.DOCUMENT_STORAGE_SECRET_ACCESS_KEY
          }
        }
        : {})
    });
  }
  return client;
}

function createStorageKey(providerId) {
  return `provider-documents/${providerId}/${crypto.randomUUID()}`;
}

async function createUploadUrl({ key, contentType, contentLength }) {
  if (contentLength > MAX_DOCUMENT_BYTES) {
    throw new AppError('Provider documents must be 10 MB or smaller', 400, 'DOCUMENT_TOO_LARGE');
  }
  const command = new PutObjectCommand({
    Bucket: env.DOCUMENT_STORAGE_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    ServerSideEncryption: 'AES256'
  });
  return getSignedUrl(getClient(), command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

async function verifyUploadedObject(document) {
  const result = await getClient().send(new HeadObjectCommand({
    Bucket: env.DOCUMENT_STORAGE_BUCKET,
    Key: document.storageKey
  }));
  if (result.ContentLength !== document.fileSizeBytes || result.ContentType !== document.contentType) {
    throw new AppError('Uploaded document does not match the declared type or size', 400, 'DOCUMENT_UPLOAD_MISMATCH');
  }
  if (result.ContentLength > MAX_DOCUMENT_BYTES) {
    throw new AppError('Provider documents must be 10 MB or smaller', 400, 'DOCUMENT_TOO_LARGE');
  }
}

async function createDownloadUrl(key) {
  return getSignedUrl(getClient(), new GetObjectCommand({
    Bucket: env.DOCUMENT_STORAGE_BUCKET,
    Key: key
  }), { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}

module.exports = {
  MAX_DOCUMENT_BYTES,
  UPLOAD_URL_TTL_SECONDS,
  createStorageKey,
  createUploadUrl,
  verifyUploadedObject,
  createDownloadUrl
};
