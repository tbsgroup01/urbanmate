const settingsService = require('./settings.service');
const { success } = require('../../utils/api-response');

async function getPublic(req, res) {
  const data = await settingsService.getPublicSettings();
  return success(res, data);
}

async function getAll(req, res) {
  const data = await settingsService.getAllSettings();
  return success(res, data);
}

async function update(req, res) {
  const { section, data } = req.body || {};
  if (!section || !data) {
    return res.status(400).json({ success: false, message: 'Section and data are required' });
  }
  const result = await settingsService.updateSection(section, data);
  return success(res, result, { message: `${section} settings updated successfully` });
}

async function testEmail(req, res) {
  const { toEmail, mailSettings } = req.body || {};
  const result = await settingsService.sendTestEmail({ toEmail, mailSettings });
  return success(res, result, { message: 'Test email delivered successfully!' });
}

async function uploadAsset(req, res) {
  const { dataUrl, assetType } = req.body || {};
  const protocol = req.protocol;
  const host = req.get('host');
  const result = await settingsService.uploadSettingAsset({
    dataUrl,
    assetType,
    protocol,
    host
  });
  return success(res, result, { statusCode: 201, message: 'Asset uploaded successfully' });
}

module.exports = {
  getPublic,
  getAll,
  update,
  testEmail,
  uploadAsset
};
