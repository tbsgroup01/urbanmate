const { z } = require('zod');

const uuid = z.string().uuid();
const slug = z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const optionalText = (max) => z.string().trim().max(max).nullable().optional();
const price = z.coerce.number().min(0).max(1_000_000);
const duration = z.coerce.number().int().min(0).max(1440);
const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
};

function partialUpdateSchema(schema, message, refine) {
  const shape = Object.fromEntries(Object.entries(schema.shape).map(([key, field]) => {
    const withoutDefault = typeof field.removeDefault === 'function' ? field.removeDefault() : field;
    return [key, withoutDefault.optional()];
  }));
  let updateSchema = z.object(shape);
  if (refine) updateSchema = updateSchema.superRefine(refine);
  return updateSchema.refine((value) => Object.keys(value).length > 0, message);
}

const listCategoriesSchema = z.object({
  ...pagination,
  q: z.string().trim().max(120).optional(),
  parentId: uuid.optional(),
  includeSubcategories: z.enum(['true', 'false']).default('false').transform((value) => value === 'true')
});
const adminListCategoriesSchema = listCategoriesSchema.extend({
  includeInactive: z.enum(['true', 'false']).default('true').transform((value) => value === 'true')
});

const categorySchema = z.object({
  parentId: uuid.nullable().optional(),
  name: z.string().trim().min(2).max(100),
  slug,
  description: optionalText(5000),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
  isActive: z.boolean().default(true)
});

const updateCategorySchema = partialUpdateSchema(categorySchema, 'At least one category field is required');

const serviceImageSchema = z.object({
  imageUrl: z.string().url().max(2048),
  altText: z.string().trim().max(255).optional(),
  sortOrder: z.number().int().min(0).max(100000).default(0)
});

const serviceSchema = z.object({
  categoryId: uuid,
  name: z.string().trim().min(2).max(140),
  slug,
  shortDescription: optionalText(500),
  description: optionalText(20000),
  basePrice: price,
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  isActive: z.boolean().default(true),
  images: z.array(serviceImageSchema).max(20).default([])
});

const updateServiceSchema = partialUpdateSchema(serviceSchema, 'At least one service field is required');

const packageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalText(5000),
  price,
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  features: z.array(z.string().trim().min(1).max(500)).max(50).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0)
});
const updatePackageSchema = partialUpdateSchema(packageSchema, 'At least one package field is required');

const addonSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalText(5000),
  price,
  durationMinutes: duration.default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0)
});
const updateAddonSchema = partialUpdateSchema(addonSchema, 'At least one add-on field is required');

const pricingRuleObjectSchema = z.object({
  cityId: uuid.nullable().optional(),
  areaId: uuid.nullable().optional(),
  adjustmentType: z.enum(['fixed', 'percentage', 'multiplier']),
  adjustmentValue: z.coerce.number().min(0).max(1_000_000),
  priority: z.coerce.number().int().min(0).max(100000).default(0),
  startsAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)).nullable().optional(),
  endsAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)).nullable().optional(),
  isActive: z.boolean().default(true)
});
function validatePricingRule(value, context) {
  if (value.areaId && !value.cityId) {
    context.addIssue({ code: 'custom', path: ['cityId'], message: 'A city is required when targeting an area' });
  }
  if (value.adjustmentType === 'multiplier' && value.adjustmentValue <= 0) {
    context.addIssue({ code: 'custom', path: ['adjustmentValue'], message: 'Multiplier must be greater than zero' });
  }
  if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
    context.addIssue({ code: 'custom', path: ['endsAt'], message: 'End time must be after start time' });
  }
}
const pricingRuleSchema = pricingRuleObjectSchema.superRefine(validatePricingRule);
const updatePricingRuleSchema = partialUpdateSchema(
  pricingRuleObjectSchema,
  'At least one pricing rule field is required',
  validatePricingRule
);

const listServicesSchema = z.object({
  ...pagination,
  q: z.string().trim().max(150).optional(),
  categoryId: uuid.optional(),
  cityId: uuid.optional(),
  areaId: uuid.optional(),
  minPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  minDuration: z.coerce.number().int().min(0).max(1440).optional(),
  maxDuration: z.coerce.number().int().min(0).max(1440).optional(),
  sortBy: z.enum(['name', 'price', 'duration', 'createdAt']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc')
}).superRefine((value, context) => {
  if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
    context.addIssue({ code: 'custom', path: ['maxPrice'], message: 'maxPrice must be greater than or equal to minPrice' });
  }
  if (value.minDuration !== undefined && value.maxDuration !== undefined && value.minDuration > value.maxDuration) {
    context.addIssue({ code: 'custom', path: ['maxDuration'], message: 'maxDuration must be greater than or equal to minDuration' });
  }
  if (value.areaId && !value.cityId) {
    context.addIssue({ code: 'custom', path: ['cityId'], message: 'cityId is required when filtering by areaId' });
  }
});

const locationQuerySchema = z.object({
  cityId: uuid.optional(),
  areaId: uuid.optional()
}).superRefine((value, context) => {
  if (value.areaId && !value.cityId) {
    context.addIssue({ code: 'custom', path: ['cityId'], message: 'cityId is required when using areaId' });
  }
});

const listCitiesSchema = z.object({
  ...pagination,
  q: z.string().trim().max(120).optional(),
  countryCode: z.string().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()).optional()
});
const adminListCitiesSchema = listCitiesSchema.extend({
  includeInactive: z.enum(['true', 'false']).default('true').transform((value) => value === 'true')
});

const serviceParamsSchema = z.object({ serviceId: z.string().min(1).max(160) });
const categoryParamsSchema = z.object({ categoryId: z.string().min(1).max(160) });
const childParamsSchema = z.object({
  serviceId: uuid,
  childId: uuid
});
const pricingParamsSchema = z.object({
  serviceId: uuid,
  ruleId: uuid
});
const categoryIdParamsSchema = z.object({ categoryId: uuid });
const serviceIdParamsSchema = z.object({ serviceId: uuid });

const serviceAreasSchema = z.object({
  areaIds: z.array(uuid).max(1000)
});

const citySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug,
  countryCode: z.string().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()),
  isActive: z.boolean().default(true)
});
const updateCitySchema = partialUpdateSchema(citySchema, 'At least one city field is required');
const areaSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug,
  isActive: z.boolean().default(true)
});
const updateAreaSchema = partialUpdateSchema(areaSchema, 'At least one area field is required');
const cityParamsSchema = z.object({ cityId: uuid });
const cityIdParamsSchema = z.object({ cityId: uuid });
const areaParamsSchema = z.object({ cityId: uuid, areaId: uuid });

const listQuerySchema = z.object({
  page: pagination.page,
  limit: pagination.limit,
  categoryId: uuid.optional()
});

module.exports = {
  listQuerySchema,
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
};
