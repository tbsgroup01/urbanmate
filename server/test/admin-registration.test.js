const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-to-pass-validation';
process.env.NODE_ENV = 'test';

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { authenticate } = require('../src/middleware/auth');
const errorHandler = require('../src/middleware/error-handler');
const { User, Role, UserRole, RefreshToken, sequelize } = require('../src/models');
const authRoutes = require('../src/modules/auth/auth.routes');
const authService = require('../src/modules/auth/auth.service');

test('shared login resolves the account role without allowing mixed admin roles', () => {
  assert.equal(authService.resolveLoginRole(['customer']), 'customer');
  assert.equal(authService.resolveLoginRole(['provider']), 'provider');
  assert.equal(authService.resolveLoginRole(['admin']), 'admin');
  assert.equal(authService.resolveLoginRole(['customer', 'provider']), null);
  assert.equal(authService.resolveLoginRole(['admin', 'customer']), null);
  assert.equal(authService.resolveLoginRole(['unknown']), null);
});

test('shared login returns a session for customer, provider, and admin roles', async (t) => {
  const originals = {
    findUser: User.findOne,
    createRefreshToken: RefreshToken.create,
    transaction: sequelize.transaction
  };
  const passwordHash = await bcrypt.hash('test-password', 4);
  let user;

  t.after(() => {
    User.findOne = originals.findUser;
    RefreshToken.create = originals.createRefreshToken;
    sequelize.transaction = originals.transaction;
  });

  User.findOne = async () => user;
  RefreshToken.create = async () => ({ id: 'refresh-token-record' });
  sequelize.transaction = async (callback) => callback({});

  for (const role of ['customer', 'provider', 'admin']) {
    user = {
      id: `${role}-user`,
      fullName: 'Test User',
      email: `${role}@example.test`,
      emailVerifiedAt: null,
      authVersion: 0,
      passwordHash,
      status: 'active',
      roles: [{ name: role }],
      providerProfile: null,
      save: async () => {}
    };

    const session = await authService.login(
      { email: user.email, password: 'test-password' },
      null,
      { ip: '127.0.0.1', userAgent: 'test' }
    );
    assert.deepEqual(session.user.roles, [role]);
    assert.ok(session.accessToken);
  }

  user = { ...user, roles: [{ name: 'admin' }, { name: 'customer' }] };
  await assert.rejects(
    authService.login(
      { email: user.email, password: 'test-password' },
      null,
      { ip: '127.0.0.1', userAgent: 'test' }
    ),
    { code: 'INVALID_CREDENTIALS' }
  );
});

test('admin registration protects production and permits loopback development provisioning', async (t) => {
  const originals = {
    findByPk: User.findByPk,
    findRole: Role.findOne,
    createUser: User.create,
    createUserRole: UserRole.create,
    transaction: sequelize.transaction,
    nodeEnv: env.NODE_ENV,
    allowDevAdminRegistration: env.ALLOW_DEV_ADMIN_REGISTRATION
  };
  const users = new Map([
    ['existing-admin', {
      id: 'existing-admin',
      status: 'active',
      authVersion: 0,
      roles: [{ name: 'admin' }]
    }],
    ['customer-user', {
      id: 'customer-user',
      status: 'active',
      authVersion: 0,
      roles: [{ name: 'customer' }]
    }]
  ]);
  let createdCount = 0;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    User.findByPk = originals.findByPk;
    Role.findOne = originals.findRole;
    User.create = originals.createUser;
    UserRole.create = originals.createUserRole;
    sequelize.transaction = originals.transaction;
    env.NODE_ENV = originals.nodeEnv;
    env.ALLOW_DEV_ADMIN_REGISTRATION = originals.allowDevAdminRegistration;
  });

  User.findByPk = async (id) => users.get(id) || null;
  Role.findOne = async () => ({ id: 'admin-role' });
  User.create = async (attributes) => {
    createdCount += 1;
    const user = {
      id: `created-admin-${createdCount}`,
      ...attributes,
      emailVerifiedAt: null,
      roles: [],
      providerProfile: null
    };
    users.set(user.id, user);
    return user;
  };
  UserRole.create = async ({ userId }) => {
    users.get(userId).roles = [{ name: 'admin' }];
  };
  sequelize.transaction = async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } });

  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/auth/admin/register`;

  async function registerWith(token, email, additionalHeaders = {}) {
    return fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...additionalHeaders
      },
      body: JSON.stringify({
        fullName: 'New Admin',
        email,
        password: 'a-secure-admin-password'
      })
    });
  }

  const makeToken = (userId) => jwt.sign(
    { sub: userId, typ: 'access', ver: 0 },
    env.JWT_SECRET,
    { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresIn: '1m' }
  );

  const unauthenticated = await registerWith(null, 'first-admin@example.test');
  assert.equal(unauthenticated.status, 401);

  const customerRequest = await registerWith(makeToken('customer-user'), 'first-admin@example.test');
  assert.equal(customerRequest.status, 403);

  const adminToken = makeToken('existing-admin');
  const firstAdmin = await registerWith(adminToken, 'first-admin@example.test');
  const firstPayload = await firstAdmin.json();
  assert.equal(firstAdmin.status, 201);
  assert.deepEqual(firstPayload.data.roles, ['admin']);
  assert.equal(firstPayload.data.accessToken, undefined);

  const secondAdmin = await registerWith(adminToken, 'second-admin@example.test');
  assert.equal(secondAdmin.status, 201);

  env.NODE_ENV = 'development';
  env.ALLOW_DEV_ADMIN_REGISTRATION = true;
  const localAdmin = await registerWith(null, 'local-admin@example.test', {
    'X-Forwarded-For': '203.0.113.8'
  });
  assert.equal(localAdmin.status, 201);
  assert.equal(createdCount, 3);

  env.NODE_ENV = 'production';
  const productionUnauthenticated = await registerWith(null, 'blocked-admin@example.test');
  assert.equal(productionUnauthenticated.status, 401);

  const productionAdmin = await registerWith(adminToken, 'fourth-admin@example.test');
  assert.equal(productionAdmin.status, 201);
  assert.equal(createdCount, 4);
});
