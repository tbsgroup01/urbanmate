const test = require('node:test');
const assert = require('node:assert/strict');
const settingsService = require('../src/modules/settings/settings.service');

test('getPublicSettings returns public branding and payment config without secret keys', async () => {
  const publicSettings = await settingsService.getPublicSettings();
  assert.ok(publicSettings.siteName);
  assert.ok(publicSettings.payment);
  // Ensure sensitive credentials are NOT exposed in public settings
  assert.equal(publicSettings.payment.razorpayKeySecret, undefined);
  assert.equal(publicSettings.payment.razorpayWebhookSecret, undefined);
  assert.equal(publicSettings.mail, undefined);
});

test('getAllSettings returns all 3 sections for admin', async () => {
  const all = await settingsService.getAllSettings();
  assert.ok(all.general);
  assert.ok(all.payment);
  assert.ok(all.mail);
});

test('updateSection validates section and persists updates', async () => {
  await assert.rejects(
    () => settingsService.updateSection('invalid_section', {}),
    /Invalid settings section/
  );

  const updatedGeneral = await settingsService.updateSection('general', {
    siteName: 'UrbanMate Verified'
  });
  assert.equal(updatedGeneral.siteName, 'UrbanMate Verified');

  const updatedPayment = await settingsService.updateSection('payment', {
    mode: 'test',
    razorpayKeyId: 'rzp_test_sample123'
  });
  assert.equal(updatedPayment.mode, 'test');
  assert.equal(updatedPayment.razorpayKeyId, 'rzp_test_sample123');
});
