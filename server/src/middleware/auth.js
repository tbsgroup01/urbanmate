const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/app-error');
const asyncHandler = require('../utils/async-handler');
const { User, Role } = require('../models');
const { authorize, authorizeExclusive } = require('./authorization');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Authentication is required', 401, 'UNAUTHENTICATED');
  }

  let payload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    });
  } catch {
    throw new AppError('Access token is invalid or expired', 401, 'INVALID_TOKEN');
  }
  if (
    payload.typ !== 'access'
    || typeof payload.sub !== 'string'
    || !Number.isInteger(payload.ver)
    || payload.ver < 0
  ) {
    throw new AppError('Access token is invalid or expired', 401, 'INVALID_TOKEN');
  }

  const user = await User.findByPk(payload.sub, {
    attributes: ['id', 'fullName', 'email', 'status', 'emailVerifiedAt', 'authVersion'],
    include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }]
  });

  if (!user || user.status !== 'active') {
    throw new AppError('Account is unavailable', 401, 'ACCOUNT_UNAVAILABLE');
  }
  if (payload.ver !== user.authVersion) {
    throw new AppError('Access token has been revoked', 401, 'TOKEN_REVOKED');
  }
  req.user = user;
  return next();
});

module.exports = {
  authenticate,
  requireRole: authorize,
  requireExclusiveRole: authorizeExclusive
};
