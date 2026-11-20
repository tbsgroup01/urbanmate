const { z } = require('zod');

const passwordSchema = z.string()
  .min(6)
  .max(72)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes');

const loginPasswordSchema = z.string()
  .min(1)
  .max(72)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes');

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(30).optional(),
  password: passwordSchema
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: loginPasswordSchema
});

const providerRegisterSchema = registerSchema.extend({
  displayName: z.string().trim().min(2).max(120),
  businessName: z.string().trim().max(160).optional(),
  legalName: z.string().trim().min(2).max(160).optional(),
  dateOfBirth: z.string().date().optional(),
  professionalTitle: z.string().trim().min(2).max(120).optional(),
  businessType: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(5000).optional(),
  experienceYears: z.number().int().min(0).max(80).default(0)
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase())
});

const forgotPasswordVerifyOtpSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be a 6-digit number')
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
  resetToken: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
  otp: z.string().trim().regex(/^\d{6}$/).optional(),
  password: passwordSchema
}).refine((data) => data.resetToken || data.token || (data.email && data.otp), {
  message: 'Reset token or verification OTP is required to change password'
});

const otpVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/)
});

const userStatusSchema = z.object({
  status: z.enum(['active', 'suspended'])
});

const userIdParamsSchema = z.object({
  userId: z.string().uuid()
});

module.exports = {
  registerSchema,
  loginSchema,
  providerRegisterSchema,
  forgotPasswordSchema,
  forgotPasswordVerifyOtpSchema,
  resetPasswordSchema,
  otpVerifySchema,
  userStatusSchema,
  userIdParamsSchema
};
