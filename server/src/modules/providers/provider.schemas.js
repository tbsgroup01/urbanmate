const { z } = require('zod');

const uuid = z.string().uuid();
const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
};
const optionalText = (max) => z.string().trim().max(max).nullable().optional();

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(30).nullable().optional(),
  displayName: z.string().trim().min(2).max(120).optional(),
  businessName: optionalText(160),
  bio: optionalText(5000),
  legalName: z.string().trim().min(2).max(160).optional(),
  dateOfBirth: z.string().date().optional(),
  professionalTitle: optionalText(120),
  businessType: optionalText(80),
  experienceYears: z.number().int().min(0).max(80).optional()
}).refine((value) => Object.keys(value).length > 0, 'At least one provider profile field is required');

const documentUploadSchema = z.object({
  documentType: z.enum(['identity_front', 'identity_back', 'proof_of_address', 'professional_license', 'business_license']),
  contentType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
  fileSizeBytes: z.number().int().min(1).max(10 * 1024 * 1024),
  expiresAt: z.string().date().optional()
});

const documentIdParamsSchema = z.object({ documentId: uuid });
const providerIdParamsSchema = z.object({ providerId: uuid });

const documentReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().trim().min(3).max(500).optional()
}).superRefine((value, context) => {
  if (value.status === 'rejected' && !value.rejectionReason) {
    context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'A reason is required when rejecting a document' });
  }
});

const providerDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
  rejectionReason: z.string().trim().min(3).max(500).optional()
}).superRefine((value, context) => {
  if (value.status === 'rejected' && !value.rejectionReason) {
    context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'A reason is required when rejecting an application' });
  }
});

const providerListSchema = z.object({
  ...pagination,
  q: z.string().trim().max(120).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional()
});
const publicProviderListSchema = z.object({
  ...pagination,
  serviceId: uuid.optional(),
  cityId: uuid.optional(),
  areaId: uuid.optional(),
  sortBy: z.enum(['rating', 'reviews', 'experience']).default('rating'),
  order: z.enum(['asc', 'desc']).default('desc')
}).superRefine((value, context) => {
  if (value.areaId && !value.cityId) {
    context.addIssue({ code: 'custom', path: ['cityId'], message: 'cityId is required when filtering by areaId' });
  }
});

const serviceSelectionSchema = z.object({
  serviceId: uuid,
  customPrice: z.number().min(0).max(1_000_000).nullable().optional(),
  isActive: z.boolean().default(true)
});
const providerServicesSchema = z.object({
  services: z.array(serviceSelectionSchema).max(100)
}).superRefine((value, context) => {
  const ids = value.services.map((service) => service.serviceId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: 'custom', path: ['services'], message: 'A service can only be selected once' });
  }
});
const providerAreasSchema = z.object({ areaIds: z.array(uuid).max(1000) })
  .superRefine((value, context) => {
    if (new Set(value.areaIds).size !== value.areaIds.length) {
      context.addIssue({ code: 'custom', path: ['areaIds'], message: 'An area can only be selected once' });
    }
  });

const availabilityWindowSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  isAvailable: z.boolean().default(true),
  effectiveFrom: z.string().date().nullable().optional(),
  effectiveUntil: z.string().date().nullable().optional(),
  timezone: z.string().trim().min(1).max(64).default('UTC')
}).superRefine((value, context) => {
  if (value.startTime >= value.endTime) {
    context.addIssue({ code: 'custom', path: ['endTime'], message: 'endTime must be after startTime' });
  }
  if (value.effectiveFrom && value.effectiveUntil && value.effectiveUntil < value.effectiveFrom) {
    context.addIssue({ code: 'custom', path: ['effectiveUntil'], message: 'effectiveUntil must not be before effectiveFrom' });
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value.timezone });
  } catch {
    context.addIssue({ code: 'custom', path: ['timezone'], message: 'A valid IANA timezone is required' });
  }
});
const providerAvailabilitySchema = z.object({ availability: z.array(availabilityWindowSchema).max(70) })
  .superRefine((value, context) => {
    const windows = value.availability.filter((window) => window.isAvailable);
    for (let first = 0; first < windows.length; first += 1) {
      for (let second = first + 1; second < windows.length; second += 1) {
        const a = windows[first];
        const b = windows[second];
        if (a.weekday === b.weekday && a.timezone === b.timezone
          && a.startTime < b.endTime && b.startTime < a.endTime) {
          context.addIssue({
            code: 'custom',
            path: ['availability', second],
            message: 'Availability windows for the same weekday and timezone cannot overlap'
          });
        }
      }
    }
  });

const onlineStatusSchema = z.object({ isOnline: z.boolean() });
const reviewListSchema = z.object({
  ...pagination,
  rating: z.coerce.number().int().min(1).max(5).optional()
});
const createReviewSchema = z.object({
  bookingId: uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(5000).optional()
});

module.exports = {
  profileSchema,
  documentUploadSchema,
  documentIdParamsSchema,
  providerIdParamsSchema,
  documentReviewSchema,
  providerDecisionSchema,
  providerListSchema,
  publicProviderListSchema,
  providerServicesSchema,
  providerAreasSchema,
  providerAvailabilitySchema,
  onlineStatusSchema,
  reviewListSchema,
  createReviewSchema
};
