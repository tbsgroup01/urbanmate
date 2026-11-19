const express = require('express');
const { authenticate, requireExclusiveRole } = require('../../middleware/auth');
const asyncHandler = require('../../utils/async-handler');
const controller = require('./settings.controller');

const router = express.Router();
const adminOnly = [authenticate, requireExclusiveRole('admin')];

// Public route for frontend to read site branding & meta
router.get('/public', asyncHandler(controller.getPublic));

// Admin-only management endpoints
router.get('/admin', ...adminOnly, asyncHandler(controller.getAll));
router.put('/admin', ...adminOnly, asyncHandler(controller.update));
router.post('/admin/test-email', ...adminOnly, asyncHandler(controller.testEmail));
router.post('/admin/upload-asset', ...adminOnly, asyncHandler(controller.uploadAsset));

module.exports = router;

