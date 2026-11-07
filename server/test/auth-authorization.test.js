const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-to-pass-validation';
process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const { authenticate } = require('../src/middleware/auth');
const { authorize, authorizeExclusive } = require('../src/middleware/authorization');
const { User } = require('../src/models');

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error));
  });
}

function makeToken(type = 'access', version = 0) {
  return jwt.sign(
    { sub: '00000000-0000-4000-8000-000000000001', typ: type, ver: version },
    env.JWT_SECRET,
    { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresIn: '1m' }
  );
}

test('authentication middleware attaches the active database user for valid access tokens', async (t) => {
  const originalFindByPk = User.findByPk;
  t.after(() => { User.findByPk = originalFindByPk; });
  User.findByPk = async () => ({
    id: '00000000-0000-4000-8000-000000000001',
    status: 'active',
    authVersion: 0,
    roles: [{ name: 'customer' }]
  });

  const req = { headers: { authorization: `Bearer ${makeToken()}` } };
  const error = await runMiddleware(authenticate, req);
  assert.equal(error, undefined);
  assert.equal(req.user.roles[0].name, 'customer');
});

test('authentication rejects access tokens issued before password reset', async (t) => {
  const originalFindByPk = User.findByPk;
  t.after(() => { User.findByPk = originalFindByPk; });
  User.findByPk = async () => ({
    id: '00000000-0000-4000-8000-000000000001',
    status: 'active',
    authVersion: 1,
    roles: [{ name: 'customer' }]
  });

  const req = { headers: { authorization: `Bearer ${makeToken()}` } };
  const error = await runMiddleware(authenticate, req);
  assert.equal(error.code, 'TOKEN_REVOKED');
});

test('authentication rejects tokens with a non-access purpose', async () => {
  const req = { headers: { authorization: `Bearer ${makeToken('refresh')}` } };
  const error = await runMiddleware(authenticate, req);
  assert.equal(error.code, 'INVALID_TOKEN');
});

test('authorization denies customers provider/admin access and providers admin access', async () => {
  const customerProviderError = await runMiddleware(authorizeExclusive('provider'), {
    user: { roles: [{ name: 'customer' }, { name: 'provider' }] }
  });
  const customerAdminError = await runMiddleware(authorizeExclusive('admin'), {
    user: { roles: [{ name: 'customer' }, { name: 'admin' }] }
  });
  const providerAdminError = await runMiddleware(authorizeExclusive('admin'), {
    user: { roles: [{ name: 'provider' }, { name: 'admin' }] }
  });
  const providerAccessError = await runMiddleware(authorizeExclusive('provider'), {
    user: { roles: [{ name: 'provider' }] }
  });
  const customerBookingError = await runMiddleware(authorize('customer', 'provider', 'admin'), {
    user: { roles: [{ name: 'customer' }] }
  });

  assert.equal(customerProviderError.code, 'FORBIDDEN');
  assert.equal(customerAdminError.code, 'FORBIDDEN');
  assert.equal(providerAdminError.code, 'FORBIDDEN');
  assert.equal(providerAccessError, undefined);
  assert.equal(customerBookingError, undefined);
});
