const bookingService = require('./booking.service');
const { success } = require('../../utils/api-response');

async function create(req, res) {
  const booking = await bookingService.createBooking(req.user.id, req.body);
  return success(res, booking, { statusCode: 201, message: 'Booking created' });
}

async function list(req, res) {
  const result = await bookingService.listBookings(req.user, req.validatedQuery);
  return success(res, result.items, { meta: result.meta });
}

module.exports = { create, list };
