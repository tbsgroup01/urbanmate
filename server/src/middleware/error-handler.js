const { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } = require('sequelize');
const env = require('../config/env');
const logger = require('../config/logger');
const AppError = require('../utils/app-error');

module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  let normalized = error;
  if (error.type === 'entity.parse.failed') {
    normalized = new AppError('Malformed JSON request body', 400, 'INVALID_JSON');
  } else if (error.type === 'entity.too.large') {
    normalized = new AppError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
  } else if (error instanceof UniqueConstraintError) {
    normalized = new AppError('A record with these details already exists', 409, 'DUPLICATE_RECORD');
  } else if (error instanceof ForeignKeyConstraintError) {
    normalized = new AppError('The referenced record does not exist', 400, 'INVALID_REFERENCE');
  } else if (error instanceof ValidationError) {
    normalized = new AppError('Database validation failed', 400, 'VALIDATION_ERROR',
      error.errors.map(({ path, message }) => ({ field: path, message })));
  }

  const statusCode = normalized.statusCode || 500;
  if (statusCode >= 500) {
    logger.error({ err: error, requestId: req.id, path: req.originalUrl }, 'Request failed');
  } else {
    logger.warn({ code: normalized.code, requestId: req.id, path: req.originalUrl }, normalized.message);
  }

  const body = {
    success: false,
    error: {
      code: normalized.code || 'INTERNAL_ERROR',
      message: statusCode >= 500 && env.NODE_ENV === 'production' ? 'An unexpected error occurred' : normalized.message
    },
    requestId: req.id
  };
  if (normalized.details && env.NODE_ENV !== 'production') body.error.details = normalized.details;
  return res.status(statusCode).json(body);
};
