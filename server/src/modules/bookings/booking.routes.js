const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const validateRequest = require('../../middleware/validate-request');
const asyncHandler = require('../../utils/async-handler');
const controller = require('./booking.controller');
const {
  createBookingSchema,
  listBookingsSchema,
  bookingIdParamsSchema,
  notificationIdParamsSchema,
  availableProvidersSchema,
  cancelBookingSchema,
  rejectBookingSchema,
  rescheduleBookingSchema,
  assignBookingSchema
} = require('./booking.schemas');

const router = express.Router();

router.use(authenticate);
router.get('/', requireRole('customer', 'provider', 'admin'), validateRequest(listBookingsSchema, 'query'), asyncHandler(controller.list));
router.get('/availability', requireRole('customer'), validateRequest(availableProvidersSchema, 'query'), asyncHandler(controller.availability));
router.get('/notifications', validateRequest(listBookingsSchema, 'query'), asyncHandler(controller.notifications));
router.patch('/notifications/:notificationId/read', validateRequest(notificationIdParamsSchema, 'params'), asyncHandler(controller.markNotificationRead));
router.post('/', requireRole('customer'), validateRequest(createBookingSchema), asyncHandler(controller.create));
router.get('/:bookingId/history', requireRole('customer', 'provider', 'admin'), validateRequest(bookingIdParamsSchema, 'params'), asyncHandler(controller.history));
router.patch('/:bookingId/assign', requireRole('admin'), validateRequest(bookingIdParamsSchema, 'params'), validateRequest(assignBookingSchema), asyncHandler(controller.assign));
router.patch('/:bookingId/reschedule', requireRole('customer', 'admin'), validateRequest(bookingIdParamsSchema, 'params'), validateRequest(rescheduleBookingSchema), asyncHandler(controller.reschedule));
router.patch('/:bookingId/cancel', requireRole('customer', 'admin'), validateRequest(bookingIdParamsSchema, 'params'), validateRequest(cancelBookingSchema), asyncHandler(controller.cancel));
router.post('/:bookingId/accept', requireRole('provider'), validateRequest(bookingIdParamsSchema, 'params'), asyncHandler(controller.accept));
router.post('/:bookingId/reject', requireRole('provider'), validateRequest(bookingIdParamsSchema, 'params'), validateRequest(rejectBookingSchema), asyncHandler(controller.reject));
router.post('/:bookingId/start', requireRole('provider'), validateRequest(bookingIdParamsSchema, 'params'), asyncHandler(controller.start));
router.post('/:bookingId/complete', requireRole('provider'), validateRequest(bookingIdParamsSchema, 'params'), asyncHandler(controller.providerComplete));
router.post('/:bookingId/confirm-completion', requireRole('customer'), validateRequest(bookingIdParamsSchema, 'params'), asyncHandler(controller.customerConfirm));

module.exports = router;
