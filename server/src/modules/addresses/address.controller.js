const addressService = require('./address.service');
const { success } = require('../../utils/api-response');

async function list(req, res) {
  return success(res, await addressService.listAddresses(req.user.id));
}

async function create(req, res) {
  const address = await addressService.createAddress(req.user.id, req.body);
  return success(res, address, { statusCode: 201, message: 'Address created' });
}

async function remove(req, res) {
  await addressService.deleteAddress(req.user.id, req.params.addressId);
  return success(res, { deleted: true }, { message: 'Address deleted successfully' });
}

async function update(req, res) {
  const address = await addressService.updateAddress(req.user.id, req.params.addressId, req.body);
  return success(res, address, { message: 'Address updated successfully' });
}

module.exports = { list, create, remove, update };
