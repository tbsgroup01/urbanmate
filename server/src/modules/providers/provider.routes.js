const express = require('express');
const rateLimit = require('express-rate-limit');
const AppError = require('../../utils/app-error');
const asyncHandler = require('../../utils/async-handler');
const validateRequest = require('../../middleware/validate-request');
const { authenticate, requireExclusiveRole } = require('../../middleware/auth');
const { requireProviderProfile } = require('../../middleware/authorization');
const controller = require('./provider.controller');
const {
  profileSchema,
  documentUploadSchema,
  documentIdParamsSchema,
  providerIdParamsSchema,
  documentReviewSchema,
  providerDecisionSchema,
  providerListSchema,
  publicProviderListSchema,
  providerServicesSchema,
  providerAreasSchema,
  providerAvailabilitySchema,
  onlineStatusSchema,
  reviewListSchema,
  createReviewSchema
} = require('./provider.schemas');

const router = express.Router();
const providerOnly = [authenticate, requireExclusiveRole('provider'), requireProviderProfile];
const adminOnly = [authenticate, requireExclusiveRole('admin')];
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => next(new AppError('Too many document upload requests', 429, 'RATE_LIMITED'))
});

router.get('/', validateRequest(publicProviderListSchema, 'query'), asyncHandler(controller.publicProviders));
router.get('/:providerId/reviews', validateRequest(providerIdParamsSchema, 'params'), validateRequest(reviewListSchema, 'query'), asyncHandler(controller.reviews));
router.get('/:providerId', validateRequest(providerIdParamsSchema, 'params'), asyncHandler(controller.publicProvider));
router.post('/reviews', authenticate, requireExclusiveRole('customer'), validateRequest(createReviewSchema), asyncHandler(controller.createReview));

router.get('/me/profile', ...providerOnly, asyncHandler(controller.myProfile));
router.patch('/me/profile', ...providerOnly, validateRequest(profileSchema), asyncHandler(controller.updateMyProfile));
router.get('/me/services', ...providerOnly, asyncHandler(controller.myServices));
router.put('/me/services', ...providerOnly, validateRequest(providerServicesSchema), asyncHandler(controller.setServices));
router.get('/me/service-areas', ...providerOnly, asyncHandler(controller.myAreas));
router.put('/me/service-areas', ...providerOnly, validateRequest(providerAreasSchema), asyncHandler(controller.setAreas));
router.get('/me/availability', ...providerOnly, asyncHandler(controller.myAvailability));
router.put('/me/availability', ...providerOnly, validateRequest(providerAvailabilitySchema), asyncHandler(controller.setAvailability));
router.patch('/me/online-status', ...providerOnly, validateRequest(onlineStatusSchema), asyncHandler(controller.setOnlineStatus));
router.get('/me/earnings', ...providerOnly, asyncHandler(controller.earnings));

router.post('/me/documents/upload', ...providerOnly, uploadLimiter, validateRequest(documentUploadSchema), asyncHandler(controller.requestDocumentUpload));
router.post('/me/documents/:documentId/complete', ...providerOnly, validateRequest(documentIdParamsSchema, 'params'), asyncHandler(controller.completeDocumentUpload));
router.get('/me/documents/:documentId/download', ...providerOnly, validateRequest(documentIdParamsSchema, 'params'), asyncHandler(controller.myDocumentDownload));

router.get('/admin/applications', ...adminOnly, validateRequest(providerListSchema, 'query'), asyncHandler(controller.adminProviders));
router.get('/admin/applications/:providerId', ...adminOnly, validateRequest(providerIdParamsSchema, 'params'), asyncHandler(controller.adminProvider));
router.patch('/admin/applications/:providerId/decision', ...adminOnly, validateRequest(providerIdParamsSchema, 'params'), validateRequest(providerDecisionSchema), asyncHandler(controller.decideProvider));
router.patch('/admin/documents/:documentId/review', ...adminOnly, validateRequest(documentIdParamsSchema, 'params'), validateRequest(documentReviewSchema), asyncHandler(controller.reviewDocument));
router.get('/admin/documents/:documentId/download', ...adminOnly, validateRequest(documentIdParamsSchema, 'params'), asyncHandler(controller.adminDocumentDownload));

module.exports = router;
