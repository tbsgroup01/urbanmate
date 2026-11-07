const { Op, fn, col } = require('sequelize');
const {
  sequelize,
  User,
  Provider,
  ProviderDocument,
  ProviderAvailability,
  ProviderService,
  ProviderArea,
  Service,
  Area,
  City,
  Review,
  Commission,
  Booking,
  ProviderAvailability
} = require('../../models');
const AppError = require('../../utils/app-error');
const documentStorage = require('./document-storage.service');
const { hasCurrentIdentityDocuments } = require('./provider-verification');

const publicProviderAttributes = [
  'id', 'displayName', 'businessName', 'bio', 'professionalTitle',
  'businessType', 'experienceYears', 'averageRating', 'reviewCount'
];

async function findProvider(userId, transaction) {
  const provider = await Provider.findOne({
    where: { userId },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });
  if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
  return provider;
}

function documentSummary(document) {
  return {
    id: document.id,
    documentType: document.documentType,
    status: document.status,
    contentType: document.contentType,
    fileSizeBytes: document.fileSizeBytes,
    expiresAt: document.expiresAt,
    uploadedAt: document.uploadedAt,
    reviewedAt: document.reviewedAt,
    rejectionReason: document.rejectionReason,
    createdAt: document.createdAt
  };
}

function providerSummary(provider, includePrivate = false) {
  const result = provider.get({ plain: true });
  delete result.approvalReviewedBy;
  delete result.approvalReviewedAt;
  if (result.user) {
    result.user = includePrivate
      ? {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone,
        emailVerified: Boolean(result.user.emailVerifiedAt)
      }
      : undefined;
  }
  if (result.documents) result.documents = result.documents.map(documentSummary);
  return result;
}

async function getMyProfile(userId) {
  const provider = await Provider.findOne({
    where: { userId },
    include: [
      { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone', 'emailVerifiedAt'] },
      {
        model: ProviderDocument,
        as: 'documents',
        attributes: ['id', 'documentType', 'status', 'contentType', 'fileSizeBytes', 'expiresAt', 'uploadedAt', 'reviewedAt', 'rejectionReason', 'createdAt'],
        separate: true,
        order: [['createdAt', 'DESC']]
      }
    ]
  });
  if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
  return providerSummary(provider, true);
}

async function updateMyProfile(userId, input) {
  return sequelize.transaction(async (transaction) => {
    const provider = await findProvider(userId, transaction);
    const userFields = {};
    for (const key of ['fullName', 'phone']) {
      if (Object.hasOwn(input, key)) {
        userFields[key] = input[key];
        delete input[key];
      }
    }
    if (Object.keys(userFields).length) {
      const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
      await user.update(userFields, { transaction });
    }
    const identityChanged = Object.hasOwn(input, 'legalName') || Object.hasOwn(input, 'dateOfBirth');
    await provider.update(input, { transaction });
    if (identityChanged && provider.identityVerified) {
      await provider.update({
        identityVerified: false,
        approvalStatus: 'pending',
        isOnline: false,
        approvalReviewedBy: null,
        approvalReviewedAt: null
      }, { transaction });
    }
    return getMyProfile(userId);
  });
}

async function requestDocumentUpload(userId, input) {
  const provider = await findProvider(userId);
  const storageKey = documentStorage.createStorageKey(provider.id);
  const uploadUrl = await documentStorage.createUploadUrl({
    key: storageKey,
    contentType: input.contentType,
    contentLength: input.fileSizeBytes
  });
  const document = await sequelize.transaction(async (transaction) => {
    const lockedProvider = await findProvider(userId, transaction);
    if (input.documentType === 'identity_front' || input.documentType === 'identity_back') {
      await lockedProvider.update({
        identityVerified: false,
        ...(lockedProvider.approvalStatus === 'approved' ? { approvalStatus: 'pending' } : {}),
        isOnline: false,
        approvalReviewedBy: null,
        approvalReviewedAt: null
      }, { transaction });
    }
    return ProviderDocument.create({
      providerId: lockedProvider.id,
      documentType: input.documentType,
      storageKey,
      status: 'pending',
      contentType: input.contentType,
      fileSizeBytes: input.fileSizeBytes,
      expiresAt: input.expiresAt || null
    }, { transaction });
  });
  return {
    document: documentSummary(document),
    uploadUrl,
    method: 'PUT',
    headers: { 'Content-Type': input.contentType },
    expiresInSeconds: documentStorage.UPLOAD_URL_TTL_SECONDS
  };
}

async function completeDocumentUpload(userId, documentId) {
  const provider = await findProvider(userId);
  const document = await ProviderDocument.findOne({
    where: { id: documentId, providerId: provider.id }
  });
  if (!document) throw new AppError('Provider document was not found', 404, 'DOCUMENT_NOT_FOUND');
  if (document.uploadedAt) return documentSummary(document);
  await documentStorage.verifyUploadedObject(document);
  document.uploadedAt = new Date();
  await document.save({ fields: ['uploadedAt'] });
  return documentSummary(document);
}

async function getDocumentDownload(userId, documentId, isAdmin = false) {
  const where = { id: documentId };
  if (!isAdmin) {
    const provider = await findProvider(userId);
    where.providerId = provider.id;
  }
  const document = await ProviderDocument.findOne({ where });
  if (!document) throw new AppError('Provider document was not found', 404, 'DOCUMENT_NOT_FOUND');
  if (!document.uploadedAt) throw new AppError('Document upload has not been completed', 409, 'DOCUMENT_NOT_UPLOADED');
  return {
    downloadUrl: await documentStorage.createDownloadUrl(document.storageKey),
    expiresInSeconds: 60
  };
}

async function refreshIdentityState(providerId, transaction) {
  const verified = await hasCurrentIdentityDocuments(providerId, transaction);
  const provider = await Provider.findByPk(providerId, { transaction, lock: transaction.LOCK.UPDATE });
  const changes = { identityVerified: verified };
  if (!verified && provider.approvalStatus === 'approved') {
    Object.assign(changes, {
      approvalStatus: 'pending',
      isOnline: false,
      approvalReviewedBy: null,
      approvalReviewedAt: null
    });
  }
  await provider.update(changes, { transaction });
  return provider;
}

async function reviewDocument(adminId, documentId, input) {
  return sequelize.transaction(async (transaction) => {
    const document = await ProviderDocument.findByPk(documentId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!document) throw new AppError('Provider document was not found', 404, 'DOCUMENT_NOT_FOUND');
    if (!document.uploadedAt) throw new AppError('Document upload has not been completed', 409, 'DOCUMENT_NOT_UPLOADED');
    document.status = input.status;
    document.reviewedBy = adminId;
    document.reviewedAt = new Date();
    document.rejectionReason = input.status === 'rejected' ? input.rejectionReason : null;
    await document.save({ transaction });
    const provider = await refreshIdentityState(document.providerId, transaction);
    return {
      document: documentSummary(document),
      identityVerified: provider.identityVerified,
      approvalStatus: provider.approvalStatus
    };
  });
}

async function setProviderDecision(adminId, providerId, input) {
  return sequelize.transaction(async (transaction) => {
    const provider = await Provider.findByPk(providerId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'status', 'emailVerifiedAt'], required: true }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
    if (input.status === 'approved') {
      if (provider.user.status !== 'active') {
        throw new AppError('Provider account must be active before approval', 409, 'PROVIDER_ACCOUNT_INACTIVE');
      }
      if (!provider.user.emailVerifiedAt) {
        throw new AppError('Provider email must be verified before approval', 409, 'PROVIDER_EMAIL_UNVERIFIED');
      }
      if (!provider.legalName || !provider.dateOfBirth || !provider.professionalTitle) {
        throw new AppError('Provider personal and professional profile is incomplete', 409, 'PROVIDER_PROFILE_INCOMPLETE');
      }
      await refreshIdentityState(provider.id, transaction);
      await provider.reload({ transaction });
      if (!provider.identityVerified) {
        throw new AppError('Both current identity documents must be approved before provider approval', 409, 'IDENTITY_VERIFICATION_REQUIRED');
      }
    }
    await provider.update({
      approvalStatus: input.status,
      approvalReviewedBy: adminId,
      approvalReviewedAt: new Date(),
      rejectionReason: input.status === 'rejected' ? input.rejectionReason : null,
      isOnline: false
    }, { transaction });
    return providerSummary(provider);
  });
}

async function listAdminProviders(filters) {
  const where = filters.status ? { approvalStatus: filters.status } : {};
  if (filters.q) {
    where[Op.or] = [
      { displayName: { [Op.like]: `%${filters.q}%` } },
      { legalName: { [Op.like]: `%${filters.q}%` } },
      { businessName: { [Op.like]: `%${filters.q}%` } },
      { '$user.email$': { [Op.like]: `%${filters.q}%` } }
    ];
  }
  const { count, rows } = await Provider.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone', 'status', 'emailVerifiedAt'], required: true }],
    order: [['createdAt', 'DESC']],
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    distinct: true
  });
  return {
    items: rows.map((provider) => providerSummary(provider, true)),
    meta: { page: filters.page, limit: filters.limit, totalItems: count, totalPages: Math.ceil(count / filters.limit) }
  };
}

async function getAdminProvider(providerId) {
  const provider = await Provider.findByPk(providerId, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone', 'status', 'emailVerifiedAt'] },
      {
        model: ProviderDocument,
        as: 'documents',
        attributes: ['id', 'documentType', 'status', 'contentType', 'fileSizeBytes', 'expiresAt', 'uploadedAt', 'reviewedAt', 'rejectionReason', 'createdAt'],
        separate: true,
        order: [['createdAt', 'DESC']]
      }
    ]
  });
  if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
  return providerSummary(provider, true);
}

async function setProviderServices(userId, services) {
  const provider = await findProvider(userId);
  const serviceIds = services.map((item) => item.serviceId);
  const activeServices = serviceIds.length
    ? await Service.findAll({ where: { id: { [Op.in]: serviceIds }, isActive: true }, attributes: ['id'] })
    : [];
  if (activeServices.length !== serviceIds.length) {
    throw new AppError('One or more selected services are unavailable', 400, 'INVALID_PROVIDER_SERVICES');
  }
  await sequelize.transaction(async (transaction) => {
    await ProviderService.destroy({ where: { providerId: provider.id }, transaction });
    if (services.length) {
      await ProviderService.bulkCreate(services.map((item) => ({
        providerId: provider.id,
        serviceId: item.serviceId,
        customPrice: item.customPrice ?? null,
        isActive: item.isActive
      })), { transaction });
    }
  });
  return getProviderServices(provider.id);
}

async function getProviderServices(providerId) {
  return ProviderService.findAll({
    where: { providerId },
    include: [{ model: Service, as: 'service', attributes: ['id', 'name', 'slug', 'basePrice', 'durationMinutes', 'isActive'] }],
    order: [[{ model: Service, as: 'service' }, 'name', 'ASC']]
  });
}

async function setProviderAreas(userId, areaIds) {
  const provider = await findProvider(userId);
  const uniqueIds = [...new Set(areaIds)];
  const areas = uniqueIds.length ? await Area.findAll({
    where: { id: { [Op.in]: uniqueIds }, isActive: true },
    attributes: ['id']
  }) : [];
  if (areas.length !== uniqueIds.length) {
    throw new AppError('One or more selected service areas are unavailable', 400, 'INVALID_PROVIDER_AREAS');
  }
  await sequelize.transaction(async (transaction) => {
    await ProviderArea.destroy({ where: { providerId: provider.id }, transaction });
    if (uniqueIds.length) {
      await ProviderArea.bulkCreate(uniqueIds.map((areaId) => ({
        providerId: provider.id,
        areaId,
        isActive: true
      })), { transaction });
    }
  });
  return getProviderAreas(provider.id);
}

async function getProviderAreas(providerId) {
  return ProviderArea.findAll({
    where: { providerId, isActive: true },
    include: [{
      model: Area,
      as: 'area',
      attributes: ['id', 'name', 'slug'],
      include: [{ model: City, as: 'city', attributes: ['id', 'name', 'slug'] }]
    }],
    order: [[{ model: Area, as: 'area' }, 'name', 'ASC']]
  });
}

async function setAvailability(userId, windows) {
  const provider = await findProvider(userId);
  await sequelize.transaction(async (transaction) => {
    await ProviderAvailability.destroy({ where: { providerId: provider.id }, transaction });
    if (windows.length) {
      await ProviderAvailability.bulkCreate(windows.map((window) => ({ ...window, providerId: provider.id })), { transaction });
    }
  });
  return ProviderAvailability.findAll({
    where: { providerId: provider.id },
    order: [['weekday', 'ASC'], ['startTime', 'ASC']]
  });
}

async function setOnlineStatus(userId, isOnline) {
  return sequelize.transaction(async (transaction) => {
    const provider = await findProvider(userId, transaction);
    if (isOnline) {
      const user = await User.findByPk(userId, { attributes: ['status'], transaction });
      const currentIdentity = await hasCurrentIdentityDocuments(provider.id, transaction);
      if (user.status !== 'active' || provider.approvalStatus !== 'approved' || !provider.identityVerified || !currentIdentity) {
        throw new AppError('Only active, identity-verified, approved providers can go online', 403, 'PROVIDER_NOT_ELIGIBLE');
      }
    }
    await provider.update({ isOnline }, { transaction });
    return { isOnline: provider.isOnline };
  });
}

async function getEarnings(userId) {
  const provider = await findProvider(userId);
  const rows = await Commission.findAll({
    where: { providerId: provider.id },
    attributes: ['currency', 'status', [fn('SUM', col('amount')), 'amount'], [fn('COUNT', col('id')), 'count']],
    group: ['currency', 'status'],
    raw: true
  });
  const currencies = {};
  for (const row of rows) {
    currencies[row.currency] ||= { pending: 0, payable: 0, paid: 0, reversed: 0, totalPaid: 0 };
    const amount = Number(row.amount || 0);
    currencies[row.currency][row.status] = amount;
    if (row.status === 'paid') currencies[row.currency].totalPaid = amount;
  }
  return { providerId: provider.id, currencies };
}

async function getProviderReviews(providerId, { page, limit, rating }) {
  const provider = await Provider.findOne({
    where: { id: providerId, approvalStatus: 'approved', identityVerified: true },
    attributes: ['id']
  });
  if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
  const where = { providerId, status: 'published' };
  if (rating) where.rating = rating;
  const { count, rows } = await Review.findAndCountAll({
    where,
    attributes: ['id', 'rating', 'comment', 'createdAt'],
    include: [{ model: User, as: 'customer', attributes: ['fullName'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true
  });
  return {
    items: rows.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      customerName: review.customer ? review.customer.fullName.split(' ')[0] : 'Customer'
    })),
    meta: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) }
  };
}

async function getPublicProvider(providerId) {
  const provider = await Provider.findOne({
    where: { id: providerId, approvalStatus: 'approved', identityVerified: true },
    attributes: publicProviderAttributes,
    include: [
      {
        model: ProviderService,
        as: 'providerServices',
        attributes: ['customPrice'],
        where: { isActive: true },
        required: false,
        include: [{ model: Service, as: 'service', attributes: ['id', 'name', 'slug', 'basePrice', 'durationMinutes'] }]
      },
      {
        model: ProviderArea,
        as: 'providerAreas',
        attributes: [],
        where: { isActive: true },
        required: false,
        include: [{
          model: Area,
          as: 'area',
          attributes: ['id', 'name', 'slug'],
          include: [{ model: City, as: 'city', attributes: ['id', 'name', 'slug'] }]
        }]
      },
      {
        model: ProviderAvailability,
        as: 'availability',
        attributes: ['weekday', 'startTime', 'endTime', 'timezone', 'effectiveFrom', 'effectiveUntil'],
        where: { isAvailable: true },
        required: false
      }
    ]
  });
  if (!provider) throw new AppError('Provider profile was not found', 404, 'PROVIDER_PROFILE_NOT_FOUND');
  const plain = provider.get({ plain: true });
  const aggregate = await Review.findOne({
    where: { providerId, status: 'published' },
    attributes: [[fn('AVG', col('rating')), 'averageRating'], [fn('COUNT', col('id')), 'reviewCount']],
    raw: true
  });
  plain.averageRating = Number(aggregate.averageRating || 0).toFixed(2);
  plain.reviewCount = Number(aggregate.reviewCount || 0);
  plain.availability.sort((first, second) => first.weekday - second.weekday || first.startTime.localeCompare(second.startTime));
  return plain;
}

async function createReview(customerId, input) {
  return sequelize.transaction(async (transaction) => {
    const booking = await Booking.findOne({
      where: {
        id: input.bookingId,
        customerId,
        status: 'completed',
        providerId: { [Op.ne]: null }
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!booking) {
      throw new AppError('Only a completed booking assigned to a provider can be reviewed', 409, 'BOOKING_NOT_REVIEWABLE');
    }
    const review = await Review.create({
      bookingId: booking.id,
      customerId,
      providerId: booking.providerId,
      rating: input.rating,
      comment: input.comment || null,
      status: 'published'
    }, { transaction });
    const aggregate = await Review.findOne({
      where: { providerId: booking.providerId, status: 'published' },
      attributes: [[fn('AVG', col('rating')), 'averageRating'], [fn('COUNT', col('id')), 'reviewCount']],
      raw: true,
      transaction
    });
    await Provider.update({
      averageRating: Number(aggregate.averageRating || 0),
      reviewCount: Number(aggregate.reviewCount || 0)
    }, { where: { id: booking.providerId }, transaction });
    return review;
  });
}

async function listPublicProviders(filters) {
  const where = { approvalStatus: 'approved', identityVerified: true, isOnline: true };
  const includes = [];
  if (filters.serviceId) {
    includes.push({
      model: Service,
      as: 'services',
      attributes: ['id'],
      where: { id: filters.serviceId, isActive: true },
      through: { attributes: [], where: { isActive: true } },
      required: true
    });
  }
  if (filters.cityId) {
    includes.push({
      model: Area,
      as: 'serviceAreas',
      attributes: [],
      where: { isActive: true, ...(filters.areaId ? { id: filters.areaId } : {}) },
      through: { attributes: [], where: { isActive: true } },
      include: [{
        model: City,
        as: 'city',
        attributes: [],
        where: { id: filters.cityId, isActive: true }
      }],
      required: true
    });
  }
  const sortFields = {
    rating: 'averageRating',
    reviews: 'reviewCount',
    experience: 'experienceYears'
  };
  const { count, rows } = await Provider.findAndCountAll({
    where,
    attributes: publicProviderAttributes,
    include: includes,
    order: [[sortFields[filters.sortBy], filters.order.toUpperCase()], ['id', 'ASC']],
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    distinct: true
  });
  return {
    items: rows,
    meta: { page: filters.page, limit: filters.limit, totalItems: count, totalPages: Math.ceil(count / filters.limit) }
  };
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  requestDocumentUpload,
  completeDocumentUpload,
  getDocumentDownload,
  reviewDocument,
  setProviderDecision,
  listAdminProviders,
  getAdminProvider,
  setProviderServices,
  getProviderServices,
  setProviderAreas,
  getProviderAreas,
  setAvailability,
  setOnlineStatus,
  getEarnings,
  getProviderReviews,
  createReview,
  getPublicProvider,
  listPublicProviders
};
