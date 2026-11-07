const { z } = require('zod');

const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  addonIds: z.array(z.string().uuid()).max(20).default([]),
  addressId: z.string().uuid(),
  scheduledStart: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  customerNotes: z.string().trim().max(2000).optional()
}).superRefine((value, context) => {
  if (new Set(value.addonIds).size !== value.addonIds.length) {
    context.addIssue({ code: 'custom', path: ['addonIds'], message: 'An add-on can only be selected once' });
  }
});

const listBookingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

module.exports = { createBookingSchema, listBookingsSchema };
