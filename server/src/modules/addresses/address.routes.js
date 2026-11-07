const express = require('express');
const { authenticate, requireRole } = require('../../middleware/auth');
const validateRequest = require('../../middleware/validate-request');
const asyncHandler = require('../../utils/async-handler');
const controller = require('./address.controller');
const { createAddressSchema } = require('./address.schemas');

const router = express.Router();

router.use(authenticate, requireRole('customer'));
router.get('/', asyncHandler(controller.list));
router.post('/', validateRequest(createAddressSchema), asyncHandler(controller.create));

module.exports = router;
