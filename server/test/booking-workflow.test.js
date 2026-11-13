const test = require('node:test');
const assert = require('node:assert/strict');
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-to-pass-validation';
process.env.NODE_ENV = 'test';

const migration = require('../src/database/migrations/202611130001-add-booking-workflow');
const { isWithinAvailability, occupyingStatuses } = require('../src/modules/bookings/booking-scheduling');
const {
  availableProvidersSchema,
  rescheduleBookingSchema
} = require('../src/modules/bookings/booking.schemas');

test('booking availability evaluates complete intervals in the provider timezone', () => {
  const window = {
    weekday: 5,
    startTime: '15:00:00',
    endTime: '17:00:00',
    timezone: 'Asia/Kolkata',
    effectiveFrom: '2026-11-13',
    effectiveUntil: null
  };
  assert.equal(isWithinAvailability(
    window,
    new Date('2026-11-13T10:00:00Z'),
    new Date('2026-11-13T11:00:00Z')
  ), true);
  assert.equal(isWithinAvailability(
    window,
    new Date('2026-11-13T11:30:00Z'),
    new Date('2026-11-13T12:30:00Z')
  ), false);
  assert.ok(occupyingStatuses.includes('provider_completed'));
});

test('availability and reschedule schemas accept offset-aware booking times', () => {
  const valid = availableProvidersSchema.safeParse({
    serviceId: '00000000-0000-4000-8000-000000000001',
    addressId: '00000000-0000-4000-8000-000000000002',
    scheduledStart: '2030-01-01T10:00:00+05:30',
    addonIds: '00000000-0000-4000-8000-000000000003'
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.addonIds.length, 1);
  assert.equal(rescheduleBookingSchema.safeParse({
    scheduledStart: '2030-01-01T10:00:00Z'
  }).success, true);
  assert.equal(rescheduleBookingSchema.safeParse({
    scheduledStart: '2030-01-01 10:00'
  }).success, false);
});

test('booking workflow migration adds persisted history and notifications', async () => {
  const tables = new Map([['bookings', {}]]);
  const indexes = [];
  let bookingStatus;
  const queryInterface = {
    async changeColumn(table, column, definition) {
      if (table === 'bookings' && column === 'status') bookingStatus = definition;
    },
    async createTable(name, columns) {
      tables.set(name, columns);
    },
    async addIndex(table, fields) {
      indexes.push({ table, fields });
    },
    async dropTable(name) {
      tables.delete(name);
    }
  };

  await migration.up(queryInterface);
  assert.ok(bookingStatus.type.values.includes('assigned'));
  assert.ok(bookingStatus.type.values.includes('provider_completed'));
  assert.ok(tables.get('booking_status_history').actor_user_id.references);
  assert.equal(tables.get('notifications').user_id.references.model, 'users');
  assert.ok(indexes.some(({ table, fields }) => table === 'booking_status_history' && fields.includes('booking_id')));
  assert.ok(indexes.some(({ table, fields }) => table === 'notifications' && fields.includes('user_id')));
});
