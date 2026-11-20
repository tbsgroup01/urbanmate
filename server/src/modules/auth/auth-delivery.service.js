const nodemailer = require('nodemailer');
const env = require('../../config/env');
const AppError = require('../../utils/app-error');

async function getMailConfig() {
  try {
    const { SystemSetting } = require('../../models');
    const row = await SystemSetting.findOne({ where: { key: 'mail' } });
    if (row && row.value) {
      let val = row.value;
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {}
      }
      if (val && typeof val === 'object') {
        const port = Number(val.port) || 587;
        const isSecure = val.encryption === 'ssl' || port === 465 || Boolean(val.secure);
        return {
          enabled: Boolean(val.enabled),
          host: val.host || '',
          port,
          secure: isSecure,
          encryption: val.encryption || (isSecure ? 'ssl' : 'tls'),
          user: val.user || '',
          password: val.password || '',
          fromEmail: val.fromEmail || val.user || 'noreply@urbanmate.in',
          fromName: val.fromName || 'UrbanMate'
        };
      }
    }
  } catch (err) {
    console.warn('Could not read mail settings from database:', err.message);
  }

  // Fallback to environment variables
  const isEnvConfigured = Boolean(env.SMTP_HOST && env.SMTP_FROM);
  return {
    enabled: isEnvConfigured,
    host: env.SMTP_HOST || '',
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE || false,
    encryption: env.SMTP_SECURE ? 'ssl' : 'tls',
    user: env.SMTP_USER || '',
    password: env.SMTP_PASSWORD || '',
    fromEmail: env.SMTP_FROM || 'noreply@urbanmate.in',
    fromName: 'UrbanMate'
  };
}

async function getTransporter() {
  const config = await getMailConfig();

  if (!config.enabled) {
    throw new AppError(
      'Email notifications are currently disabled in Admin Console. Please enable them in Admin Console > Settings > Mail Configuration.',
      503,
      'EMAIL_DELIVERY_DISABLED'
    );
  }

  if (!config.host) {
    throw new AppError(
      'SMTP Host is not configured. Please configure your mail server in Admin Console > Settings > Mail Configuration.',
      503,
      'EMAIL_DELIVERY_NOT_CONFIGURED'
    );
  }

  const transporterOptions = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  };

  if (config.user && config.password) {
    transporterOptions.auth = {
      user: config.user,
      pass: config.password
    };
  }

  const transporter = nodemailer.createTransport(transporterOptions);
  return { transporter, config };
}

async function assertConfigured() {
  const config = await getMailConfig();
  if (!config.enabled) {
    throw new AppError(
      'Email notifications are currently disabled in Admin Console. Please enable them in Admin Console > Settings > Mail Configuration.',
      503,
      'EMAIL_DELIVERY_DISABLED'
    );
  }
  if (!config.host) {
    throw new AppError(
      'SMTP mail server is not configured. Please enter your SMTP Host and credentials in Admin Console > Settings > Mail Configuration.',
      503,
      'EMAIL_DELIVERY_NOT_CONFIGURED'
    );
  }
}

async function sendPasswordResetOtp(email, otp) {
  const { transporter, config } = await getTransporter();
  const fromAddress = config.fromEmail || config.user || 'noreply@urbanmate.in';
  const fromName = config.fromName || 'UrbanMate';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #faf9fd; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e1b4b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9fd; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #ede9fe; box-shadow: 0 10px 30px rgba(109, 40, 217, 0.08); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="padding: 32px 36px; background: linear-gradient(135deg, #1e0f3e 0%, #2c1356 50%, #0f0520 100%); text-align: center;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                    urban<span style="color: #c4b5fd;">mate</span>
                  </h1>
                  <p style="margin: 8px 0 0; font-size: 13px; color: #e9d5ff; font-weight: 600;">
                    Password Recovery Verification
                  </p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 36px 36px 28px;">
                  <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
                    Forgot your password?
                  </h2>
                  <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #475569;">
                    We received a request to reset the password for your UrbanMate account. Enter the 6-digit verification code below to set a new password:
                  </p>
                  
                  <!-- OTP Box -->
                  <div style="background: #f5f3ff; border: 2px dashed #7c3aed; border-radius: 18px; padding: 24px 16px; text-align: center; margin: 0 0 24px;">
                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #6d28d9; margin-bottom: 8px;">
                      Your One-Time Password (OTP)
                    </span>
                    <span style="font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace; font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #5b21b6; display: inline-block;">
                      ${otp}
                    </span>
                  </div>

                  <div style="background: #faf5ff; border-radius: 12px; padding: 12px 16px; margin: 0 0 20px;">
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #6b21a8;">
                      ⏰ <strong>Valid for 10 minutes</strong>. Never share this OTP with anyone.
                    </p>
                  </div>
                  
                  <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                    If you did not request a password reset, please ignore this email or reach out to support. Your account is completely secure.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    © ${new Date().getFullYear()} UrbanMate. Thoughtful local service, right at home.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  console.log(`[UrbanMate Auth] Delivering password reset OTP to ${email}: ${otp}`);
  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: email,
    subject: `🔐 UrbanMate - Your Password Reset OTP: ${otp}`,
    text: `Your UrbanMate password reset OTP is ${otp}. This code is valid for 10 minutes. If you did not request this, please ignore this message.`,
    html
  });
}

async function sendEmailOtp(email, code) {
  const { transporter, config } = await getTransporter();
  const fromAddress = config.fromEmail || config.user || 'noreply@urbanmate.in';
  const fromName = config.fromName || 'UrbanMate';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #faf9fd; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e1b4b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9fd; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #ede9fe; box-shadow: 0 10px 30px rgba(109, 40, 217, 0.08); overflow: hidden;">
              <tr>
                <td style="padding: 32px 36px; background: linear-gradient(135deg, #1e0f3e 0%, #2c1356 50%, #0f0520 100%); text-align: center;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff;">
                    urban<span style="color: #c4b5fd;">mate</span>
                  </h1>
                  <p style="margin: 8px 0 0; font-size: 13px; color: #e9d5ff;">Email Verification Code</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 36px 28px;">
                  <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">Verify your email address</h2>
                  <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #475569;">
                    Thank you for joining UrbanMate. Use the 6-digit code below to verify your email address:
                  </p>
                  <div style="background: #f5f3ff; border: 2px dashed #7c3aed; border-radius: 18px; padding: 24px 16px; text-align: center; margin: 0 0 24px;">
                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #6d28d9; margin-bottom: 8px;">Verification Code</span>
                    <span style="font-family: monospace; font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #5b21b6; display: inline-block;">${code}</span>
                  </div>
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: #64748b;">⏰ Valid for 10 minutes.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8;">© ${new Date().getFullYear()} UrbanMate.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: email,
    subject: `UrbanMate - Your Verification Code: ${code}`,
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html
  });
}

async function sendPasswordReset(email, token) {
  const { transporter, config } = await getTransporter();
  const resetUrl = new URL(env.PASSWORD_RESET_URL || 'http://localhost:5173/urbanmate/reset-password');
  resetUrl.searchParams.set('token', token);
  const fromAddress = config.fromEmail || config.user || 'noreply@urbanmate.in';
  const fromName = config.fromName || 'UrbanMate';

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: email,
    subject: 'Reset your UrbanMate password',
    text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl.toString()}`,
    html: `<p>Use this link to reset your password. It expires in 30 minutes:</p><p><a href="${resetUrl.toString()}">Reset password</a></p>`
  });
}

module.exports = {
  assertConfigured,
  getMailConfig,
  sendPasswordResetOtp,
  sendPasswordReset,
  sendEmailOtp
};
