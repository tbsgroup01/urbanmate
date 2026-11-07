const providerService = require('./provider.service');
const { success } = require('../../utils/api-response');
const { ProviderAvailability } = require('../../models');

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

module.exports = {
  myProfile,
  updateMyProfile,
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
