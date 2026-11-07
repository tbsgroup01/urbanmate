const crypto = require('node:crypto');
const { Op } = require('sequelize');
const env = require('../../config/env');
const {
  sequelize,
  Address,
  Booking,
  Provider,
  ProviderArea,
  ProviderAvailability,
  ProviderService,
  Service,
  ServiceCategory,
  ServiceArea,
  ServicePackage,
  ServiceAddon,
  ServicePricingRule,
  BookingServiceItem,
  Area,
  User
} = require('../../models');
const AppError = require('../../utils/app-error');
const { calculateEffectivePrice, roundPrice } = require('../catalog/pricing');
const {
  hasCurrentIdentityDocuments,
  isProviderBookable
} = require('../providers/provider-verification');

function getLocalSchedule(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    weekday: weekdays[values.weekday],
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:00`
  };
}

function isWithinAvailability(window, start, end) {
  const localStart = getLocalSchedule(start, window.timezone);
  const localEnd = getLocalSchedule(end, window.timezone);
  return localStart.date === localEnd.date
    && window.weekday === localStart.weekday
    && (!window.effectiveFrom || window.effectiveFrom <= localStart.date)
    && (!window.effectiveUntil || window.effectiveUntil >= localStart.date)
    && window.startTime <= localStart.time
    && window.endTime >= localEnd.time;
}

async function createBooking(customerId, input) {
  return sequelize.transaction(async (transaction) => {
    const [service, address] = await Promise.all([
      Service.findOne({ where: { id: input.serviceId, isActive: true }, transaction }),
      Address.findOne({ where: { id: input.addressId, userId: customerId }, transaction })
    ]);

    if (!service) throw new AppError('Service was not found or is unavailable', 404, 'SERVICE_NOT_FOUND');
    if (!address) throw new AppError('Address was not found', 404, 'ADDRESS_NOT_FOUND');
    if (input.scheduledStart <= new Date()) {
      throw new AppError('Booking time must be in the future', 400, 'INVALID_BOOKING_TIME');
    }

    const category = await ServiceCategory.findByPk(service.categoryId, {
      include: [{ model: ServiceCategory, as: 'parent', attributes: ['id', 'isActive'], required: false }],
      transaction
    });
    if (!category?.isActive || (category.parent && !category.parent.isActive)) {
      throw new AppError('Service category is unavailable', 404, 'SERVICE_NOT_FOUND');
    }

    const location = { cityId: address.cityId, areaId: address.areaId };
    const availabilityConfigured = await ServiceArea.count({
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
      if (availabilityConfigured > 0) {
        const serviceArea = await ServiceArea.findOne({
          where: { serviceId: service.id, areaId: location.areaId, isActive: true },
          transaction
        });
        if (!serviceArea) throw new AppError('Service is not available at this address', 400, 'SERVICE_NOT_AVAILABLE');
      }
    } else if (availabilityConfigured > 0) {
      throw new AppError('Select a service area for this address', 400, 'ADDRESS_AREA_REQUIRED');
    }

    const [selectedPackage, selectedAddons] = await Promise.all([
      input.packageId
        ? ServicePackage.findOne({
          where: { id: input.packageId, serviceId: service.id, isActive: true },
          transaction
        })
        : null,
      input.addonIds.length
        ? ServiceAddon.findAll({
          where: { id: { [Op.in]: input.addonIds }, serviceId: service.id, isActive: true },
          transaction
        })
        : []
    ]);
    if (input.packageId && !selectedPackage) {
      throw new AppError('Package is unavailable for this service', 400, 'INVALID_SERVICE_PACKAGE');
    }
    if (selectedAddons.length !== input.addonIds.length) {
      throw new AppError('One or more add-ons are unavailable for this service', 400, 'INVALID_SERVICE_ADDON');
    }

    let provider;
    let providerService;
    if (input.providerId) {
      provider = await Provider.findOne({
        where: {
          id: input.providerId,
          approvalStatus: 'approved',
          identityVerified: true,
          isOnline: true
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'status', 'emailVerifiedAt'],
          where: { status: 'active' },
          required: true
        }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!provider) {
        throw new AppError('Provider is not verified, approved, and online', 400, 'PROVIDER_UNAVAILABLE');
      }
      const currentIdentity = await hasCurrentIdentityDocuments(provider.id, transaction);
      if (!isProviderBookable(provider, provider.user, currentIdentity)) {
        throw new AppError('Provider identity documents have expired or are no longer verified', 400, 'PROVIDER_UNAVAILABLE');
      }

      providerService = await ProviderService.findOne({
        where: { providerId: provider.id, serviceId: service.id, isActive: true },
        transaction
      });
      if (!providerService) {
        throw new AppError('Provider is not approved for this service', 400, 'PROVIDER_SERVICE_UNAVAILABLE');
      }
      const providerCoverageConfigured = await ProviderArea.count({
        where: { providerId: provider.id, isActive: true },
        transaction
      });
      if (providerCoverageConfigured > 0) {
        if (!location.areaId) {
          throw new AppError('Booking address must include a service area for this provider', 400, 'ADDRESS_AREA_REQUIRED');
        }
        const servesArea = await ProviderArea.findOne({
          where: { providerId: provider.id, areaId: location.areaId, isActive: true },
          transaction
        });
        if (!servesArea) throw new AppError('Provider does not serve this address', 400, 'PROVIDER_AREA_UNAVAILABLE');
      }
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
    const serviceBasePrice = providerService?.customPrice ?? service.basePrice;
    const selectedPrice = selectedPackage
      ? Number(selectedPackage.price)
      : calculateEffectivePrice(serviceBasePrice, pricingRules, location, now);
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);
    const subtotal = roundPrice(selectedPrice + addonsPrice).toFixed(2);
    const durationMinutes = (selectedPackage?.durationMinutes || service.durationMinutes)
      + selectedAddons.reduce((sum, addon) => sum + addon.durationMinutes, 0);
    const scheduledEnd = new Date(input.scheduledStart.getTime() + durationMinutes * 60_000);
    if (provider) {
      const availability = await ProviderAvailability.findAll({
        where: { providerId: provider.id, isAvailable: true },
        transaction
      });
      const insideAvailability = availability.some((window) => (
        isWithinAvailability(window, input.scheduledStart, scheduledEnd)
      ));
      if (!insideAvailability) {
        throw new AppError('Provider is not available at the selected time', 409, 'PROVIDER_UNAVAILABLE');
      }

      const conflictingBooking = await Booking.findOne({
        where: {
          providerId: provider.id,
          status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] },
          scheduledStart: { [Op.lt]: scheduledEnd },
          scheduledEnd: { [Op.gt]: input.scheduledStart }
        },
        attributes: ['id'],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (conflictingBooking) {
        throw new AppError('Provider already has a booking during that time', 409, 'SLOT_UNAVAILABLE');
      }
    }

    const booking = await Booking.create({
      bookingNumber: `UM-${crypto.randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`,
      customerId,
      providerId: input.providerId || null,
      serviceId: service.id,
      addressId: address.id,
      serviceNameSnapshot: service.name,
      scheduledStart: input.scheduledStart,
      scheduledEnd,
      status: 'pending',
      subtotal,
      platformFee: '0.00',
      tax: '0.00',
      total: subtotal,
      currency: env.DEFAULT_CURRENCY,
      customerNotes: input.customerNotes || null
    }, { transaction });

    const bookingItems = [
      ...(selectedPackage ? [{
        bookingId: booking.id,
        itemType: 'package',
        servicePackageId: selectedPackage.id,
        nameSnapshot: selectedPackage.name,
        unitPrice: selectedPackage.price,
        durationMinutes: selectedPackage.durationMinutes
      }] : []),
      ...selectedAddons.map((addon) => ({
        bookingId: booking.id,
        itemType: 'addon',
        serviceAddonId: addon.id,
        nameSnapshot: addon.name,
        unitPrice: addon.price,
        durationMinutes: addon.durationMinutes
      }))
    ];
    if (bookingItems.length) {
      await BookingServiceItem.bulkCreate(bookingItems, { transaction });
    }
    return Booking.findByPk(booking.id, {
      include: [{ model: BookingServiceItem, as: 'serviceItems' }],
      transaction
    });
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

module.exports = { createBooking, listBookings };
