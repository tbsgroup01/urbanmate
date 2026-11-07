const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-to-pass-validation';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

test('liveness endpoint returns the API response envelope', async (t) => {
  const server = app.listen(0);
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await new Promise((resolve) => server.once('listening', resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/health/live`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.data, { status: 'ok' });
  assert.equal(body.success, true);
});
