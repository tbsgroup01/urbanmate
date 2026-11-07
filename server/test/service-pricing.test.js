const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateEffectivePrice } = require('../src/modules/catalog/pricing');

const now = new Date('2026-11-07T10:00:00Z');

test('effective pricing prefers area rules, then city rules, then global rules', () => {
  const rules = [
    { adjustmentType: 'percentage', adjustmentValue: 5, priority: 10, isActive: true, cityId: null, areaId: null },
    { adjustmentType: 'percentage', adjustmentValue: 10, priority: 1, isActive: true, cityId: 'city', areaId: null },
    { adjustmentType: 'fixed', adjustmentValue: 120, priority: 1, isActive: true, cityId: 'city', areaId: 'area' }
  ];

  assert.equal(calculateEffectivePrice(100, rules, {}, now), 105);
  assert.equal(calculateEffectivePrice(100, rules, { cityId: 'city' }, now), 110);
  assert.equal(calculateEffectivePrice(100, rules, { cityId: 'city', areaId: 'area' }, now), 120);
});

test('effective pricing respects priority, time windows, and adjustment types', () => {
  const rules = [
    { adjustmentType: 'fixed', adjustmentValue: 200, priority: 1, isActive: true, cityId: null, areaId: null },
    { adjustmentType: 'multiplier', adjustmentValue: 1.5, priority: 2, isActive: true, cityId: null, areaId: null },
    { adjustmentType: 'fixed', adjustmentValue: 1, priority: 100, isActive: false, cityId: null, areaId: null },
    { adjustmentType: 'fixed', adjustmentValue: 2, priority: 100, isActive: true, startsAt: new Date('2027-01-01'), cityId: null, areaId: null }
  ];

  assert.equal(calculateEffectivePrice(100, rules, {}, now), 150);
  assert.equal(calculateEffectivePrice(100, [
    { adjustmentType: 'percentage', adjustmentValue: 12.5, priority: 0, isActive: true, cityId: null, areaId: null }
  ], {}, now), 112.5);
});
