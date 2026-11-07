const test = require('node:test');
const assert = require('node:assert/strict');
const migration = require('../src/database/migrations/202611070001-create-marketplace-schema');
const authMigration = require('../src/database/migrations/202611070002-create-auth-session-tables');
const catalogMigration = require('../src/database/migrations/202611070003-expand-service-catalog');
const bookingOptionsMigration = require('../src/database/migrations/202611070004-link-bookings-to-service-options-and-areas');

test('marketplace migration creates required tables and references existing tables', async () => {
  const tables = new Map();
  const indexes = [];
  const queryInterface = {
    async createTable(name, columns) {
      tables.set(name, columns);
    },
    async addIndex(table, fields) {
      indexes.push({ table, fields });
    }
  };

  await migration.up(queryInterface);

  const requiredTables = [
    'users', 'roles', 'user_roles', 'addresses', 'service_categories', 'services',
    'providers', 'provider_documents', 'provider_availabilities', 'provider_services',
    'bookings', 'payments', 'commissions', 'reviews'
  ];
  assert.deepEqual([...tables.keys()], requiredTables);

  for (const [table, columns] of tables) {
    for (const [columnName, column] of Object.entries(columns)) {
      const referencedTable = column.references?.model;
      if (referencedTable) {
        assert.ok(tables.has(referencedTable), `${table}.${columnName} references missing table ${referencedTable}`);
      }
    }
  }
  assert.ok(indexes.some(({ table, fields }) => table === 'bookings' && fields.includes('provider_id')));
  assert.ok(indexes.some(({ table, fields }) => table === 'provider_availabilities' && fields.includes('weekday')));
});

test('auth migration creates indexed, user-owned token and OTP tables', async () => {
  const tables = new Map();
  tables.set('users', {});
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
    }
  };

  await authMigration.up(queryInterface);
  assert.equal(tables.get('users').auth_version.defaultValue, 0);
  assert.deepEqual(
    [...tables.keys()].filter((table) => table !== 'users'),
    ['refresh_tokens', 'password_reset_tokens', 'otp_verifications']
  );
  for (const [table, columns] of tables) {
    if (table === 'users') continue;
    assert.equal(columns.user_id.references.model, 'users', `${table} must reference users`);
  }
  assert.ok(tables.get('refresh_tokens').replaced_by_token_id.references);
  assert.equal(tables.get('refresh_tokens').token_hash.unique, true);
  assert.ok(indexes.some(({ table, fields }) => table === 'otp_verifications' && fields.includes('purpose')));
});

test('catalog migration creates indexed catalog options and geographic foreign keys', async () => {
  const tables = new Map([
    ['service_categories', {}],
    ['services', {}]
  ]);
  const indexes = [];
  const constraints = [];
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
    async addConstraint(table, constraint) {
      constraints.push({ table, ...constraint });
    }
  };

  await catalogMigration.up(queryInterface);
  for (const table of ['cities', 'areas', 'service_images', 'service_packages', 'service_addons', 'service_pricing_rules', 'service_areas']) {
    assert.ok(tables.has(table), `missing ${table}`);
  }
  assert.equal(tables.get('areas').city_id.references.model, 'cities');
  assert.equal(tables.get('service_pricing_rules').area_id.references.model, 'areas');
  assert.equal(tables.get('service_areas').area_id.references.model, 'areas');
  assert.ok(indexes.some(({ table, fields }) => table === 'service_packages' && fields.includes('service_id')));
  assert.ok(constraints.some(({ table, type }) => table === 'areas' && type === 'unique'));
});

test('booking options migration links addresses and snapshots chosen catalog options', async () => {
  const tables = new Map([
    ['addresses', {}],
    ['bookings', {}],
    ['service_packages', {}],
    ['service_addons', {}]
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
    }
  };

  await bookingOptionsMigration.up(queryInterface);
  assert.equal(tables.get('addresses').city_id.references.model, 'cities');
  assert.equal(tables.get('addresses').area_id.references.model, 'areas');
  assert.equal(tables.get('booking_service_items').booking_id.references.model, 'bookings');
  assert.equal(tables.get('booking_service_items').service_package_id.onDelete, 'SET NULL');
  assert.ok(tables.get('booking_service_items').name_snapshot);
  assert.ok(indexes.some(({ table, fields }) => table === 'booking_service_items' && fields.includes('booking_id')));
});
