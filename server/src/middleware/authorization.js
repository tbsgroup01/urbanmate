const AppError = require('../utils/app-error');
const asyncHandler = require('../utils/async-handler');
const { Provider } = require('../models');

function authorize(...allowedRoles) {
  if (!allowedRoles.length) throw new Error('authorize requires at least one role');

  return (req, res, next) => {
    const userRoles = req.user?.roles?.map((role) => role.name) || [];
    if (!allowedRoles.some((role) => userRoles.includes(role))) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }
    return next();
  };
}

function authorizeExclusive(role) {
  return (req, res, next) => {
    const userRoles = req.user?.roles?.map((userRole) => userRole.name) || [];
    const hasConflictingRole = role === 'provider'
      ? userRoles.includes('customer')
      : role === 'admin' && (userRoles.includes('customer') || userRoles.includes('provider'));
    if (!userRoles.includes(role) || hasConflictingRole) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }
    return next();
  };
}

const requireApprovedProvider = asyncHandler(async (req, res, next) => {
  const provider = await Provider.findOne({
    where: { userId: req.user.id },
    attributes: ['approvalStatus', 'identityVerified']
  });
  if (!provider || provider.approvalStatus !== 'approved' || !provider.identityVerified) {
    throw new AppError('Provider account is awaiting identity verification or approval', 403, 'PROVIDER_NOT_APPROVED');
  }
  req.provider = provider;
  return next();
});

const requireProviderProfile = asyncHandler(async (req, res, next) => {
  const provider = await Provider.findOne({ where: { userId: req.user.id } });
  if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
  req.provider = provider;
  return next();
});

module.exports = { authorize, authorizeExclusive, requireApprovedProvider, requireProviderProfile };
