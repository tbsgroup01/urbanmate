const test = require('node:test');
const assert = require('node:assert/strict');
const {
  registerSchema,
  loginSchema,
  providerRegisterSchema,
  resetPasswordSchema,
  otpVerifySchema
} = require('../src/modules/auth/auth.schemas');
const { createBookingSchema, listBookingsSchema } = require('../src/modules/bookings/booking.schemas');
const { listQuerySchema } = require('../src/modules/catalog/catalog.schemas');
const { createAddressSchema } = require('../src/modules/addresses/address.schemas');

test('registration normalizes email and rejects short passwords', () => {
  const valid = registerSchema.parse({
    fullName: 'Alex Customer',
    email: 'ALEX@example.com',
    password: 'long-enough-password',
    role: 'admin'
  });
  assert.equal(valid.email, 'alex@example.com');
  assert.equal('role' in valid, false);
  assert.equal(registerSchema.safeParse({
    fullName: 'Alex Customer',
    email: 'alex@example.com',
    password: 'short'
  }).success, false);
});

test('login validates and normalizes email', () => {
  assert.equal(loginSchema.parse({ email: 'USER@example.com', password: 'secret' }).email, 'user@example.com');
  assert.equal(loginSchema.safeParse({ email: 'not-an-email', password: 'secret' }).success, false);
  assert.equal(loginSchema.safeParse({ email: 'user@example.com', password: 'é'.repeat(37) }).success, false);
});

test('provider registration requires a provider profile and a bcrypt-safe password', () => {
  const valid = providerRegisterSchema.safeParse({
    fullName: 'Taylor Provider',
    displayName: 'Taylor Services',
    email: 'provider@example.com',
    password: 'a-secure-provider-password'
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.experienceYears, 0);
  assert.equal(registerSchema.safeParse({
    fullName: 'Alex Customer',
    email: 'alex@example.com',
    password: 'é'.repeat(37)
  }).success, false);
});

test('password reset and OTP schemas validate opaque tokens and six-digit codes', () => {
  assert.equal(resetPasswordSchema.safeParse({
    token: 'A'.repeat(43),
    password: 'a-secure-new-password'
  }).success, true);
  assert.equal(otpVerifySchema.safeParse({ code: '123456' }).success, true);
  assert.equal(otpVerifySchema.safeParse({ code: '12345x' }).success, false);
});

test('catalog pagination applies safe defaults and caps page size', () => {
  assert.deepEqual(listQuerySchema.parse({}), { page: 1, limit: 20 });
  assert.equal(listQuerySchema.safeParse({ limit: '101' }).success, false);
});

test('booking input requires a valid service, address, and offset-aware datetime', () => {
  const valid = createBookingSchema.safeParse({
    serviceId: '00000000-0000-4000-8000-000000000001',
    addressId: '00000000-0000-4000-8000-000000000002',
    scheduledStart: '2030-01-01T10:00:00Z'
  });
  assert.equal(valid.success, true);
  assert.ok(valid.data.scheduledStart instanceof Date);
  assert.equal(createBookingSchema.safeParse({
    serviceId: 'bad',
    addressId: 'bad',
    scheduledStart: 'not-a-date'
  }).success, false);
});

test('booking list pagination applies defaults', () => {
  assert.deepEqual(listBookingsSchema.parse({}), { page: 1, limit: 20 });
});

test('address validation normalizes country codes and bounds coordinates', () => {
  const address = createAddressSchema.parse({
    label: 'Home',
    line1: '10 Main Street',
    city: 'Springfield',
    postalCode: '10000',
    countryCode: 'us',
    latitude: 40,
    longitude: -70
  });
  assert.equal(address.countryCode, 'US');
  assert.equal(createAddressSchema.safeParse({
    label: 'Home',
    line1: '10 Main Street',
    city: 'Springfield',
    postalCode: '10000',
    countryCode: 'USA',
    latitude: 200
  }).success, false);
});
