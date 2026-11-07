const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const validateRequest = require('../../middleware/validate-request');
const asyncHandler = require('../../utils/async-handler');
const controller = require('./booking.controller');
const { createBookingSchema, listBookingsSchema } = require('./booking.schemas');

const router = express.Router();

router.use(authenticate);
router.get('/', requireRole('customer', 'provider', 'admin'), validateRequest(listBookingsSchema, 'query'), asyncHandler(controller.list));
router.post('/', requireRole('customer'), validateRequest(createBookingSchema), asyncHandler(controller.create));

module.exports = router;
