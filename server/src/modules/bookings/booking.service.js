const crypto = require('node:crypto');
const { Op } = require('sequelize');
const env = require('../../config/env');
const {
  sequelize,
  Address,
  Booking,
  BookingServiceItem,
  BookingStatusHistory,
  Notification,
  Provider,
  Service,
  ServiceCategory,
  ServiceArea,
  ServicePackage,
  ServiceAddon,
  ServicePricingRule,
  ProviderService,
  Area,
  User
} = require('../../models');
const AppError = require('../../utils/app-error');
const { calculateEffectivePrice, roundPrice } = require('../catalog/pricing');
const {
  assertProviderAvailable,
  findAvailableProvider,
  getBookingAddress
} = require('./booking-scheduling');

const assignableStatuses = ['pending', 'assigned'];
const reschedulableStatuses = ['pending', 'assigned', 'confirmed'];

function assertFutureDate(date) {
  if (date <= new Date()) {
    throw new AppError('Booking time must be in the future', 400, 'INVALID_BOOKING_TIME');
  }
  if (date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) {
    throw new AppError('Booking time must start on a minute boundary', 400, 'INVALID_BOOKING_TIME');
  }
}

async function getBookingContext(customerId, input, transaction) {
  const [service, address] = await Promise.all([
    Service.findOne({ where: { id: input.serviceId, isActive: true }, transaction }),
    getBookingAddress(customerId, input.addressId, transaction)
  ]);
  if (!service) throw new AppError('Service was not found or is unavailable', 404, 'SERVICE_NOT_FOUND');
  assertFutureDate(input.scheduledStart);

  const category = await ServiceCategory.findByPk(service.categoryId, {
    include: [{ model: ServiceCategory, as: 'parent', attributes: ['id', 'isActive'], required: false }],
    transaction
  });
  if (!category?.isActive || (category.parent && !category.parent.isActive)) {
    throw new AppError('Service category is unavailable', 404, 'SERVICE_NOT_FOUND');
  }

  const location = { cityId: address.cityId, areaId: address.areaId };
  const configuredServiceAreas = await ServiceArea.count({
    where: { serviceId: service.id, isActive: true },
    transaction
  });
  if (location.areaId) {
    const area = await Area.findOne({
      where: { id: location.areaId, cityId: location.cityId, isActive: true },
      attributes: ['id'],
      transaction
    });
    if (!area) throw new AppError('Booking address area is unavailable', 400, 'AREA_NOT_AVAILABLE');
    if (configuredServiceAreas > 0) {
      const serviceArea = await ServiceArea.findOne({
        where: { serviceId: service.id, areaId: location.areaId, isActive: true },
        transaction
      });
      if (!serviceArea) throw new AppError('Service is not available at this address', 400, 'SERVICE_NOT_AVAILABLE');
    }
  } else if (configuredServiceAreas > 0) {
    throw new AppError('Select a service area for this address', 400, 'ADDRESS_AREA_REQUIRED');
  }

  const [selectedPackage, selectedAddons] = await Promise.all([
    input.packageId
      ? ServicePackage.findOne({
        where: { id: input.packageId, serviceId: service.id, isActive: true },
        transaction
      })
      : null,
    input.addonIds?.length
      ? ServiceAddon.findAll({
        where: { id: { [Op.in]: input.addonIds }, serviceId: service.id, isActive: true },
        transaction
      })
      : []
  ]);
  if (input.packageId && !selectedPackage) {
    throw new AppError('Package is unavailable for this service', 400, 'INVALID_SERVICE_PACKAGE');
  }
  if (selectedAddons.length !== (input.addonIds || []).length) {
    throw new AppError('One or more add-ons are unavailable for this service', 400, 'INVALID_SERVICE_ADDON');
  }

  const applicableScopes = [{ cityId: null, areaId: null }];
  if (location.cityId) {
    applicableScopes.push({ cityId: location.cityId, areaId: null });
    if (location.areaId) applicableScopes.push({ cityId: location.cityId, areaId: location.areaId });
  }
  const now = new Date();
  const pricingRules = await ServicePricingRule.findAll({
    where: {
      serviceId: service.id,
      isActive: true,
      [Op.and]: [
        { [Op.or]: applicableScopes },
        { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
        { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: now } }] }
      ]
    },
    transaction
  });
  const durationMinutes = (selectedPackage?.durationMinutes || service.durationMinutes)
    + selectedAddons.reduce((sum, addon) => sum + addon.durationMinutes, 0);
  const scheduledEnd = new Date(input.scheduledStart.getTime() + durationMinutes * 60_000);

  return {
    service,
    address,
    selectedPackage,
    selectedAddons,
    pricingRules,
    location,
    now,
    scheduledEnd
  };
}

function calculateSubtotal(context, providerService) {
  const serviceBasePrice = providerService?.customPrice ?? context.service.basePrice;
  const selectedPrice = context.selectedPackage
    ? Number(context.selectedPackage.price)
    : calculateEffectivePrice(serviceBasePrice, context.pricingRules, context.location, context.now);
  const addonsPrice = context.selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);
  return roundPrice(selectedPrice + addonsPrice).toFixed(2);
}

async function addHistory(booking, actorUserId, fromStatus, toStatus, transaction, reason, metadata) {
  await BookingStatusHistory.create({
    bookingId: booking.id,
    actorUserId: actorUserId || null,
    fromStatus: fromStatus || null,
    toStatus,
    reason: reason || null,
    metadata: metadata || null
  }, { transaction });
}

async function notifyUsers(booking, userIds, type, message, transaction) {
  const recipientIds = [...new Set(userIds.filter(Boolean))];
  if (!recipientIds.length) return;
  await Notification.bulkCreate(recipientIds.map((userId) => ({
    userId,
    bookingId: booking.id,
    type,
    message
  })), { transaction });
}

async function getProviderUserId(providerId, transaction) {
  if (!providerId) return null;
  const provider = await Provider.findByPk(providerId, {
    attributes: ['userId'],
    transaction
  });
  return provider?.userId || null;
}

async function setBookingStatus(booking, actorUserId, status, transaction, options = {}) {
  const previousStatus = booking.status;
  booking.status = status;
  if (options.providerId !== undefined) booking.providerId = options.providerId;
  if (options.scheduledStart) booking.scheduledStart = options.scheduledStart;
  if (options.scheduledEnd) booking.scheduledEnd = options.scheduledEnd;
  if (options.cancellationReason !== undefined) booking.cancellationReason = options.cancellationReason;
  if (status === 'completed') booking.completedAt = new Date();
  await booking.save({ transaction });
  await addHistory(booking, actorUserId, previousStatus, status, transaction, options.reason, options.metadata);
  return previousStatus;
}

async function createBooking(customerId, input) {
  return sequelize.transaction(async (transaction) => {
    const context = await getBookingContext(customerId, input, transaction);
    let assigned;
    if (input.providerId) {
      assigned = await assertProviderAvailable(
        input.providerId,
        context.service.id,
        context.address,
        input.scheduledStart,
        context.scheduledEnd,
        transaction,
        true
      );
    } else {
      assigned = await findAvailableProvider(
        context.service.id,
        context.address,
        input.scheduledStart,
        context.scheduledEnd,
        transaction
      );
      if (!assigned) {
        throw new AppError('No eligible provider is available for this time slot', 409, 'NO_PROVIDER_AVAILABLE');
      }
    }
    const subtotal = calculateSubtotal(context, assigned.providerService);

    const booking = await Booking.create({
      bookingNumber: `UM-${crypto.randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`,
      customerId,
      providerId: assigned.provider.id,
      serviceId: context.service.id,
      addressId: context.address.id,
      serviceNameSnapshot: context.service.name,
      scheduledStart: input.scheduledStart,
      scheduledEnd: context.scheduledEnd,
      status: 'assigned',
      subtotal,
      platformFee: '0.00',
      tax: '0.00',
      total: subtotal,
      currency: env.DEFAULT_CURRENCY,
      customerNotes: input.customerNotes || null
    }, { transaction });

    const bookingItems = [
      ...(context.selectedPackage ? [{
        bookingId: booking.id,
        itemType: 'package',
        servicePackageId: context.selectedPackage.id,
        nameSnapshot: context.selectedPackage.name,
        unitPrice: context.selectedPackage.price,
        durationMinutes: context.selectedPackage.durationMinutes
      }] : []),
      ...context.selectedAddons.map((addon) => ({
        bookingId: booking.id,
        itemType: 'addon',
        serviceAddonId: addon.id,
        nameSnapshot: addon.name,
        unitPrice: addon.price,
        durationMinutes: addon.durationMinutes
      }))
    ];
    if (bookingItems.length) await BookingServiceItem.bulkCreate(bookingItems, { transaction });
    await addHistory(booking, customerId, null, 'assigned', transaction);
    await notifyUsers(
      booking,
      [customerId, await getProviderUserId(booking.providerId, transaction)],
      'booking_assigned',
      'A service booking has been assigned and is awaiting provider confirmation.',
      transaction
    );
    return Booking.findByPk(booking.id, {
      include: [{ model: BookingServiceItem, as: 'serviceItems' }],
      transaction
    });
  });
}

async function listAvailableProviders(userId, input) {
  return sequelize.transaction(async (transaction) => {
    const context = await getBookingContext(userId, {
      ...input,
      addonIds: input.addonIds || []
    }, transaction);
    const candidates = await Provider.findAll({
      where: { approvalStatus: 'approved', identityVerified: true, isOnline: true },
      include: [{
        model: ProviderService,
        as: 'providerServices',
        attributes: [],
        where: { serviceId: input.serviceId, isActive: true },
        required: true
      }, {
        model: User,
        as: 'user',
        attributes: [],
        where: { status: 'active', emailVerifiedAt: { [Op.ne]: null } },
        required: true
      }],
      attributes: ['id', 'displayName'],
      order: [['id', 'ASC']],
      transaction,
      distinct: true
    });
    const eligible = [];
    for (const candidate of candidates) {
      try {
        const providerResult = await assertProviderAvailable(
          candidate.id,
          input.serviceId,
          context.address,
          input.scheduledStart,
          context.scheduledEnd,
          transaction,
          false
        );
        eligible.push({
          id: candidate.id,
          displayName: candidate.displayName,
          price: calculateSubtotal(context, providerResult.providerService),
          currency: env.DEFAULT_CURRENCY
        });
      } catch (error) {
        if (!(error instanceof AppError) || ![
          'PROVIDER_UNAVAILABLE',
          'PROVIDER_SERVICE_UNAVAILABLE',
          'PROVIDER_AREA_UNAVAILABLE',
          'ADDRESS_AREA_REQUIRED',
          'SLOT_UNAVAILABLE'
        ].includes(error.code)) throw error;
      }
    }
    return {
      scheduledStart: input.scheduledStart,
      scheduledEnd: context.scheduledEnd,
      providers: eligible
    };
  });
}

async function listBookings(user, { page, limit }) {
  const roles = user.roles.map((role) => role.name);
  const where = {};

  if (roles.includes('customer')) {
    where.customerId = user.id;
  } else if (roles.includes('provider')) {
    const provider = await Provider.findOne({
      where: { userId: user.id },
      attributes: ['id', 'approvalStatus']
    });
    if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
    if (provider.approvalStatus !== 'approved') {
      throw new AppError('Provider account is awaiting approval or is unavailable', 403, 'PROVIDER_NOT_APPROVED');
    }
    where.providerId = provider.id;
  } else if (!roles.includes('admin')) {
    throw new AppError('No booking access is configured for this account', 403, 'FORBIDDEN');
  }

  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: [
      { model: Service, as: 'service', attributes: ['id', 'name', 'slug'] },
      { model: Provider, as: 'provider', attributes: ['id', 'displayName'], required: false },
      { model: BookingServiceItem, as: 'serviceItems' }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true
  });
  return {
    items: rows,
    meta: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
  };
}

async function lockBooking(bookingId, transaction) {
  const booking = await Booking.findByPk(bookingId, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  if (!booking) throw new AppError('Booking was not found', 404, 'BOOKING_NOT_FOUND');
  return booking;
}

function assertBookingUnchanged(original, current) {
  if (
    original.status !== current.status
    || original.providerId !== current.providerId
    || original.scheduledStart.getTime() !== current.scheduledStart.getTime()
    || original.scheduledEnd.getTime() !== current.scheduledEnd.getTime()
  ) {
    throw new AppError('Booking changed while the scheduling request was processed; retry the request', 409, 'BOOKING_CHANGED');
  }
}

async function assertBookingAccess(booking, user, transaction) {
  const roles = user.roles.map((role) => role.name);
  if (roles.includes('admin')) return;
  if (roles.includes('customer') && booking.customerId === user.id) return;
  if (roles.includes('provider') && booking.providerId) {
    const provider = await Provider.findOne({
      where: { id: booking.providerId, userId: user.id },
      attributes: ['id'],
      transaction
    });
    if (provider) return;
  }
  throw new AppError('You do not have access to this booking', 403, 'FORBIDDEN');
}

async function getBookingHistory(user, bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw new AppError('Booking was not found', 404, 'BOOKING_NOT_FOUND');
  await assertBookingAccess(booking, user);
  return BookingStatusHistory.findAll({
    where: { bookingId },
    order: [['createdAt', 'ASC']]
  });
}

async function providerForUser(userId, transaction) {
  const provider = await Provider.findOne({ where: { userId }, transaction });
  if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
  return provider;
}

async function respondToAssignment(user, bookingId, accepted, reason) {
  return sequelize.transaction(async (transaction) => {
    const booking = await lockBooking(bookingId, transaction);
    const provider = await providerForUser(user.id, transaction);
    if (booking.providerId !== provider.id || booking.status !== 'assigned') {
      throw new AppError('This booking is not awaiting your response', 409, 'BOOKING_NOT_ACTIONABLE');
    }
    if (accepted) {
      await setBookingStatus(booking, user.id, 'confirmed', transaction);
      await notifyUsers(booking, [booking.customerId], 'booking_confirmed', 'Your provider accepted the booking.', transaction);
      return booking;
    }

    await setBookingStatus(booking, user.id, 'pending', transaction, {
      providerId: null,
      reason,
      metadata: { action: 'provider_rejected' }
    });
    await notifyUsers(booking, [booking.customerId], 'booking_provider_rejected', 'The assigned provider declined. We are finding another provider.', transaction);
    const address = await Address.findByPk(booking.addressId, { transaction });
    const reassignment = await findAvailableProvider(
      booking.serviceId,
      address,
      booking.scheduledStart,
      booking.scheduledEnd,
      transaction,
      [provider.id]
    );
    if (reassignment) {
      await setBookingStatus(booking, user.id, 'assigned', transaction, { providerId: reassignment.provider.id });
      await notifyUsers(
        booking,
        [booking.customerId, reassignment.provider.userId],
        'booking_assigned',
        'A service booking has been reassigned and is awaiting provider confirmation.',
        transaction
      );
    }
    return booking;
  });
}

async function transitionProviderBooking(user, bookingId, action) {
  const transitions = {
    start: { from: 'confirmed', to: 'in_progress', type: 'booking_started', message: 'Your provider has started the service.' },
    complete: { from: 'in_progress', to: 'provider_completed', type: 'provider_completed', message: 'Your provider marked the service complete. Please confirm completion.' }
  };
  const transition = transitions[action];
  return sequelize.transaction(async (transaction) => {
    const booking = await lockBooking(bookingId, transaction);
    const provider = await providerForUser(user.id, transaction);
    if (booking.providerId !== provider.id || booking.status !== transition.from) {
      throw new AppError('This booking cannot be updated in its current state', 409, 'BOOKING_NOT_ACTIONABLE');
    }
    await setBookingStatus(booking, user.id, transition.to, transaction);
    await notifyUsers(booking, [booking.customerId], transition.type, transition.message, transaction);
    return booking;
  });
}

async function confirmCompletion(user, bookingId) {
  return sequelize.transaction(async (transaction) => {
    const booking = await lockBooking(bookingId, transaction);
    if (booking.customerId !== user.id || booking.status !== 'provider_completed') {
      throw new AppError('Only the customer can confirm a provider-completed booking', 409, 'BOOKING_NOT_ACTIONABLE');
    }
    await setBookingStatus(booking, user.id, 'completed', transaction);
    await notifyUsers(
      booking,
      [await getProviderUserId(booking.providerId, transaction)],
      'booking_completed',
      'The customer confirmed the service completion.',
      transaction
    );
    return booking;
  });
}

async function cancelBooking(user, bookingId, reason) {
  return sequelize.transaction(async (transaction) => {
    const booking = await lockBooking(bookingId, transaction);
    const roles = user.roles.map((role) => role.name);
    if (!roles.includes('admin') && booking.customerId !== user.id) {
      throw new AppError('Only the customer or an admin can cancel this booking', 403, 'FORBIDDEN');
    }
    if (!['pending', 'assigned', 'confirmed'].includes(booking.status) || booking.scheduledStart <= new Date()) {
      throw new AppError('This booking can no longer be cancelled', 409, 'BOOKING_NOT_CANCELLABLE');
    }
    await setBookingStatus(booking, user.id, 'cancelled', transaction, {
      cancellationReason: reason || null,
      reason
    });
    await notifyUsers(
      booking,
      [booking.customerId, await getProviderUserId(booking.providerId, transaction)],
      'booking_cancelled',
      'The booking has been cancelled.',
      transaction
    );
    return booking;
  });
}

async function rescheduleBooking(user, bookingId, scheduledStart) {
  return sequelize.transaction(async (transaction) => {
    const originalBooking = await Booking.findByPk(bookingId, { transaction });
    if (!originalBooking) throw new AppError('Booking was not found', 404, 'BOOKING_NOT_FOUND');
    const roles = user.roles.map((role) => role.name);
    if (!roles.includes('admin') && originalBooking.customerId !== user.id) {
      throw new AppError('Only the customer or an admin can reschedule this booking', 403, 'FORBIDDEN');
    }
    if (!reschedulableStatuses.includes(originalBooking.status)) {
      throw new AppError('This booking can no longer be rescheduled', 409, 'BOOKING_NOT_RESCHEDULABLE');
    }
    assertFutureDate(scheduledStart);
    const scheduledEnd = new Date(scheduledStart.getTime() + (originalBooking.scheduledEnd - originalBooking.scheduledStart));
    const address = await Address.findByPk(originalBooking.addressId, { transaction });
    let reassignment = null;
    if (originalBooking.providerId) {
      try {
        reassignment = await assertProviderAvailable(
          originalBooking.providerId,
          originalBooking.serviceId,
          address,
          scheduledStart,
          scheduledEnd,
          transaction,
          true,
          originalBooking.id
        );
      } catch (error) {
        if (!(error instanceof AppError) || ![
          'PROVIDER_UNAVAILABLE',
          'PROVIDER_SERVICE_UNAVAILABLE',
          'PROVIDER_AREA_UNAVAILABLE',
          'ADDRESS_AREA_REQUIRED',
          'SLOT_UNAVAILABLE'
        ].includes(error.code)) throw error;
      }
    }
    if (!reassignment) {
      reassignment = await findAvailableProvider(
        originalBooking.serviceId,
        address,
        scheduledStart,
        scheduledEnd,
        transaction,
        originalBooking.providerId ? [originalBooking.providerId] : []
      );
    }
    if (!reassignment) {
      throw new AppError('No eligible provider is available for the new time slot', 409, 'NO_PROVIDER_AVAILABLE');
    }
    const booking = await lockBooking(bookingId, transaction);
    assertBookingUnchanged(originalBooking, booking);
    await setBookingStatus(booking, user.id, 'assigned', transaction, {
      providerId: reassignment.provider.id,
      scheduledStart,
      scheduledEnd,
      reason: 'Booking rescheduled'
    });
    await notifyUsers(
      booking,
      [booking.customerId, reassignment.provider.userId],
      'booking_rescheduled',
      'The booking was rescheduled and is awaiting provider confirmation.',
      transaction
    );
    return booking;
  });
}

async function manuallyAssignBooking(user, bookingId, providerId) {
  return sequelize.transaction(async (transaction) => {
    const originalBooking = await Booking.findByPk(bookingId, { transaction });
    if (!originalBooking) throw new AppError('Booking was not found', 404, 'BOOKING_NOT_FOUND');
    if (!assignableStatuses.includes(originalBooking.status)) {
      throw new AppError('Only pending bookings can be assigned', 409, 'BOOKING_NOT_ASSIGNABLE');
    }
    assertFutureDate(originalBooking.scheduledStart);
    const address = await Address.findByPk(originalBooking.addressId, { transaction });
    const eligible = await assertProviderAvailable(
      providerId,
      originalBooking.serviceId,
      address,
      originalBooking.scheduledStart,
      originalBooking.scheduledEnd,
      transaction,
      true,
      originalBooking.id
    );
    const booking = await lockBooking(bookingId, transaction);
    assertBookingUnchanged(originalBooking, booking);
    await setBookingStatus(booking, user.id, 'assigned', transaction, {
      providerId: eligible.provider.id,
      reason: 'Assigned by administrator'
    });
    await notifyUsers(
      booking,
      [booking.customerId, eligible.provider.userId],
      'booking_assigned',
      'A service booking has been assigned and is awaiting provider confirmation.',
      transaction
    );
    return booking;
  });
}

async function listNotifications(userId, { page, limit }) {
  const { count, rows } = await Notification.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });
  return {
    items: rows,
    meta: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
  };
}

async function markNotificationRead(userId, notificationId) {
  const notification = await Notification.findOne({ where: { id: notificationId, userId } });
  if (!notification) throw new AppError('Notification was not found', 404, 'NOTIFICATION_NOT_FOUND');
  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }
  return notification;
}

module.exports = {
  createBooking,
  listBookings,
  listAvailableProviders,
  getBookingHistory,
  respondToAssignment,
  transitionProviderBooking,
  confirmCompletion,
  cancelBooking,
  rescheduleBooking,
  manuallyAssignBooking,
  listNotifications,
  markNotificationRead
};
