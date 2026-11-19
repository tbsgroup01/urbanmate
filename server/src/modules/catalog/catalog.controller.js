const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const catalogService = require('./catalog.service');
const { success } = require('../../utils/api-response');
const AppError = require('../../utils/app-error');

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

async function uploadImage(req, res) {
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

  const safeFilename = `svc_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const filePath = path.join(uploadsDir, safeFilename);

  await fs.promises.writeFile(filePath, buffer);

  const protocol = req.protocol;
  const host = req.get('host');
  const imageUrl = `${protocol}://${host}/uploads/${safeFilename}`;

  return success(res, { imageUrl, filename: safeFilename }, {
    statusCode: 201,
    message: 'Image uploaded successfully'
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
  uploadImage,
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
