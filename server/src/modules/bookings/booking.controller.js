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

async function availability(req, res) {
  return success(res, await bookingService.listAvailableProviders(req.user.id, req.validatedQuery));
}

async function history(req, res) {
  return success(res, await bookingService.getBookingHistory(req.user, req.params.bookingId));
}

async function accept(req, res) {
  return success(res, await bookingService.respondToAssignment(req.user, req.params.bookingId, true), {
    message: 'Booking accepted'
  });
}

async function reject(req, res) {
  return success(res, await bookingService.respondToAssignment(req.user, req.params.bookingId, false, req.body.reason), {
    message: 'Booking declined'
  });
}

async function start(req, res) {
  return success(res, await bookingService.transitionProviderBooking(req.user, req.params.bookingId, 'start'), {
    message: 'Service started'
  });
}

async function providerComplete(req, res) {
  return success(res, await bookingService.transitionProviderBooking(req.user, req.params.bookingId, 'complete'), {
    message: 'Service marked complete; awaiting customer confirmation'
  });
}

async function customerConfirm(req, res) {
  return success(res, await bookingService.confirmCompletion(req.user, req.params.bookingId), {
    message: 'Booking completed'
  });
}

async function cancel(req, res) {
  return success(res, await bookingService.cancelBooking(req.user, req.params.bookingId, req.body.reason), {
    message: 'Booking cancelled'
  });
}

async function reschedule(req, res) {
  return success(res, await bookingService.rescheduleBooking(req.user, req.params.bookingId, req.body.scheduledStart), {
    message: 'Booking rescheduled'
  });
}

async function assign(req, res) {
  return success(res, await bookingService.manuallyAssignBooking(req.user, req.params.bookingId, req.body.providerId), {
    message: 'Provider assigned'
  });
}

async function notifications(req, res) {
  const result = await bookingService.listNotifications(req.user.id, req.validatedQuery);
  return success(res, result.items, { meta: result.meta });
}

async function markNotificationRead(req, res) {
  return success(res, await bookingService.markNotificationRead(req.user.id, req.params.notificationId), {
    message: 'Notification marked as read'
  });
}

module.exports = {
  create,
  list,
  availability,
  history,
  accept,
  reject,
  start,
  providerComplete,
  customerConfirm,
  cancel,
  reschedule,
  assign,
  notifications,
  markNotificationRead
};
