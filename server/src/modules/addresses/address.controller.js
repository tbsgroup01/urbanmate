const addressService = require('./address.service');
const { success } = require('../../utils/api-response');

async function list(req, res) {
  return success(res, await addressService.listAddresses(req.user.id));
}

async function create(req, res) {
  const address = await addressService.createAddress(req.user.id, req.body);
  return success(res, address, { statusCode: 201, message: 'Address created' });
}

module.exports = { list, create };
