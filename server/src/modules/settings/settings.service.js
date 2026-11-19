const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { SystemSetting } = require('../../models');
const AppError = require('../../utils/app-error');

const defaultGeneral = {
  siteName: 'UrbanMate',
  siteTitle: 'UrbanMate - On-Demand Doorstep Home & Salon Services',
  metaDescription: 'UrbanMate connects you with verified local professionals for cleaning, repair, salon, and handyman services across your city.',
  metaKeywords: 'urbanmate, home services, salon at home, cleaning, plumbing, electrician, appliance repair',
  headerScripts: '',
  bodyScripts: '',
  logoUrl: '',
  faviconUrl: ''
};

const defaultPayment = {
  mode: 'test',
  razorpayEnabled: true,
  razorpayKeyId: 'rzp_test_1DP5mmOlF5G5ag',
  razorpayKeySecret: '',
  razorpayWebhookSecret: '',
  upiEnabled: true,
  upiId: 'urbanmate@upi',
  upiPayeeName: 'UrbanMate Marketplace',
  upiQrUrl: '',
  upiInstructions: 'Scan QR using any UPI app (GPay, PhonePe, Paytm). Confirm payment and note your transaction ID.',
  codEnabled: true
};

const defaultMail = {
  enabled: false,
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  encryption: 'tls',
  user: '',
  password: '',
  fromEmail: 'noreply@urbanmate.in',
  fromName: 'UrbanMate Team'
};

async function getSettingByKey(key, defaultValue) {
  const row = await SystemSetting.findOne({ where: { key } });
  if (!row) return defaultValue;
  let val = row.value;
  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {
      val = defaultValue;
    }
  }
  return { ...defaultValue, ...val };
}

async function getPublicSettings() {
  const [general, payment] = await Promise.all([
    getSettingByKey('general', defaultGeneral),
    getSettingByKey('payment', defaultPayment)
  ]);

  return {
    siteName: general.siteName || 'UrbanMate',
    siteTitle: general.siteTitle || 'UrbanMate - On-Demand Doorstep Home & Salon Services',
    metaDescription: general.metaDescription || '',
    metaKeywords: general.metaKeywords || '',
    headerScripts: general.headerScripts || '',
    bodyScripts: general.bodyScripts || '',
    logoUrl: general.logoUrl || '',
    faviconUrl: general.faviconUrl || '',
    payment: {
      mode: payment.mode || 'test',
      razorpayEnabled: Boolean(payment.razorpayEnabled),
      razorpayKeyId: payment.razorpayKeyId || '',
      upiEnabled: Boolean(payment.upiEnabled),
      upiId: payment.upiId || '',
      upiPayeeName: payment.upiPayeeName || '',
      upiQrUrl: payment.upiQrUrl || '',
      upiInstructions: payment.upiInstructions || '',
      codEnabled: Boolean(payment.codEnabled)
    }
  };
}

async function getAllSettings() {
  const [general, payment, mail] = await Promise.all([
    getSettingByKey('general', defaultGeneral),
    getSettingByKey('payment', defaultPayment),
    getSettingByKey('mail', defaultMail)
  ]);

  return { general, payment, mail };
}

async function updateSection(section, data) {
  const defaultsMap = {
    general: defaultGeneral,
    payment: defaultPayment,
    mail: defaultMail
  };

  const defaults = defaultsMap[section];
  if (!defaults) {
    throw new AppError(`Invalid settings section: ${section}`, 400, 'INVALID_SECTION');
  }

  const current = await getSettingByKey(section, defaults);
  const updated = { ...current, ...data };

  const [row, created] = await SystemSetting.findOrCreate({
    where: { key: section },
    defaults: {
      id: crypto.randomUUID(),
      key: section,
      value: updated
    }
  });

  if (!created) {
    row.value = updated;
    await row.save();
  }

  return updated;
}

async function sendTestEmail({ toEmail, mailSettings }) {
  if (!toEmail || !toEmail.includes('@')) {
    throw new AppError('A valid recipient email address is required', 400, 'INVALID_RECIPIENT');
  }

  const config = mailSettings || (await getSettingByKey('mail', defaultMail));
  if (!config.host) {
    throw new AppError('SMTP Host is not configured', 400, 'SMTP_HOST_REQUIRED');
  }

  const port = Number(config.port) || 587;
  const isSecure = config.encryption === 'ssl' || port === 465 || Boolean(config.secure);

  const transporterOptions = {
    host: config.host,
    port,
    secure: isSecure,
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

  try {
    await transporter.verify();
  } catch (verifyErr) {
    throw new AppError(`SMTP verification failed: ${verifyErr.message}`, 400, 'SMTP_VERIFICATION_FAILED');
  }

  const fromAddress = config.fromEmail || config.user || 'noreply@urbanmate.in';
  const fromName = config.fromName || 'UrbanMate System';

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: toEmail,
      subject: '✅ UrbanMate - SMTP Test Email Successful',
      text: `Hello,\n\nThis is a test email from your UrbanMate Admin Console.\nYour SMTP mail server (${config.host}:${port}) is working properly!\n\nSent at: ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #6d28d9; margin-top: 0;">UrbanMate Mail Configuration Test</h2>
          <p style="font-size: 15px; color: #334155;">Great news! Your SMTP configuration is working perfectly.</p>
          <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 4px 0; font-size: 14px;"><strong>SMTP Host:</strong> ${config.host}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Port:</strong> ${port}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Encryption:</strong> ${config.encryption || (isSecure ? 'SSL' : 'TLS')}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Sender:</strong> ${fromAddress}</p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">Sent on ${new Date().toUTCString()} from UrbanMate Admin Portal.</p>
        </div>
      `
    });

    return {
      success: true,
      messageId: info.messageId,
      recipient: toEmail
    };
  } catch (sendErr) {
    throw new AppError(`Failed to send test email: ${sendErr.message}`, 400, 'EMAIL_SEND_FAILED');
  }
}

async function uploadSettingAsset({ dataUrl, assetType = 'asset', protocol = 'http', host = 'localhost:4000' }) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new AppError('Image data URL is required', 400, 'INVALID_IMAGE');
  }

  const match = dataUrl.match(/^data:image\/(png|jpe?g|webp|gif|svg\+xml|x-icon|vnd\.microsoft\.icon);base64,(.+)$/i);
  if (!match) {
    throw new AppError('Invalid image format. Supported formats: PNG, JPG, WebP, SVG, ICO', 400, 'INVALID_IMAGE_FORMAT');
  }

  const [, rawExt, base64Data] = match;
  let ext = rawExt.toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  else if (ext.includes('svg')) ext = 'svg';
  else if (ext.includes('icon')) ext = 'ico';

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new AppError('File size exceeds the 5MB limit', 400, 'FILE_TOO_LARGE');
  }

  const uploadsDir = path.join(__dirname, '../../../public/uploads');
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const prefix = assetType.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'asset';
  const safeFilename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const filePath = path.join(uploadsDir, safeFilename);

  await fs.promises.writeFile(filePath, buffer);

  const url = `${protocol}://${host}/uploads/${safeFilename}`;
  return { url, filename: safeFilename };
}

async function sendSystemEmail({ to, subject, html, text }) {
  try {
    const config = await getSettingByKey('mail', defaultMail);
    if (!config?.enabled || !config?.host || !config?.user) return null;

    const port = Number(config.port || 587);
    const isSecure = config.encryption === 'ssl' || port === 465 || Boolean(config.secure);

    const transporter = nodemailer.createTransport({
      host: config.host,
      port,
      secure: isSecure,
      auth: {
        user: config.user,
        pass: config.password
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });

    const fromAddress = config.fromEmail || config.user || 'noreply@urbanmate.in';
    const fromName = config.fromName || 'UrbanMate System';

    return await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      text: text || '',
      html: html || `<p>${text || subject}</p>`
    });
  } catch (err) {
    console.error('System email delivery note:', err.message);
    return null;
  }
}

module.exports = {
  getPublicSettings,
  getAllSettings,
  updateSection,
  sendTestEmail,
  uploadSettingAsset,
  sendSystemEmail
};

