const nodemailer = require('nodemailer');
const env = require('../../config/env');
const AppError = require('../../utils/app-error');

const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_FROM);
const transporter = isConfigured
  ? nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined
  })
  : null;

function assertConfigured() {
  if (!transporter) {
    throw new AppError('Email delivery is not configured', 503, 'EMAIL_DELIVERY_UNAVAILABLE');
  }
}

async function sendPasswordReset(email, token) {
  assertConfigured();
  const resetUrl = new URL(env.PASSWORD_RESET_URL);
  resetUrl.searchParams.set('token', token);
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: 'Reset your Urbanmate password',
    text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl.toString()}`,
    html: `<p>Use this link to reset your password. It expires in 30 minutes:</p><p><a href="${resetUrl.toString()}">Reset password</a></p>`
  });
}

async function sendEmailOtp(email, code) {
  assertConfigured();
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: 'Your Urbanmate verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`
  });
}

module.exports = { assertConfigured, sendPasswordReset, sendEmailOtp };
