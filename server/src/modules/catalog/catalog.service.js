const { Op, literal, where: sequelizeWhere } = require('sequelize');
const env = require('../../config/env');
const {
  sequelize,
  Service,
  ServiceCategory,
  City,
  Area,
  ServiceImage,
  ServicePackage,
  ServiceAddon,
  ServicePricingRule,
  ServiceArea
} = require('../../models');
const AppError = require('../../utils/app-error');
const { calculateEffectivePrice, roundPrice } = require('./pricing');

const publicServiceAttributes = [
  'id', 'categoryId', 'name', 'slug', 'shortDescription', 'description',
  'basePrice', 'durationMinutes', 'isActive', 'createdAt'
];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const activeRuleWhere = (location) => {
  const now = new Date();
  const locationScopes = [{ cityId: null, areaId: null }];
  if (location.cityId) locationScopes.push({ cityId: location.cityId, areaId: null });
  if (location.cityId && location.areaId) {
    locationScopes.push({ cityId: location.cityId, areaId: location.areaId });
  }
  return {
    isActive: true,
    [Op.and]: [
      { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
      { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: now } }] }
    ],
    [Op.or]: locationScopes
  };
};

function priceExpression(location) {
  const scopes = ['(rule.city_id IS NULL AND rule.area_id IS NULL)'];
  if (location.cityId) {
    const city = sequelize.escape(location.cityId);
    scopes.push(`(rule.city_id = ${city} AND rule.area_id IS NULL)`);
    if (location.areaId) scopes.push(`(rule.city_id = ${city} AND rule.area_id = ${sequelize.escape(location.areaId)})`);
  }
  const now = sequelize.escape(new Date());
  return literal(`COALESCE((
    SELECT CASE rule.adjustment_type
      WHEN 'fixed' THEN rule.adjustment_value
      WHEN 'percentage' THEN Service.base_price * (1 + rule.adjustment_value / 100)
      WHEN 'multiplier' THEN Service.base_price * rule.adjustment_value
    END
    FROM service_pricing_rules AS rule
    WHERE rule.service_id = Service.id
      AND rule.is_active = 1
      AND (rule.starts_at IS NULL OR rule.starts_at <= ${now})
      AND (rule.ends_at IS NULL OR rule.ends_at > ${now})
      AND (${scopes.join(' OR ')})
    ORDER BY (rule.area_id IS NOT NULL) DESC, (rule.city_id IS NOT NULL) DESC,
      rule.priority DESC, rule.created_at DESC
    LIMIT 1
  ), Service.base_price)`);
}

function availabilityExpression(location) {
  const city = sequelize.escape(location.cityId);
  const areaFilter = location.areaId
    ? `AND available_area.id = ${sequelize.escape(location.areaId)}`
    : '';
  return literal(`(
    NOT EXISTS (
      SELECT 1 FROM service_areas AS configured_area
      WHERE configured_area.service_id = Service.id AND configured_area.is_active = 1
    )
    OR EXISTS (
      SELECT 1
      FROM service_areas AS available_mapping
      INNER JOIN areas AS available_area ON available_area.id = available_mapping.area_id
      INNER JOIN cities AS available_city ON available_city.id = available_area.city_id
      WHERE available_mapping.service_id = Service.id
        AND available_mapping.is_active = 1
        AND available_area.is_active = 1
        AND available_city.is_active = 1
        AND available_area.city_id = ${city}
        ${areaFilter}
    )
  )`);
}

function getEffectivePrice(service, location) {
  const basePrice = Number(service.basePrice);
  return {
    basePrice: roundPrice(basePrice),
    effectivePrice: calculateEffectivePrice(basePrice, service.pricingRules || [], location)
  };
}

function addPriceFields(service, location) {
  const price = getEffectivePrice(service, location);
  const plain = service.toJSON();
  plain.basePrice = price.basePrice.toFixed(2);
  plain.effectivePrice = price.effectivePrice.toFixed(2);
  plain.currency = env.DEFAULT_CURRENCY;
  return plain;
}

function paginateMeta(page, limit, totalItems) {
  return { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) };
}

async function validateLocation(location, transaction) {
  if (!location.cityId) return;
  const city = await City.findOne({
    where: { id: location.cityId, isActive: true },
    attributes: ['id'],
    transaction
  });
  if (!city) throw new AppError('City was not found or is unavailable', 404, 'CITY_NOT_FOUND');
  if (location.areaId) {
    const area = await Area.findOne({
      where: { id: location.areaId, cityId: location.cityId, isActive: true },
      attributes: ['id'],
      transaction
    });
    if (!area) throw new AppError('Area was not found in the selected city', 404, 'AREA_NOT_FOUND');
  }
}

async function listCategories({ page = 1, limit = 100, q, parentId, includeSubcategories = false, includeInactive = false } = {}) {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (parentId) where.parentId = parentId;
  else if (includeSubcategories) where.parentId = null;
  if (q) where[Op.or] = [
    { name: { [Op.like]: `%${q}%` } },
    { description: { [Op.like]: `%${q}%` } }
  ];

  const { count, rows } = await ServiceCategory.findAndCountAll({
    where,
    attributes: ['id', 'parentId', 'name', 'slug', 'description', 'isActive', 'sortOrder', 'createdAt'],
    include: [
      { model: ServiceCategory, as: 'parent', attributes: ['id', 'name', 'slug'], required: false },
      ...(includeSubcategories ? [{
        model: ServiceCategory,
        as: 'children',
        attributes: ['id', 'name', 'slug', 'description', 'isActive', 'sortOrder'],
        where: includeInactive ? undefined : { isActive: true },
        required: false
      }] : [])
    ],
    order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true
  });
  return { items: rows, meta: paginateMeta(page, limit, count) };
}

async function getCategory(categoryId) {
  const where = uuidPattern.test(categoryId) ? { id: categoryId } : { slug: categoryId };
  const category = await ServiceCategory.findOne({
    where: { ...where, isActive: true },
    include: [
      { model: ServiceCategory, as: 'parent', attributes: ['id', 'name', 'slug'], required: false },
      {
        model: ServiceCategory,
        as: 'children',
        attributes: ['id', 'name', 'slug', 'description', 'sortOrder'],
        where: { isActive: true },
        required: false
      }
    ]
  });
  if (!category) throw new AppError('Category was not found', 404, 'CATEGORY_NOT_FOUND');
  return category;
}

async function createCategory(input) {
  if (input.parentId) {
    const parent = await ServiceCategory.findOne({ where: { id: input.parentId, isActive: true } });
    if (!parent || parent.parentId) {
      throw new AppError('Subcategories must have an active top-level category as their parent', 400, 'INVALID_CATEGORY_PARENT');
    }
  }
  return ServiceCategory.create(input);
}

async function updateCategory(categoryId, input) {
  return sequelize.transaction(async (transaction) => {
    const category = await ServiceCategory.findByPk(categoryId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!category) throw new AppError('Category was not found', 404, 'CATEGORY_NOT_FOUND');
    const nextParentId = Object.hasOwn(input, 'parentId') ? input.parentId : category.parentId;
    if (nextParentId) {
      if (nextParentId === category.id) throw new AppError('A category cannot be its own parent', 400, 'INVALID_CATEGORY_PARENT');
      const parent = await ServiceCategory.findOne({
        where: { id: nextParentId, isActive: true },
        transaction
      });
      if (!parent || parent.parentId) {
        throw new AppError('Subcategories must have an active top-level category as their parent', 400, 'INVALID_CATEGORY_PARENT');
      }
    }
    if (!nextParentId && category.parentId) {
      const childCount = await ServiceCategory.count({
        where: { parentId: category.id, isActive: true },
        transaction
      });
      if (childCount > 0) {
        throw new AppError('Move or deactivate subcategories before making this a subcategory', 409, 'CATEGORY_HAS_CHILDREN');
      }
    }
    if (nextParentId && !category.parentId) {
      const childCount = await ServiceCategory.count({
        where: { parentId: category.id, isActive: true },
        transaction
      });
      if (childCount > 0) {
        throw new AppError('A category with subcategories cannot become a subcategory', 409, 'CATEGORY_HAS_CHILDREN');
      }
    }
    await category.update(input, { transaction });
    if (input.isActive === false) {
      await ServiceCategory.update(
        { isActive: false },
        { where: { parentId: category.id, isActive: true }, transaction }
      );
    }
    return category;
  });
}

async function deleteCategory(categoryId) {
  return sequelize.transaction(async (transaction) => {
    const category = await ServiceCategory.findByPk(categoryId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!category) throw new AppError('Category was not found', 404, 'CATEGORY_NOT_FOUND');
    await category.update({ isActive: false }, { transaction });
    await ServiceCategory.update(
      { isActive: false },
      { where: { parentId: category.id, isActive: true }, transaction }
    );
    return { id: category.id, isActive: false };
  });
}

function activeCategoryInclude(includeInactive = false) {
  return {
    model: ServiceCategory,
    as: 'category',
    attributes: ['id', 'name', 'slug', 'parentId'],
    where: includeInactive ? undefined : { isActive: true },
    required: true,
    include: [{
      model: ServiceCategory,
      as: 'parent',
      attributes: ['id', 'name', 'slug'],
      where: includeInactive ? undefined : { isActive: true },
      required: false
    }]
  };
}

function makeServiceIncludes({ includeInactive = false, location = {}, detailed = false } = {}) {
  const active = includeInactive ? undefined : { isActive: true };
  const includes = [
    activeCategoryInclude(includeInactive),
    {
      model: ServiceImage,
      as: 'images',
      attributes: ['id', 'imageUrl', 'altText', 'sortOrder'],
      where: active,
      required: false,
      separate: true,
      order: [['sortOrder', 'ASC']]
    },
    {
      model: ServicePricingRule,
      as: 'pricingRules',
      attributes: ['id', 'cityId', 'areaId', 'adjustmentType', 'adjustmentValue', 'priority', 'startsAt', 'endsAt', 'createdAt'],
      where: activeRuleWhere(location),
      required: false,
      separate: true
    }
  ];

  if (location.cityId && detailed) {
    includes.push({
      model: Area,
      as: 'availableAreas',
      attributes: ['id', 'name', 'slug', 'cityId'],
      where: {
        isActive: true,
        ...(location.areaId ? { id: location.areaId } : {})
      },
      through: { attributes: [], where: { isActive: true } },
      include: [{
        model: City,
        as: 'city',
        attributes: ['id', 'name', 'slug'],
        where: { id: location.cityId, isActive: true },
        required: true
      }],
      required: false
    });
  } else if (detailed) {
    includes.push({
      model: Area,
      as: 'availableAreas',
      attributes: ['id', 'name', 'slug', 'cityId'],
      where: { isActive: true },
      through: { attributes: [], where: { isActive: true } },
      include: [{
        model: City,
        as: 'city',
        attributes: ['id', 'name', 'slug'],
        where: { isActive: true },
        required: true
      }],
      required: false
    });
  }

  if (detailed) {
    includes.push(
      {
        model: ServicePackage,
        as: 'packages',
        attributes: ['id', 'name', 'description', 'price', 'durationMinutes', 'features', 'sortOrder'],
        where: active,
        required: false,
        separate: true,
        order: [['sortOrder', 'ASC']]
      },
      {
        model: ServiceAddon,
        as: 'addons',
        attributes: ['id', 'name', 'description', 'price', 'durationMinutes', 'sortOrder'],
        where: active,
        required: false,
        separate: true,
        order: [['sortOrder', 'ASC']]
      }
    );
  }
  return includes;
}

function buildServiceWhere(filters, includeInactive) {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (filters.q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filters.q}%` } },
      { shortDescription: { [Op.like]: `%${filters.q}%` } },
      { description: { [Op.like]: `%${filters.q}%` } }
    ];
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.minDuration !== undefined) where.durationMinutes = { ...(where.durationMinutes || {}), [Op.gte]: filters.minDuration };
  if (filters.maxDuration !== undefined) where.durationMinutes = { ...(where.durationMinutes || {}), [Op.lte]: filters.maxDuration };
  return where;
}

async function listServices(filters, { includeInactive = false } = {}) {
  const location = { cityId: filters.cityId, areaId: filters.areaId };
  await validateLocation(location);
  const where = buildServiceWhere(filters, includeInactive);
  if (location.cityId) {
    where[Op.and] = [...(where[Op.and] || []), availabilityExpression(location)];
  }
  if (filters.categoryId) {
    const category = await ServiceCategory.findOne({
      where: { id: filters.categoryId, ...(includeInactive ? {} : { isActive: true }) },
      attributes: ['id', 'parentId']
    });
    if (!category) throw new AppError('Category was not found or is unavailable', 404, 'CATEGORY_NOT_FOUND');
    const childIds = category.parentId
      ? []
      : await ServiceCategory.findAll({
        where: { parentId: category.id, ...(includeInactive ? {} : { isActive: true }) },
        attributes: ['id']
      }).then((children) => children.map((child) => child.id));
    where.categoryId = { [Op.in]: [category.id, ...childIds] };
  }
  const selectedPrice = priceExpression(location);
  if (filters.minPrice !== undefined) where[Op.and] = [
    ...(where[Op.and] || []),
    sequelizeWhere(selectedPrice, { [Op.gte]: filters.minPrice })
  ];
  if (filters.maxPrice !== undefined) where[Op.and] = [
    ...(where[Op.and] || []),
    sequelizeWhere(selectedPrice, { [Op.lte]: filters.maxPrice })
  ];

  const sortFields = {
    name: [['name', filters.order.toUpperCase()]],
    price: [[selectedPrice, filters.order.toUpperCase()]],
    duration: [['durationMinutes', filters.order.toUpperCase()]],
    createdAt: [['createdAt', filters.order.toUpperCase()]]
  };
  const { count, rows } = await Service.findAndCountAll({
    where,
    attributes: [...publicServiceAttributes, [selectedPrice, 'effectivePrice']],
    include: makeServiceIncludes({ includeInactive, location }),
    order: [...sortFields[filters.sortBy], ['id', 'ASC']],
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    distinct: true,
    subQuery: true
  });

  return {
    items: rows.map((row) => addPriceFields(row, location)),
    meta: paginateMeta(filters.page, filters.limit, count)
  };
}

async function getService(serviceId, location = {}) {
  await validateLocation(location);
  const identity = uuidPattern.test(serviceId) ? { id: serviceId } : { slug: serviceId };
  const where = { ...identity, isActive: true };
  if (location.cityId) where[Op.and] = [availabilityExpression(location)];
  const service = await Service.findOne({
    where,
    attributes: [...publicServiceAttributes, [priceExpression(location), 'effectivePrice']],
    include: makeServiceIncludes({ location, detailed: true })
  });
  if (!service) throw new AppError('Service was not found', 404, 'SERVICE_NOT_FOUND');
  if (location.areaId && service.availableAreas.length === 0) {
    const availabilityConfigured = await ServiceArea.count({
      where: { serviceId: service.id, isActive: true }
    });
    if (availabilityConfigured > 0) {
      throw new AppError('Service is not available in the selected area', 404, 'SERVICE_NOT_AVAILABLE');
    }
  }
  return addPriceFields(service, location);
}

async function listCities(filters) {
  const where = filters.includeInactive ? {} : { isActive: true };
  if (filters.countryCode) where.countryCode = filters.countryCode;
  if (filters.q) where.name = { [Op.like]: `%${filters.q}%` };
  const { count, rows } = await City.findAndCountAll({
    where,
    attributes: ['id', 'name', 'slug', 'countryCode'],
    include: [{
      model: Area,
      as: 'areas',
      attributes: ['id', 'name', 'slug'],
      where: filters.includeInactive ? undefined : { isActive: true },
      required: false
    }],
    order: [['name', 'ASC'], [{ model: Area, as: 'areas' }, 'name', 'ASC']],
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    distinct: true
  });
  return { items: rows, meta: paginateMeta(filters.page, filters.limit, count) };
}

async function getCity(cityId, includeInactive = false) {
  const identity = uuidPattern.test(cityId) ? { id: cityId } : { slug: cityId };
  const city = await City.findOne({
    where: { ...identity, ...(includeInactive ? {} : { isActive: true }) },
    attributes: ['id', 'name', 'slug', 'countryCode'],
    include: [{
      model: Area,
      as: 'areas',
      attributes: ['id', 'name', 'slug'],
      where: includeInactive ? undefined : { isActive: true },
      required: false
    }],
    order: [[{ model: Area, as: 'areas' }, 'name', 'ASC']]
  });
  if (!city) throw new AppError('City was not found', 404, 'CITY_NOT_FOUND');
  return city;
}

async function createCity(input) {
  return City.create(input);
}

async function updateCity(cityId, input) {
  const city = await City.findByPk(cityId);
  if (!city) throw new AppError('City was not found', 404, 'CITY_NOT_FOUND');
  await city.update(input);
  return city;
}

async function deleteCity(cityId) {
  return sequelize.transaction(async (transaction) => {
    const city = await City.findByPk(cityId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!city) throw new AppError('City was not found', 404, 'CITY_NOT_FOUND');
    await city.update({ isActive: false }, { transaction });
    const areas = await Area.findAll({ where: { cityId: city.id }, attributes: ['id'], transaction });
    const areaIds = areas.map((area) => area.id);
    await ServicePricingRule.update(
      { isActive: false },
      { where: { cityId: city.id }, transaction }
    );
    if (areaIds.length) {
      await Promise.all([
        Area.update({ isActive: false }, { where: { id: { [Op.in]: areaIds } }, transaction }),
        ServiceArea.update({ isActive: false }, { where: { areaId: { [Op.in]: areaIds } }, transaction })
      ]);
    }
    return { id: city.id, isActive: false };
  });
}

async function createArea(cityId, input) {
  const city = await City.findOne({ where: { id: cityId, isActive: true } });
  if (!city) throw new AppError('Active city was not found', 404, 'CITY_NOT_FOUND');
  return Area.create({ ...input, cityId });
}

async function updateArea(cityId, areaId, input) {
  const area = await Area.findOne({ where: { id: areaId, cityId } });
  if (!area) throw new AppError('Area was not found', 404, 'AREA_NOT_FOUND');
  await area.update(input);
  return area;
}

async function deleteArea(cityId, areaId) {
  return sequelize.transaction(async (transaction) => {
    const area = await Area.findOne({ where: { id: areaId, cityId }, transaction, lock: transaction.LOCK.UPDATE });
    if (!area) throw new AppError('Area was not found', 404, 'AREA_NOT_FOUND');
    await area.update({ isActive: false }, { transaction });
    await Promise.all([
      ServiceArea.update({ isActive: false }, { where: { areaId }, transaction }),
      ServicePricingRule.update({ isActive: false }, { where: { areaId }, transaction })
    ]);
    return { id: area.id, isActive: false };
  });
}

async function assertActiveCategory(categoryId, transaction) {
  const category = await ServiceCategory.findOne({
    where: { id: categoryId, isActive: true },
    include: [{ model: ServiceCategory, as: 'parent', attributes: ['id', 'isActive'], required: false }],
    transaction
  });
  if (!category || (category.parent && !category.parent.isActive)) {
    throw new AppError('Active service category was not found', 400, 'INVALID_SERVICE_CATEGORY');
  }
}

async function createService(input) {
  return sequelize.transaction(async (transaction) => {
    await assertActiveCategory(input.categoryId, transaction);
    const { images, ...attributes } = input;
    const service = await Service.create(attributes, { transaction });
    if (images.length) {
      await ServiceImage.bulkCreate(images.map((image) => ({ ...image, serviceId: service.id })), { transaction });
    }
    return service;
  });
}

async function updateService(serviceId, input) {
  return sequelize.transaction(async (transaction) => {
    const service = await Service.findByPk(serviceId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!service) throw new AppError('Service was not found', 404, 'SERVICE_NOT_FOUND');
    if (input.categoryId) await assertActiveCategory(input.categoryId, transaction);
    const { images, ...attributes } = input;
    await service.update(attributes, { transaction });
    if (images) {
      await ServiceImage.destroy({ where: { serviceId }, transaction });
      if (images.length) {
        await ServiceImage.bulkCreate(images.map((image) => ({ ...image, serviceId })), { transaction });
      }
    }
    return service;
  });
}

async function deleteService(serviceId) {
  return sequelize.transaction(async (transaction) => {
    const service = await Service.findByPk(serviceId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!service) throw new AppError('Service was not found', 404, 'SERVICE_NOT_FOUND');
    await service.update({ isActive: false }, { transaction });
    await Promise.all([
      ServicePackage.update({ isActive: false }, { where: { serviceId }, transaction }),
      ServiceAddon.update({ isActive: false }, { where: { serviceId }, transaction }),
      ServicePricingRule.update({ isActive: false }, { where: { serviceId }, transaction }),
      ServiceArea.update({ isActive: false }, { where: { serviceId }, transaction })
    ]);
    return { id: service.id, isActive: false };
  });
}

async function getManagedChild(Model, serviceId, childId, transaction) {
  const service = await Service.findByPk(serviceId, { attributes: ['id'], transaction });
  if (!service) throw new AppError('Service was not found', 404, 'SERVICE_NOT_FOUND');
  const child = await Model.findOne({ where: { id: childId, serviceId }, transaction });
  if (!child) throw new AppError('Service item was not found', 404, 'SERVICE_ITEM_NOT_FOUND');
  return child;
}

function makeChildManagement(Model, resourceName) {
  return {
    async create(serviceId, input) {
      const service = await Service.findByPk(serviceId, { attributes: ['id'] });
      if (!service) throw new AppError('Service was not found', 404, 'SERVICE_NOT_FOUND');
      return Model.create({ ...input, serviceId });
    },
    async update(serviceId, childId, input) {
      return sequelize.transaction(async (transaction) => {
        const child = await getManagedChild(Model, serviceId, childId, transaction);
        await child.update(input, { transaction });
        return child;
      });
    },
    async remove(serviceId, childId) {
      return sequelize.transaction(async (transaction) => {
        const child = await getManagedChild(Model, serviceId, childId, transaction);
        await child.update({ isActive: false }, { transaction });
        return { id: child.id, isActive: false, resource: resourceName };
      });
    }
  };
}

const packages = makeChildManagement(ServicePackage, 'package');
const addons = makeChildManagement(ServiceAddon, 'add-on');

async function validatePricingLocation(input, transaction) {
  if (!input.cityId) return;
  const city = await City.findOne({ where: { id: input.cityId, isActive: true }, transaction });
  if (!city) throw new AppError('City was not found or is unavailable', 400, 'INVALID_PRICING_CITY');
  if (input.areaId) {
    const area = await Area.findOne({
      where: { id: input.areaId, cityId: input.cityId, isActive: true },
      transaction
    });
    if (!area) throw new AppError('Area does not belong to the selected city', 400, 'INVALID_PRICING_AREA');
  }
}

const pricingRules = {
  async create(serviceId, input) {
    return sequelize.transaction(async (transaction) => {
      const service = await Service.findByPk(serviceId, { attributes: ['id'], transaction });
      if (!service) throw new AppError('Service was not found', 404, 'SERVICE_NOT_FOUND');
      await validatePricingLocation(input, transaction);
      return ServicePricingRule.create({ ...input, serviceId }, { transaction });
    });
  },
  async update(serviceId, ruleId, input) {
    return sequelize.transaction(async (transaction) => {
      const rule = await getManagedChild(ServicePricingRule, serviceId, ruleId, transaction);
      const next = { ...rule.get({ plain: true }), ...input };
      await validatePricingLocation(next, transaction);
      await rule.update(input, { transaction });
      return rule;
    });
  },
  async remove(serviceId, ruleId) {
    return sequelize.transaction(async (transaction) => {
      const rule = await getManagedChild(ServicePricingRule, serviceId, ruleId, transaction);
      await rule.update({ isActive: false }, { transaction });
      return { id: rule.id, isActive: false };
    });
  }
};

async function setServiceAreas(serviceId, areaIds) {
  return sequelize.transaction(async (transaction) => {
    const service = await Service.findByPk(serviceId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!service) throw new AppError('Service was not found', 404, 'SERVICE_NOT_FOUND');
    const uniqueAreaIds = [...new Set(areaIds)];
    const areas = uniqueAreaIds.length ? await Area.findAll({
      where: { id: { [Op.in]: uniqueAreaIds }, isActive: true },
      attributes: ['id'],
      transaction
    }) : [];
    if (areas.length !== uniqueAreaIds.length) {
      throw new AppError('One or more areas are unavailable', 400, 'INVALID_SERVICE_AREAS');
    }

    await ServiceArea.destroy({ where: { serviceId }, transaction });
    if (uniqueAreaIds.length) {
      await ServiceArea.bulkCreate(uniqueAreaIds.map((areaId) => ({ serviceId, areaId, isActive: true })), { transaction });
    }
    return { serviceId, areaIds: uniqueAreaIds };
  });
}

async function getServicePrice(serviceId, location) {
  const service = await getService(serviceId, location);
  return {
    serviceId: service.id,
    basePrice: service.basePrice,
    effectivePrice: service.effectivePrice,
    currency: env.DEFAULT_CURRENCY,
    location,
    durationMinutes: service.durationMinutes
  };
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  listServices,
  getService,
  listCities,
  getCity,
  createCity,
  updateCity,
  deleteCity,
  createArea,
  updateArea,
  deleteArea,
  createService,
  updateService,
  deleteService,
  packages,
  addons,
  pricingRules,
  setServiceAreas,
  getServicePrice
};
