const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../../config/env');
const logger = require('../../config/logger');
const AppError = require('../../utils/app-error');
const delivery = require('./auth-delivery.service');
const {
  sequelize,
  User,
  Role,
  UserRole,
  Provider,
  RefreshToken,
  PasswordResetToken,
  OtpVerification
} = require('../../models');

const ACCESS_TOKEN_TYPE = 'access';
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), env.BCRYPT_SALT_ROUNDS);

function hashOpaqueToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashOtp(code) {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(code).digest('hex');
}

function hashesMatch(first, second) {
  const firstBuffer = Buffer.from(first, 'hex');
  const secondBuffer = Buffer.from(second, 'hex');
  return firstBuffer.length === secondBuffer.length && crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, typ: ACCESS_TOKEN_TYPE, ver: user.authVersion },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    }
  );
}

function getUserSummary(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    roles: user.roles.map((role) => role.name),
    ...(user.providerProfile
      ? {
        providerApprovalStatus: user.providerProfile.approvalStatus,
        providerIdentityVerified: user.providerProfile.identityVerified
      }
      : {})
  };
}

async function loadUserWithRoles(userId, transaction) {
  return User.findByPk(userId, {
    include: [
      { model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } },
      { model: Provider, as: 'providerProfile', attributes: ['id', 'approvalStatus', 'identityVerified'], required: false }
    ],
    transaction
  });
}

async function lockUser(userId, transaction) {
  return User.findByPk(userId, {
    attributes: ['id', 'status'],
    transaction,
    lock: transaction.LOCK.UPDATE
  });
}

async function createSession(user, metadata, transaction) {
  const rawToken = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const refreshToken = await RefreshToken.create({
    userId: user.id,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt,
    createdByIp: metadata.ip,
    userAgent: metadata.userAgent
  }, { transaction });

  return {
    accessToken: createAccessToken(user),
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN,
    refreshToken: rawToken,
    refreshTokenRecordId: refreshToken.id,
    refreshTokenExpiresAt: expiresAt,
    user: getUserSummary(user)
  };
}

async function registerAccount(input, accountType, metadata) {
  return sequelize.transaction(async (transaction) => {
    const role = await Role.findOne({ where: { name: accountType }, transaction });
    if (!role) {
      throw new AppError(`${accountType} role is not configured; run database seeders`, 503, 'ROLE_NOT_CONFIGURED');
    }

    const user = await User.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS),
      status: 'active'
    }, { transaction });

    await UserRole.create({ userId: user.id, roleId: role.id }, { transaction });
    if (accountType === 'provider') {
      await Provider.create({
        userId: user.id,
        displayName: input.displayName,
        businessName: input.businessName,
        legalName: input.legalName,
        dateOfBirth: input.dateOfBirth,
        professionalTitle: input.professionalTitle,
        businessType: input.businessType,
        bio: input.bio,
        experienceYears: input.experienceYears,
        approvalStatus: 'pending'
      }, { transaction });
    }

    const account = await loadUserWithRoles(user.id, transaction);
    return createSession(account, metadata, transaction);
  });
}

async function registerCustomer(input, metadata) {
  return registerAccount(input, 'customer', metadata);
}

async function registerProvider(input, metadata) {
  return registerAccount(input, 'provider', metadata);
}

async function login(input, expectedRole, metadata) {
  const user = await User.findOne({
    where: { email: input.email },
    include: [
      { model: Role, as: 'roles', attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Provider, as: 'providerProfile', attributes: ['id', 'approvalStatus', 'identityVerified'], required: false }
    ]
  });

  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash || DUMMY_PASSWORD_HASH);
  const userRoles = user?.roles.map((role) => role.name) || [];
  const hasConflictingRole = expectedRole === 'provider'
    ? userRoles.includes('customer')
    : expectedRole === 'admin' && (userRoles.includes('customer') || userRoles.includes('provider'));
  if (!user || !passwordMatches || !userRoles.includes(expectedRole) || hasConflictingRole) {
    throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS');
  }
  if (user.status !== 'active') {
    throw new AppError('Account is unavailable', 403, 'ACCOUNT_UNAVAILABLE');
  }

  user.lastLoginAt = new Date();
  await user.save({ fields: ['lastLoginAt'] });
  return sequelize.transaction((transaction) => createSession(user, metadata, transaction));
}

async function refreshSession(rawToken, metadata) {
  if (!rawToken) throw new AppError('Refresh token is required', 401, 'INVALID_REFRESH_TOKEN');

  const outcome = await sequelize.transaction(async (transaction) => {
    const candidate = await RefreshToken.findOne({
      where: { tokenHash: hashOpaqueToken(rawToken) },
      transaction
    });
    if (!candidate) return { error: 'INVALID_REFRESH_TOKEN' };

    const lockedUser = await lockUser(candidate.userId, transaction);
    const current = await RefreshToken.findOne({
      where: { id: candidate.id, tokenHash: hashOpaqueToken(rawToken) },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!current) return { error: 'INVALID_REFRESH_TOKEN' };

    if (current.revokedAt) {
      await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId: current.userId, revokedAt: null }, transaction }
      );
      return { error: 'REFRESH_TOKEN_REUSED' };
    }
    if (current.expiresAt <= new Date()) {
      current.revokedAt = new Date();
      await current.save({ transaction });
      return { error: 'EXPIRED_REFRESH_TOKEN' };
    }

    const user = await loadUserWithRoles(current.userId, transaction);
    if (!lockedUser || !user || lockedUser.status !== 'active') {
      current.revokedAt = new Date();
      await current.save({ transaction });
      return { error: 'ACCOUNT_UNAVAILABLE' };
    }

    const nextSession = await createSession(user, metadata, transaction);
    current.revokedAt = new Date();
    current.replacedByTokenId = nextSession.refreshTokenRecordId;
    await current.save({ transaction });
    return { session: nextSession };
  });

  if (outcome.error) {
    const messages = {
      REFRESH_TOKEN_REUSED: 'Refresh token reuse detected; sign in again',
      EXPIRED_REFRESH_TOKEN: 'Refresh token has expired',
      ACCOUNT_UNAVAILABLE: 'Account is unavailable'
    };
    throw new AppError(messages[outcome.error] || 'Refresh token is invalid', 401, outcome.error);
  }
  return outcome.session;
}

async function revokeSession(rawToken) {
  if (!rawToken) return;
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { tokenHash: hashOpaqueToken(rawToken), revokedAt: null } }
  );
}

async function requestPasswordReset(email, metadata) {
  delivery.assertConfigured();
  const user = await User.findOne({
    where: { email, status: 'active' },
    attributes: ['id', 'email']
  });
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('base64url');
  await PasswordResetToken.create({
    userId: user.id,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    createdByIp: metadata.ip
  });

  try {
    await delivery.sendPasswordReset(user.email, rawToken);
  } catch (error) {
    await PasswordResetToken.destroy({ where: { tokenHash: hashOpaqueToken(rawToken) } });
    logger.error({ err: error, userId: user.id }, 'Password reset email delivery failed');
  }
}

async function resetPassword(rawToken, password) {
  const outcome = await sequelize.transaction(async (transaction) => {
    const resetToken = await PasswordResetToken.findOne({
      where: { tokenHash: hashOpaqueToken(rawToken) },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return { error: 'INVALID_RESET_TOKEN' };
    }

    const user = await User.findByPk(resetToken.userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user || user.status === 'deleted') return { error: 'INVALID_RESET_TOKEN' };

    user.passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
    user.authVersion += 1;
    await user.save({ fields: ['passwordHash', 'authVersion'], transaction });
    resetToken.usedAt = new Date();
    await resetToken.save({ fields: ['usedAt'], transaction });

    await PasswordResetToken.update(
      { usedAt: new Date() },
      { where: { userId: user.id, usedAt: null }, transaction }
    );
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { userId: user.id, revokedAt: null }, transaction }
    );
    return { success: true };
  });

  if (outcome.error) {
    throw new AppError('Password reset token is invalid or expired', 400, outcome.error);
  }
}

async function requestEmailOtp(user) {
  delivery.assertConfigured();
  if (user.emailVerifiedAt) throw new AppError('Email is already verified', 409, 'EMAIL_ALREADY_VERIFIED');

  const code = String(crypto.randomInt(100000, 1000000));
  const now = new Date();
  let challenge;
  await sequelize.transaction(async (transaction) => {
    await OtpVerification.update(
      { verifiedAt: now },
      { where: { userId: user.id, purpose: 'email_verification', verifiedAt: null }, transaction }
    );
    challenge = await OtpVerification.create({
      userId: user.id,
      purpose: 'email_verification',
      target: user.email,
      codeHash: hashOtp(code),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS)
    }, { transaction });
  });

  try {
    await delivery.sendEmailOtp(user.email, code);
  } catch (error) {
    await OtpVerification.update(
      { verifiedAt: new Date() },
      { where: { id: challenge.id, verifiedAt: null } }
    );
    logger.error({ err: error, userId: user.id }, 'OTP email delivery failed');
    throw new AppError('Verification email could not be sent', 503, 'OTP_DELIVERY_FAILED');
  }
}

async function verifyEmailOtp(userId, code) {
  const outcome = await sequelize.transaction(async (transaction) => {
    const challenge = await OtpVerification.findOne({
      where: {
        userId,
        purpose: 'email_verification',
        verifiedAt: null,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!challenge) return { error: 'OTP_NOT_FOUND' };
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) return { error: 'OTP_ATTEMPTS_EXCEEDED' };

    challenge.attempts += 1;
    if (!hashesMatch(challenge.codeHash, hashOtp(code))) {
      await challenge.save({ fields: ['attempts'], transaction });
      return { error: 'INVALID_OTP' };
    }

    challenge.verifiedAt = new Date();
    await challenge.save({ fields: ['attempts', 'verifiedAt'], transaction });
    await User.update(
      { emailVerifiedAt: new Date() },
      { where: { id: userId }, transaction }
    );
    return { success: true };
  });

  if (outcome.error) {
    const statusCode = outcome.error === 'OTP_ATTEMPTS_EXCEEDED' ? 429 : 400;
    throw new AppError('Verification code is invalid or expired', statusCode, outcome.error);
  }
}

async function updateAccountStatus(userId, status) {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) throw new AppError('Account was not found', 404, 'USER_NOT_FOUND');
    if (user.status === 'deleted') throw new AppError('Deleted accounts cannot be reactivated', 409, 'ACCOUNT_DELETED');

    user.status = status;
    await user.save({ fields: ['status'], transaction });
    if (status !== 'active') {
      await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId, revokedAt: null }, transaction }
      );
      await Provider.update(
        { isOnline: false },
        { where: { userId, isOnline: true }, transaction }
      );
    }
    return { id: user.id, status: user.status };
  });
}

module.exports = {
  registerCustomer,
  registerProvider,
  login,
  refreshSession,
  revokeSession,
  requestPasswordReset,
  resetPassword,
  requestEmailOtp,
  verifyEmailOtp,
  updateAccountStatus,
  getUserSummary
};
