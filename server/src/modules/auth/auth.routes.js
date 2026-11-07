const express = require('express');
const rateLimit = require('express-rate-limit');
const AppError = require('../../utils/app-error');
const asyncHandler = require('../../utils/async-handler');
const validateRequest = require('../../middleware/validate-request');
const { authenticate, requireExclusiveRole } = require('../../middleware/auth');
const controller = require('./auth.controller');
const {
  registerSchema,
  loginSchema,
  providerRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpVerifySchema,
  userStatusSchema,
  userIdParamsSchema
} = require('./auth.schemas');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => next(new AppError('Too many authentication attempts', 429, 'RATE_LIMITED'))
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => next(new AppError('Too many registration attempts', 429, 'RATE_LIMITED'))
});
const recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => next(new AppError('Too many recovery attempts', 429, 'RATE_LIMITED'))
});
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => next(new AppError('Too many verification attempts', 429, 'RATE_LIMITED'))
});
const login = (role, message) => asyncHandler(controller.loginFor(role, message));

router.post('/register', registrationLimiter, validateRequest(registerSchema), asyncHandler(controller.registerCustomer));
router.post('/provider/register', registrationLimiter, validateRequest(providerRegisterSchema), asyncHandler(controller.registerProvider));

router.post('/login', loginLimiter, validateRequest(loginSchema), login('customer', 'Customer signed in'));
router.post('/provider/login', loginLimiter, validateRequest(loginSchema), login('provider', 'Provider signed in'));
router.post('/admin/login', loginLimiter, validateRequest(loginSchema), login('admin', 'Admin signed in'));
router.post('/refresh', asyncHandler(controller.refresh));
router.post('/logout', asyncHandler(controller.logout));
router.post('/password/forgot', recoveryLimiter, validateRequest(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post('/password/reset', recoveryLimiter, validateRequest(resetPasswordSchema), asyncHandler(controller.resetPassword));

router.get('/me', authenticate, asyncHandler(controller.currentUser));
router.post('/otp/email/request', authenticate, otpLimiter, asyncHandler(controller.requestEmailOtp));
router.post('/otp/email/verify', authenticate, otpLimiter, validateRequest(otpVerifySchema), asyncHandler(controller.verifyEmailOtp));
router.patch(
  '/admin/users/:userId/status',
  authenticate,
  requireExclusiveRole('admin'),
  validateRequest(userIdParamsSchema, 'params'),
  validateRequest(userStatusSchema),
  asyncHandler(controller.updateAccountStatus)
);

module.exports = router;
