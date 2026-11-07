const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DEFAULT_CURRENCY: z.string().regex(/^[A-Z]{3}$/).default('USD'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1).default('urbanmate'),
  DB_USER: z.string().min(1).default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_POOL_MIN: z.coerce.number().int().nonnegative().default(0),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_ISSUER: z.string().default('urbanmate-api'),
  JWT_AUDIENCE: z.string().default('urbanmate-clients'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  PASSWORD_RESET_URL: z.string().url().default('http://localhost:5173/reset-password'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM: z.string().default(''),
  DOCUMENT_STORAGE_BUCKET: z.string().default(''),
  DOCUMENT_STORAGE_REGION: z.string().default(''),
  DOCUMENT_STORAGE_ENDPOINT: z.string().url().or(z.literal('')).default(''),
  DOCUMENT_STORAGE_ACCESS_KEY_ID: z.string().default(''),
  DOCUMENT_STORAGE_SECRET_ACCESS_KEY: z.string().default(''),
  DOCUMENT_STORAGE_FORCE_PATH_STYLE: z.stringbool().default(false),
  ADMIN_EMAIL: z.string().default('').refine((value) => !value || z.string().email().safeParse(value).success, 'ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z.string().default('').refine((value) => (
    !value || (value.length >= 10 && Buffer.byteLength(value, 'utf8') <= 72)
  ), 'ADMIN_PASSWORD must be at least 10 characters and no more than 72 UTF-8 bytes'),
  ADMIN_FULL_NAME: z.string().min(2).max(120).default('Urbanmate Admin')
}).superRefine((config, context) => {
  if (Boolean(config.ADMIN_EMAIL) !== Boolean(config.ADMIN_PASSWORD)) {
    context.addIssue({
      code: 'custom',
      path: ['ADMIN_EMAIL'],
      message: 'ADMIN_EMAIL and ADMIN_PASSWORD must either both be set or both be empty'
    });
  }
  if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASSWORD)) {
    context.addIssue({
      code: 'custom',
      path: ['SMTP_USER'],
      message: 'SMTP_USER and SMTP_PASSWORD must either both be set or both be empty'
    });
  }
  if (Boolean(config.DOCUMENT_STORAGE_ACCESS_KEY_ID) !== Boolean(config.DOCUMENT_STORAGE_SECRET_ACCESS_KEY)) {
    context.addIssue({
      code: 'custom',
      path: ['DOCUMENT_STORAGE_ACCESS_KEY_ID'],
      message: 'Document storage access key and secret must either both be set or both be empty'
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

module.exports = parsed.data;
