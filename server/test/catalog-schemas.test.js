const test = require('node:test');
const assert = require('node:assert/strict');
const {
  categorySchema,
  updateCategorySchema,
  serviceSchema,
  updateServiceSchema,
  packageSchema,
  addonSchema,
  pricingRuleSchema,
  updatePricingRuleSchema,
  listServicesSchema,
  citySchema,
  updateCitySchema,
  areaSchema,
  updateAreaSchema,
  updateAddonSchema,
  updatePackageSchema,
  serviceAreasSchema
} = require('../src/modules/catalog/catalog.schemas');

const categoryId = '00000000-0000-4000-8000-000000000001';
const cityId = '00000000-0000-4000-8000-000000000002';
const areaId = '00000000-0000-4000-8000-000000000003';

test('category schemas support parent categories and reject empty updates', () => {
  assert.equal(categorySchema.safeParse({
    name: 'Cleaning',
    slug: 'cleaning'
  }).success, true);
  assert.equal(categorySchema.safeParse({
    parentId: categoryId,
    name: 'Deep cleaning',
    slug: 'deep-cleaning'
  }).success, true);
  assert.equal(updateCategorySchema.safeParse({}).success, false);
  assert.equal(updateCategorySchema.safeParse({ sortOrder: 5 }).data.sortOrder, 5);
});

test('service schemas validate descriptions, images, pricing, and estimated duration', () => {
  const service = serviceSchema.safeParse({
    categoryId,
    name: 'Deep cleaning',
    slug: 'deep-cleaning',
    description: 'Detailed service description',
    basePrice: '89.50',
    durationMinutes: '180',
    images: [{ imageUrl: 'https://cdn.example.test/deep-cleaning.jpg', altText: 'Clean room' }]
  });
  assert.equal(service.success, true);
  assert.equal(service.data.basePrice, 89.5);
  assert.equal(updateServiceSchema.safeParse({ isActive: false }).success, true);
  assert.equal(updateServiceSchema.safeParse({}).success, false);
  assert.equal(serviceSchema.safeParse({
    categoryId,
    name: 'Cleaning',
    slug: 'cleaning',
    basePrice: -1,
    durationMinutes: 20
  }).success, false);
});

test('package and add-on schemas validate selectable prices and duration', () => {
  assert.equal(packageSchema.safeParse({
    name: 'Premium',
    price: 120,
    durationMinutes: 180,
    features: ['Inside cabinets']
  }).success, true);
  assert.equal(addonSchema.safeParse({ name: 'Oven cleaning', price: 20 }).success, true);
  assert.equal(addonSchema.safeParse({ name: 'Oven cleaning', price: 20, durationMinutes: -1 }).success, false);
  assert.equal(updatePackageSchema.safeParse({}).success, false);
  assert.equal(updateAddonSchema.safeParse({}).success, false);
});

test('dynamic pricing supports location rules and safe partial updates', () => {
  assert.equal(pricingRuleSchema.safeParse({
    cityId,
    areaId,
    adjustmentType: 'percentage',
    adjustmentValue: 15
  }).success, true);
  assert.equal(pricingRuleSchema.safeParse({
    areaId,
    adjustmentType: 'fixed',
    adjustmentValue: 20
  }).success, false);
  assert.equal(updatePricingRuleSchema.safeParse({ adjustmentValue: 20 }).success, true);
  assert.equal(updatePricingRuleSchema.safeParse({}).success, false);
  assert.equal(updatePricingRuleSchema.safeParse({ areaId }).success, false);
});

test('service filters validate location, price ranges, and pagination', () => {
  assert.deepEqual(listServicesSchema.parse({}), {
    page: 1,
    limit: 20,
    sortBy: 'name',
    order: 'asc'
  });
  assert.equal(listServicesSchema.safeParse({ areaId }).success, false);
  assert.equal(listServicesSchema.safeParse({ minPrice: 100, maxPrice: 20 }).success, false);
  assert.equal(listServicesSchema.safeParse({ cityId, areaId, minPrice: 20, maxPrice: 100 }).success, true);
});

test('city and service availability schemas validate the geographic hierarchy', () => {
  assert.equal(citySchema.safeParse({ name: 'Metro', slug: 'metro', countryCode: 'us' }).success, true);
  assert.equal(areaSchema.safeParse({ name: 'Central', slug: 'central' }).success, true);
  assert.equal(updateCitySchema.safeParse({}).success, false);
  assert.equal(updateAreaSchema.safeParse({}).success, false);
  assert.equal(serviceAreasSchema.safeParse({ areaIds: [areaId] }).success, true);
});
