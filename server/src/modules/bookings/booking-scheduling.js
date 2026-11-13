const { Op } = require('sequelize');
const {
  Address,
  Booking,
  Provider,
  ProviderArea,
  ProviderAvailability,
  ProviderService,
  ServiceArea,
  Area,
  User
} = require('../../models');
const AppError = require('../../utils/app-error');
const {
  hasCurrentIdentityDocuments,
  isProviderBookable
} = require('../providers/provider-verification');

const occupyingStatuses = ['pending', 'assigned', 'confirmed', 'in_progress', 'provider_completed'];

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

async function assertProviderAvailable(providerId, serviceId, address, start, end, transaction, lock = true, ignoreBookingId) {
  const provider = await Provider.findOne({
    where: {
      id: providerId,
      approvalStatus: 'approved',
      identityVerified: true,
      isOnline: true
    },
    transaction,
    lock: lock && transaction ? transaction.LOCK.UPDATE : undefined
  });
  if (!provider) throw new AppError('Provider is not approved, verified, and online', 409, 'PROVIDER_UNAVAILABLE');

  const user = await User.findOne({
    where: { id: provider.userId, status: 'active' },
    attributes: ['id', 'status', 'emailVerifiedAt'],
    transaction
  });
  const currentIdentity = await hasCurrentIdentityDocuments(provider.id, transaction);
  if (!isProviderBookable(provider, user, currentIdentity)) {
    throw new AppError('Provider identity documents are no longer valid', 409, 'PROVIDER_UNAVAILABLE');
  }

  const providerService = await ProviderService.findOne({
    where: { providerId: provider.id, serviceId, isActive: true },
    transaction
  });
  if (!providerService) {
    throw new AppError('Provider is not approved for this service', 409, 'PROVIDER_SERVICE_UNAVAILABLE');
  }

  const configuredServiceAreas = await ServiceArea.count({
    where: { serviceId, isActive: true },
    transaction
  });
  if (address.areaId) {
    const area = await Area.findOne({
      where: { id: address.areaId, cityId: address.cityId, isActive: true },
      attributes: ['id'],
      transaction
    });
    if (!area) throw new AppError('Booking address area is unavailable', 400, 'AREA_NOT_AVAILABLE');
    if (configuredServiceAreas > 0) {
      const serviceArea = await ServiceArea.findOne({
        where: { serviceId, areaId: address.areaId, isActive: true },
        transaction
      });
      if (!serviceArea) throw new AppError('Service is not available at this address', 400, 'SERVICE_NOT_AVAILABLE');
    }
  } else if (configuredServiceAreas > 0) {
    throw new AppError('Select a service area for this address', 400, 'ADDRESS_AREA_REQUIRED');
  }

  const configuredProviderAreas = await ProviderArea.count({
    where: { providerId: provider.id, isActive: true },
    transaction
  });
  if (configuredProviderAreas > 0) {
    if (!address.areaId) throw new AppError('Booking address must include a service area for this provider', 400, 'ADDRESS_AREA_REQUIRED');
    const servesArea = await ProviderArea.findOne({
      where: { providerId: provider.id, areaId: address.areaId, isActive: true },
      transaction
    });
    if (!servesArea) throw new AppError('Provider does not serve this address', 409, 'PROVIDER_AREA_UNAVAILABLE');
  }

  const availability = await ProviderAvailability.findAll({
    where: { providerId: provider.id, isAvailable: true },
    transaction
  });
  if (!availability.some((window) => isWithinAvailability(window, start, end))) {
    throw new AppError('Provider is not available at the selected time', 409, 'PROVIDER_UNAVAILABLE');
  }

  const conflictingBooking = await Booking.findOne({
    where: {
      providerId: provider.id,
      status: { [Op.in]: occupyingStatuses },
      ...(ignoreBookingId ? { id: { [Op.ne]: ignoreBookingId } } : {}),
      scheduledStart: { [Op.lt]: end },
      scheduledEnd: { [Op.gt]: start }
    },
    attributes: ['id'],
    transaction,
    lock: lock && transaction ? transaction.LOCK.UPDATE : undefined
  });
  if (conflictingBooking) {
    throw new AppError('Provider already has a booking during that time', 409, 'SLOT_UNAVAILABLE');
  }
  return { provider, providerService };
}

async function findAvailableProvider(serviceId, address, start, end, transaction, excludedProviderIds = []) {
  const candidates = await Provider.findAll({
    where: { approvalStatus: 'approved', identityVerified: true, isOnline: true },
    include: [{
      model: ProviderService,
      as: 'providerServices',
      attributes: [],
      where: { serviceId, isActive: true },
      required: true
    }, {
      model: User,
      as: 'user',
      attributes: [],
      where: { status: 'active', emailVerifiedAt: { [Op.ne]: null } },
      required: true
    }],
    attributes: ['id'],
    order: [['id', 'ASC']],
    transaction,
    distinct: true
  });

  for (const candidate of candidates) {
    if (excludedProviderIds.includes(candidate.id)) continue;
    try {
      return await assertProviderAvailable(
        candidate.id, serviceId, address, start, end, transaction, true
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
  return null;
}

async function getBookingAddress(customerId, addressId, transaction) {
  const address = await Address.findOne({
    where: { id: addressId, userId: customerId },
    transaction
  });
  if (!address) throw new AppError('Address was not found', 404, 'ADDRESS_NOT_FOUND');
  return address;
}

module.exports = {
  occupyingStatuses,
  isWithinAvailability,
  assertProviderAvailable,
  findAvailableProvider,
  getBookingAddress
};
