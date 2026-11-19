const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const providerService = require('./provider.service');
const { success } = require('../../utils/api-response');
const { ProviderAvailability } = require('../../models');
const AppError = require('../../utils/app-error');

async function myProfile(req, res) {
  return success(res, await providerService.getMyProfile(req.user.id));
}

async function updateMyProfile(req, res) {
  return success(res, await providerService.updateMyProfile(req.user.id, { ...req.body }), {
    message: 'Provider profile updated'
  });
}

async function requestDocumentUpload(req, res) {
  return success(res, await providerService.requestDocumentUpload(req.user.id, req.body), {
    statusCode: 201,
    message: 'Upload URL created'
  });
}

async function completeDocumentUpload(req, res) {
  return success(res, await providerService.completeDocumentUpload(req.user.id, req.params.documentId), {
    message: 'Document upload completed'
  });
}

async function myDocumentDownload(req, res) {
  return success(res, await providerService.getDocumentDownload(req.user.id, req.params.documentId));
}

async function setServices(req, res) {
  return success(res, await providerService.setProviderServices(req.user.id, req.body.services), {
    message: 'Provider services updated'
  });
}

async function myServices(req, res) {
  return success(res, await providerService.getProviderServices(req.provider.id));
}

async function setAreas(req, res) {
  return success(res, await providerService.setProviderAreas(req.user.id, req.body.areaIds), {
    message: 'Provider service areas updated'
  });
}

async function myAreas(req, res) {
  return success(res, await providerService.getProviderAreas(req.provider.id));
}

async function setAvailability(req, res) {
  return success(res, await providerService.setAvailability(req.user.id, req.body.availability), {
    message: 'Provider availability updated'
  });
}

async function myAvailability(req, res) {
  const result = await ProviderAvailability.findAll({
    where: { providerId: req.provider.id },
    order: [['weekday', 'ASC'], ['startTime', 'ASC']]
  });
  return success(res, result);
}

async function setOnlineStatus(req, res) {
  return success(res, await providerService.setOnlineStatus(req.user.id, req.body.isOnline), {
    message: 'Provider availability status updated'
  });
}

async function earnings(req, res) {
  return success(res, await providerService.getEarnings(req.user.id));
}

async function publicProviders(req, res) {
  const result = await providerService.listPublicProviders(req.validatedQuery);
  return success(res, result.items, { meta: result.meta });
}

async function publicProvider(req, res) {
  return success(res, await providerService.getPublicProvider(req.params.providerId));
}

async function reviews(req, res) {
  const result = await providerService.getProviderReviews(req.params.providerId, req.validatedQuery);
  return success(res, result.items, { meta: result.meta });
}

async function createReview(req, res) {
  return success(res, await providerService.createReview(req.user.id, req.body), {
    statusCode: 201,
    message: 'Provider review created'
  });
}

async function adminProviders(req, res) {
  const result = await providerService.listAdminProviders(req.validatedQuery);
  return success(res, result.items, { meta: result.meta });
}

async function adminProvider(req, res) {
  return success(res, await providerService.getAdminProvider(req.params.providerId));
}

async function reviewDocument(req, res) {
  return success(res, await providerService.reviewDocument(req.user.id, req.params.documentId, req.body), {
    message: 'Provider document reviewed'
  });
}

async function adminDocumentDownload(req, res) {
  return success(res, await providerService.getDocumentDownload(req.user.id, req.params.documentId, true));
}

async function decideProvider(req, res) {
  return success(res, await providerService.setProviderDecision(req.user.id, req.params.providerId, req.body), {
    message: `Provider application ${req.body.status}`
  });
}

async function uploadAvatar(req, res) {
  const { dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new AppError('Image data URL is required', 400, 'INVALID_IMAGE');
  }

  const match = dataUrl.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);
  if (!match) {
    throw new AppError('Invalid image format. Supported formats: JPEG, PNG, WebP, GIF', 400, 'INVALID_IMAGE_FORMAT');
  }

  const [, rawExt, base64Data] = match;
  const ext = rawExt.toLowerCase() === 'jpeg' ? 'jpg' : rawExt.toLowerCase();
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    throw new AppError('Image file size exceeds the 5MB limit', 400, 'IMAGE_TOO_LARGE');
  }

  const uploadsDir = path.join(__dirname, '../../../public/uploads');
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const safeFilename = `avatar_${req.provider.id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const filePath = path.join(uploadsDir, safeFilename);

  await fs.promises.writeFile(filePath, buffer);

  const protocol = req.protocol;
  const host = req.get('host');
  const avatarUrl = `${protocol}://${host}/uploads/${safeFilename}`;

  await req.provider.update({ avatarUrl });

  return success(res, { avatarUrl }, {
    statusCode: 201,
    message: 'Profile photo updated successfully'
  });
}

module.exports = {
  myProfile,
  updateMyProfile,
  uploadAvatar,
  requestDocumentUpload,
  completeDocumentUpload,
  myDocumentDownload,
  setServices,
  myServices,
  setAreas,
  myAreas,
  setAvailability,
  myAvailability,
  setOnlineStatus,
  earnings,
  publicProviders,
  publicProvider,
  reviews,
  createReview,
  adminProviders,
  adminProvider,
  reviewDocument,
  adminDocumentDownload,
  decideProvider
};
