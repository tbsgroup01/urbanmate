const catalogService = require('./catalog.service');
const { success } = require('../../utils/api-response');

async function categories(req, res) {
  const result = await catalogService.listCategories({
    ...req.validatedQuery,
    includeInactive: req.path.startsWith('/admin/')
      ? req.validatedQuery.includeInactive
      : false
  });
  return success(res, result.items, { meta: result.meta });
}

async function category(req, res) {
  return success(res, await catalogService.getCategory(req.params.categoryId));
}

async function createCategory(req, res) {
  return success(res, await catalogService.createCategory(req.body), {
    statusCode: 201,
    message: 'Category created'
  });
}

async function updateCategory(req, res) {
  return success(res, await catalogService.updateCategory(req.params.categoryId, req.body), {
    message: 'Category updated'
  });
}

async function deleteCategory(req, res) {
  return success(res, await catalogService.deleteCategory(req.params.categoryId), {
    message: 'Category deactivated'
  });
}

async function services(req, res) {
  const result = await catalogService.listServices(req.validatedQuery);
  return success(res, result.items, { meta: result.meta });
}

async function managedServices(req, res) {
  const result = await catalogService.listServices(req.validatedQuery, { includeInactive: true });
  return success(res, result.items, { meta: result.meta });
}

async function service(req, res) {
  return success(res, await catalogService.getService(req.params.serviceId, req.validatedQuery));
}

async function price(req, res) {
  return success(res, await catalogService.getServicePrice(req.params.serviceId, req.validatedQuery));
}

async function createService(req, res) {
  return success(res, await catalogService.createService(req.body), {
    statusCode: 201,
    message: 'Service created'
  });
}

async function updateService(req, res) {
  return success(res, await catalogService.updateService(req.params.serviceId, req.body), {
    message: 'Service updated'
  });
}

async function deleteService(req, res) {
  return success(res, await catalogService.deleteService(req.params.serviceId), {
    message: 'Service deactivated'
  });
}

function childHandlers(resource) {
  return {
    create: async (req, res) => success(
      res,
      await catalogService[resource].create(req.params.serviceId, req.body),
      { statusCode: 201, message: `${resource === 'addons' ? 'Add-on' : 'Package'} created` }
    ),
    update: async (req, res) => success(
      res,
      await catalogService[resource].update(req.params.serviceId, req.params.childId, req.body),
      { message: `${resource === 'addons' ? 'Add-on' : 'Package'} updated` }
    ),
    remove: async (req, res) => success(
      res,
      await catalogService[resource].remove(req.params.serviceId, req.params.childId),
      { message: `${resource === 'addons' ? 'Add-on' : 'Package'} deactivated` }
    )
  };
}

const packageController = childHandlers('packages');
const addonController = childHandlers('addons');

async function createPricingRule(req, res) {
  return success(res, await catalogService.pricingRules.create(req.params.serviceId, req.body), {
    statusCode: 201,
    message: 'Pricing rule created'
  });
}

async function updatePricingRule(req, res) {
  return success(
    res,
    await catalogService.pricingRules.update(req.params.serviceId, req.params.ruleId, req.body),
    { message: 'Pricing rule updated' }
  );
}

async function deletePricingRule(req, res) {
  return success(
    res,
    await catalogService.pricingRules.remove(req.params.serviceId, req.params.ruleId),
    { message: 'Pricing rule deactivated' }
  );
}

async function setServiceAreas(req, res) {
  return success(res, await catalogService.setServiceAreas(req.params.serviceId, req.body.areaIds), {
    message: 'Service availability updated'
  });
}

async function cities(req, res) {
  const result = await catalogService.listCities({
    ...req.validatedQuery,
    includeInactive: req.path.startsWith('/admin/')
      ? req.validatedQuery.includeInactive
      : false
  });
  return success(res, result.items, { meta: result.meta });
}

async function city(req, res) {
  return success(res, await catalogService.getCity(req.params.cityId, req.path.startsWith('/admin/')));
}

async function createCity(req, res) {
  return success(res, await catalogService.createCity(req.body), {
    statusCode: 201,
    message: 'City created'
  });
}

async function updateCity(req, res) {
  return success(res, await catalogService.updateCity(req.params.cityId, req.body), {
    message: 'City updated'
  });
}

async function deleteCity(req, res) {
  return success(res, await catalogService.deleteCity(req.params.cityId), {
    message: 'City deactivated'
  });
}

async function createArea(req, res) {
  return success(res, await catalogService.createArea(req.params.cityId, req.body), {
    statusCode: 201,
    message: 'Area created'
  });
}

async function updateArea(req, res) {
  return success(res, await catalogService.updateArea(req.params.cityId, req.params.areaId, req.body), {
    message: 'Area updated'
  });
}

async function deleteArea(req, res) {
  return success(res, await catalogService.deleteArea(req.params.cityId, req.params.areaId), {
    message: 'Area deactivated'
  });
}

module.exports = {
  categories,
  category,
  createCategory,
  updateCategory,
  deleteCategory,
  services,
  managedServices,
  service,
  price,
  createService,
  updateService,
  deleteService,
  packageController,
  addonController,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  setServiceAreas,
  cities,
  city,
  createCity,
  updateCity,
  deleteCity,
  createArea,
  updateArea,
  deleteArea
};
