const express = require('express');
const asyncHandler = require('../../utils/async-handler');
const validateRequest = require('../../middleware/validate-request');
const { authenticate, requireExclusiveRole } = require('../../middleware/auth');
const controller = require('./catalog.controller');
const {
  listCategoriesSchema,
  adminListCategoriesSchema,
  categorySchema,
  updateCategorySchema,
  serviceSchema,
  updateServiceSchema,
  packageSchema,
  updatePackageSchema,
  addonSchema,
  updateAddonSchema,
  pricingRuleSchema,
  updatePricingRuleSchema,
  listServicesSchema,
  locationQuerySchema,
  listCitiesSchema,
  adminListCitiesSchema,
  serviceParamsSchema,
  categoryParamsSchema,
  childParamsSchema,
  pricingParamsSchema,
  categoryIdParamsSchema,
  serviceIdParamsSchema,
  serviceAreasSchema,
  citySchema,
  updateCitySchema,
  areaSchema,
  updateAreaSchema,
  cityParamsSchema,
  cityIdParamsSchema,
  areaParamsSchema
} = require('./catalog.schemas');

const router = express.Router();
const adminOnly = [authenticate, requireExclusiveRole('admin')];

router.get('/categories', validateRequest(listCategoriesSchema, 'query'), asyncHandler(controller.categories));
router.get('/categories/:categoryId', validateRequest(categoryParamsSchema, 'params'), asyncHandler(controller.category));
router.get('/cities', validateRequest(listCitiesSchema, 'query'), asyncHandler(controller.cities));
router.get('/cities/:cityId', asyncHandler(controller.city));

router.get('/services', validateRequest(listServicesSchema, 'query'), asyncHandler(controller.services));
router.get('/services/:serviceId/price', validateRequest(serviceParamsSchema, 'params'), validateRequest(locationQuerySchema, 'query'), asyncHandler(controller.price));
router.get('/services/:serviceId', validateRequest(serviceParamsSchema, 'params'), validateRequest(locationQuerySchema, 'query'), asyncHandler(controller.service));

router.get('/admin/categories', ...adminOnly, validateRequest(adminListCategoriesSchema, 'query'), asyncHandler(controller.categories));
router.post('/admin/categories', ...adminOnly, validateRequest(categorySchema), asyncHandler(controller.createCategory));
router.patch(
  '/admin/categories/:categoryId',
  ...adminOnly,
  validateRequest(categoryIdParamsSchema, 'params'),
  validateRequest(updateCategorySchema),
  asyncHandler(controller.updateCategory)
);
router.delete(
  '/admin/categories/:categoryId',
  ...adminOnly,
  validateRequest(categoryIdParamsSchema, 'params'),
  asyncHandler(controller.deleteCategory)
);

router.get('/admin/services', ...adminOnly, validateRequest(listServicesSchema, 'query'), asyncHandler(controller.managedServices));
router.post('/admin/services', ...adminOnly, validateRequest(serviceSchema), asyncHandler(controller.createService));
router.patch(
  '/admin/services/:serviceId',
  ...adminOnly,
  validateRequest(serviceIdParamsSchema, 'params'),
  validateRequest(updateServiceSchema),
  asyncHandler(controller.updateService)
);
router.delete(
  '/admin/services/:serviceId',
  ...adminOnly,
  validateRequest(serviceIdParamsSchema, 'params'),
  asyncHandler(controller.deleteService)
);

router.post(
  '/admin/services/:serviceId/packages',
  ...adminOnly,
  validateRequest(serviceIdParamsSchema, 'params'),
  validateRequest(packageSchema),
  asyncHandler(controller.packageController.create)
);
router.patch(
  '/admin/services/:serviceId/packages/:childId',
  ...adminOnly,
  validateRequest(childParamsSchema, 'params'),
  validateRequest(updatePackageSchema),
  asyncHandler(controller.packageController.update)
);
router.delete(
  '/admin/services/:serviceId/packages/:childId',
  ...adminOnly,
  validateRequest(childParamsSchema, 'params'),
  asyncHandler(controller.packageController.remove)
);

router.post(
  '/admin/services/:serviceId/addons',
  ...adminOnly,
  validateRequest(serviceIdParamsSchema, 'params'),
  validateRequest(addonSchema),
  asyncHandler(controller.addonController.create)
);
router.patch(
  '/admin/services/:serviceId/addons/:childId',
  ...adminOnly,
  validateRequest(childParamsSchema, 'params'),
  validateRequest(updateAddonSchema),
  asyncHandler(controller.addonController.update)
);
router.delete(
  '/admin/services/:serviceId/addons/:childId',
  ...adminOnly,
  validateRequest(childParamsSchema, 'params'),
  asyncHandler(controller.addonController.remove)
);

router.post(
  '/admin/services/:serviceId/pricing-rules',
  ...adminOnly,
  validateRequest(serviceIdParamsSchema, 'params'),
  validateRequest(pricingRuleSchema),
  asyncHandler(controller.createPricingRule)
);
router.patch(
  '/admin/services/:serviceId/pricing-rules/:ruleId',
  ...adminOnly,
  validateRequest(pricingParamsSchema, 'params'),
  validateRequest(updatePricingRuleSchema),
  asyncHandler(controller.updatePricingRule)
);
router.delete(
  '/admin/services/:serviceId/pricing-rules/:ruleId',
  ...adminOnly,
  validateRequest(pricingParamsSchema, 'params'),
  asyncHandler(controller.deletePricingRule)
);
router.put(
  '/admin/services/:serviceId/availability',
  ...adminOnly,
  validateRequest(serviceIdParamsSchema, 'params'),
  validateRequest(serviceAreasSchema),
  asyncHandler(controller.setServiceAreas)
);

router.get('/admin/cities', ...adminOnly, validateRequest(adminListCitiesSchema, 'query'), asyncHandler(controller.cities));
router.get('/admin/cities/:cityId', ...adminOnly, validateRequest(cityIdParamsSchema, 'params'), asyncHandler(controller.city));
router.post('/admin/cities', ...adminOnly, validateRequest(citySchema), asyncHandler(controller.createCity));
router.patch(
  '/admin/cities/:cityId',
  ...adminOnly,
  validateRequest(cityParamsSchema, 'params'),
  validateRequest(updateCitySchema),
  asyncHandler(controller.updateCity)
);
router.delete(
  '/admin/cities/:cityId',
  ...adminOnly,
  validateRequest(cityParamsSchema, 'params'),
  asyncHandler(controller.deleteCity)
);
router.post(
  '/admin/cities/:cityId/areas',
  ...adminOnly,
  validateRequest(cityIdParamsSchema, 'params'),
  validateRequest(areaSchema),
  asyncHandler(controller.createArea)
);
router.patch(
  '/admin/cities/:cityId/areas/:areaId',
  ...adminOnly,
  validateRequest(areaParamsSchema, 'params'),
  validateRequest(updateAreaSchema),
  asyncHandler(controller.updateArea)
);
router.delete(
  '/admin/cities/:cityId/areas/:areaId',
  ...adminOnly,
  validateRequest(areaParamsSchema, 'params'),
  asyncHandler(controller.deleteArea)
);

module.exports = router;
