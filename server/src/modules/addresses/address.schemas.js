const { z } = require('zod');

const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(60),
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).optional(),
  cityId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  postalCode: z.string().trim().min(1).max(20),
  countryCode: z.string().trim().regex(/^[A-Za-z]{2}$/).transform((value) => value.toUpperCase()),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional()
}).superRefine((value, context) => {
  if (value.areaId && !value.cityId) {
    context.addIssue({ code: 'custom', path: ['cityId'], message: 'cityId is required when areaId is provided' });
  }
});

module.exports = { createAddressSchema };
