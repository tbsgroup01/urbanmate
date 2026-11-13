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

const bookingIdParamsSchema = z.object({ bookingId: z.string().uuid() });
const notificationIdParamsSchema = z.object({ notificationId: z.string().uuid() });
const addonIdsQuery = z.preprocess(
  (value) => typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  z.array(z.string().uuid()).max(20).default([])
);
const availableProvidersSchema = z.object({
  serviceId: z.string().uuid(),
  addressId: z.string().uuid(),
  packageId: z.string().uuid().optional(),
  addonIds: addonIdsQuery,
  scheduledStart: z.string().datetime({ offset: true }).transform((value) => new Date(value))
}).superRefine((value, context) => {
  if (new Set(value.addonIds).size !== value.addonIds.length) {
    context.addIssue({ code: 'custom', path: ['addonIds'], message: 'An add-on can only be selected once' });
  }
});
const cancelBookingSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional()
});
const rejectBookingSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional()
});
const rescheduleBookingSchema = z.object({
  scheduledStart: z.string().datetime({ offset: true }).transform((value) => new Date(value))
});
const assignBookingSchema = z.object({ providerId: z.string().uuid() });

module.exports = {
  createBookingSchema,
  listBookingsSchema,
  bookingIdParamsSchema,
  notificationIdParamsSchema,
  availableProvidersSchema,
  cancelBookingSchema,
  rejectBookingSchema,
  rescheduleBookingSchema,
  assignBookingSchema
};
