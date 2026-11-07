const env = require('../../config/env');
const authService = require('./auth.service');
const { success } = require('../../utils/api-response');

const refreshCookieName = 'urbanmate_refresh';
const refreshCookiePath = `${env.API_PREFIX}/auth`;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: refreshCookiePath
  };
}

function requestMetadata(req) {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 512)
  };
}

function sendSession(res, session, statusCode = 200, message = 'Signed in') {
  res.set('Cache-Control', 'no-store');
  res.cookie(refreshCookieName, session.refreshToken, {
    ...cookieOptions(),
    expires: session.refreshTokenExpiresAt
  });
  const { accessToken, tokenType, expiresIn, user } = session;
  return success(res, { accessToken, tokenType, expiresIn, user }, { statusCode, message });
}

async function registerCustomer(req, res) {
  const session = await authService.registerCustomer(req.body, requestMetadata(req));
  return sendSession(res, session, 201, 'Customer account created');
}

async function registerProvider(req, res) {
  const session = await authService.registerProvider(req.body, requestMetadata(req));
  return sendSession(res, session, 201, 'Provider application created');
}

function loginFor(role, message) {
  return async (req, res) => {
    const session = await authService.login(req.body, role, requestMetadata(req));
    return sendSession(res, session, 200, message);
  };
}

async function refresh(req, res) {
  const session = await authService.refreshSession(req.cookies[refreshCookieName], requestMetadata(req));
  return sendSession(res, session, 200, 'Session refreshed');
}

async function logout(req, res) {
  await authService.revokeSession(req.cookies[refreshCookieName]);
  res.clearCookie(refreshCookieName, cookieOptions());
  res.set('Cache-Control', 'no-store');
  return success(res, null, { message: 'Signed out' });
}

async function forgotPassword(req, res) {
  await authService.requestPasswordReset(req.body.email, requestMetadata(req));
  return success(
    res,
    null,
    { statusCode: 202, message: 'If the account exists, password reset instructions will be sent' }
  );
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body.token, req.body.password);
  res.clearCookie(refreshCookieName, cookieOptions());
  res.set('Cache-Control', 'no-store');
  return success(res, null, { message: 'Password has been reset; sign in again' });
}

async function requestEmailOtp(req, res) {
  await authService.requestEmailOtp(req.user);
  return success(res, null, { statusCode: 202, message: 'Verification code sent' });
}

async function verifyEmailOtp(req, res) {
  await authService.verifyEmailOtp(req.user.id, req.body.code);
  return success(res, null, { message: 'Email verified' });
}

async function currentUser(req, res) {
  return success(res, authService.getUserSummary(req.user));
}

async function updateAccountStatus(req, res) {
  const result = await authService.updateAccountStatus(req.params.userId, req.body.status);
  return success(res, result, { message: 'Account status updated' });
}

module.exports = {
  registerCustomer,
  registerProvider,
  loginFor,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  requestEmailOtp,
  verifyEmailOtp,
  currentUser,
  updateAccountStatus
};
