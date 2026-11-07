const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-to-pass-validation';
process.env.NODE_ENV = 'test';

const schemas = require('../src/modules/providers/provider.schemas');
const { providerRegisterSchema } = require('../src/modules/auth/auth.schemas');
const { ProviderDocument } = require('../src/models');
const {
  hasCurrentIdentityDocuments,
  isProviderBookable
} = require('../src/modules/providers/provider-verification');
const migration = require('../src/database/migrations/202611070005-expand-provider-management');

test('provider onboarding schemas validate profile details, documents, and admin decisions', () => {
  const registration = providerRegisterSchema.safeParse({
    fullName: 'Jordan Provider',
    email: 'jordan@example.test',
    password: 'a-secure-provider-password',
    displayName: 'Jordan Home Care',
    legalName: 'Jordan Example',
    dateOfBirth: '1989-03-14',
    professionalTitle: 'Home Care Specialist'
  });
  assert.equal(registration.success, true);

  assert.equal(schemas.documentUploadSchema.safeParse({
    documentType: 'identity_front',
    contentType: 'image/jpeg',
    fileSizeBytes: 500_000
  }).success, true);
  assert.equal(schemas.documentUploadSchema.safeParse({
    documentType: 'identity_front',
    contentType: 'text/html',
    fileSizeBytes: 500
  }).success, false);
  assert.equal(schemas.documentReviewSchema.safeParse({ status: 'rejected' }).success, false);
  assert.equal(schemas.providerDecisionSchema.safeParse({ status: 'rejected' }).success, false);
  assert.equal(schemas.providerDecisionSchema.safeParse({ status: 'approved' }).success, true);
});

test('provider configuration validates service selections, areas, and non-overlapping working hours', () => {
  const serviceId = '00000000-0000-4000-8000-000000000001';
  const areaId = '00000000-0000-4000-8000-000000000002';
  assert.equal(schemas.providerServicesSchema.safeParse({
    services: [{ serviceId, customPrice: 75 }]
  }).success, true);
  assert.equal(schemas.providerServicesSchema.safeParse({
    services: [{ serviceId }, { serviceId }]
  }).success, false);
  assert.equal(schemas.providerAreasSchema.safeParse({ areaIds: [areaId, areaId] }).success, false);
  assert.equal(schemas.providerAvailabilitySchema.safeParse({
    availability: [
      { weekday: 1, startTime: '09:00', endTime: '12:00', timezone: 'Asia/Kolkata' },
      { weekday: 1, startTime: '11:00', endTime: '13:00', timezone: 'Asia/Kolkata' }
    ]
  }).success, false);
  assert.equal(schemas.providerAvailabilitySchema.safeParse({
    availability: [{ weekday: 8, startTime: '09:00', endTime: '12:00', timezone: 'UTC' }]
  }).success, false);
});

test('provider identity requires the latest approved, uploaded front and back documents', async (t) => {
  const originalFindAll = ProviderDocument.findAll;
  t.after(() => { ProviderDocument.findAll = originalFindAll; });
  const now = new Date('2026-11-07T10:00:00Z');
  const currentDocuments = [
    { documentType: 'identity_front', status: 'approved', expiresAt: null },
    { documentType: 'identity_back', status: 'approved', expiresAt: '2027-01-01' }
  ];
  ProviderDocument.findAll = async () => currentDocuments;
  assert.equal(await hasCurrentIdentityDocuments('provider-id', undefined, now), true);

  ProviderDocument.findAll = async () => [
    { documentType: 'identity_front', status: 'pending', expiresAt: null, createdAt: new Date('2026-11-01') },
    { documentType: 'identity_front', status: 'approved', expiresAt: null, createdAt: new Date('2026-01-01') },
    { documentType: 'identity_back', status: 'approved', expiresAt: null }
  ];
  assert.equal(await hasCurrentIdentityDocuments('provider-id', undefined, now), false);

  ProviderDocument.findAll = async () => [
    { documentType: 'identity_front', status: 'approved', expiresAt: '2026-11-06' },
    { documentType: 'identity_back', status: 'approved', expiresAt: null }
  ];
  assert.equal(await hasCurrentIdentityDocuments('provider-id', undefined, now), false);
});

test('booking eligibility requires an active, email-verified, online, identity-verified approved provider', () => {
  const provider = {
    approvalStatus: 'approved',
    identityVerified: true,
    isOnline: true
  };
  const user = { status: 'active', emailVerifiedAt: new Date() };
  assert.equal(isProviderBookable(provider, user, true), true);
  assert.equal(isProviderBookable({ ...provider, identityVerified: false }, user, true), false);
  assert.equal(isProviderBookable({ ...provider, approvalStatus: 'pending' }, user, true), false);
  assert.equal(isProviderBookable({ ...provider, isOnline: false }, user, true), false);
  assert.equal(isProviderBookable(provider, { ...user, status: 'suspended' }, true), false);
  assert.equal(isProviderBookable(provider, { ...user, emailVerifiedAt: null }, true), false);
  assert.equal(isProviderBookable(provider, user, false), false);
});

test('provider management migration adds verification and online state plus indexed coverage mapping', async () => {
  const providers = {};
  const documents = {};
  const tables = new Map([
    ['providers', providers],
    ['provider_documents', documents]
  ]);
  const indexes = [];
  const queryInterface = {
    async addColumn(table, name, definition) {
      tables.get(table)[name] = definition;
    },
    async createTable(name, columns) {
      tables.set(name, columns);
    },
    async addIndex(table, fields) {
      indexes.push({ table, fields });
    },
    async removeColumn(table, name) {
      delete tables.get(table)[name];
    },
    async dropTable(name) {
      tables.delete(name);
    }
  };
  await migration.up(queryInterface);
  assert.equal(providers.identity_verified.defaultValue, false);
  assert.equal(providers.approval_reviewed_by.references.model, 'users');
  assert.equal(documents.uploaded_at, DataTypes.DATE);
  assert.equal(tables.get('provider_areas').area_id.references.model, 'areas');
  assert.ok(indexes.some(({ table, fields }) => table === 'provider_areas' && fields.includes('area_id')));
});

const { DataTypes } = require('sequelize');
