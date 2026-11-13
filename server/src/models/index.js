const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const common = { underscored: true, timestamps: true, freezeTableName: true };
const uuid = { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 };
const statusEnum = (values) => ({ type: DataTypes.ENUM(...values), allowNull: false });

const User = sequelize.define('User', {
  id: uuid,
  fullName: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(30), unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  status: statusEnum(['active', 'pending', 'suspended', 'deleted']),
  emailVerifiedAt: DataTypes.DATE,
  lastLoginAt: DataTypes.DATE,
  authVersion: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }
}, { ...common, tableName: 'users', indexes: [{ fields: ['status'] }] });

const Role = sequelize.define('Role', {
  id: uuid,
  name: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  description: DataTypes.STRING(255)
}, { ...common, tableName: 'roles' });

const UserRole = sequelize.define('UserRole', {
  userId: { type: DataTypes.UUID, primaryKey: true, references: { model: 'users', key: 'id' } },
  roleId: { type: DataTypes.UUID, primaryKey: true, references: { model: 'roles', key: 'id' } }
}, { ...common, tableName: 'user_roles', timestamps: true });

const Address = sequelize.define('Address', {
  id: uuid,
  userId: { type: DataTypes.UUID, allowNull: false },
  label: { type: DataTypes.STRING(60), allowNull: false },
  line1: { type: DataTypes.STRING(255), allowNull: false },
  line2: DataTypes.STRING(255),
  city: { type: DataTypes.STRING(100), allowNull: false },
  region: DataTypes.STRING(100),
  cityId: DataTypes.UUID,
  areaId: DataTypes.UUID,
  postalCode: { type: DataTypes.STRING(20), allowNull: false },
  countryCode: { type: DataTypes.STRING(2), allowNull: false },
  latitude: DataTypes.DECIMAL(10, 7),
  longitude: DataTypes.DECIMAL(10, 7),
  isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, { ...common, tableName: 'addresses', indexes: [{ fields: ['user_id'] }, { fields: ['city_id', 'area_id'] }] });

const ServiceCategory = sequelize.define('ServiceCategory', {
  id: uuid,
  parentId: DataTypes.UUID,
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: DataTypes.TEXT,
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  ...common,
  tableName: 'service_categories',
  indexes: [{ fields: ['is_active', 'sort_order'] }, { fields: ['parent_id', 'is_active'] }]
});

const Service = sequelize.define('Service', {
  id: uuid,
  categoryId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(140), allowNull: false },
  slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  shortDescription: DataTypes.STRING(500),
  description: DataTypes.TEXT,
  basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  ...common,
  tableName: 'services',
  indexes: [{ fields: ['category_id', 'is_active'] }, { fields: ['is_active', 'name'] }]
});

const City = sequelize.define('City', {
  id: uuid,
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  countryCode: { type: DataTypes.STRING(2), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { ...common, tableName: 'cities', indexes: [{ fields: ['country_code', 'is_active'] }] });

const Area = sequelize.define('Area', {
  id: uuid,
  cityId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  ...common,
  tableName: 'areas',
  indexes: [{ unique: true, fields: ['city_id', 'slug'] }, { fields: ['city_id', 'is_active'] }]
});

const ServiceImage = sequelize.define('ServiceImage', {
  id: uuid,
  serviceId: { type: DataTypes.UUID, allowNull: false },
  imageUrl: { type: DataTypes.STRING(2048), allowNull: false },
  altText: DataTypes.STRING(255),
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { ...common, tableName: 'service_images', indexes: [{ fields: ['service_id', 'sort_order'] }] });

const ServicePackage = sequelize.define('ServicePackage', {
  id: uuid,
  serviceId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: DataTypes.TEXT,
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false },
  features: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { ...common, tableName: 'service_packages', indexes: [{ fields: ['service_id', 'is_active', 'sort_order'] }] });

const ServiceAddon = sequelize.define('ServiceAddon', {
  id: uuid,
  serviceId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: DataTypes.TEXT,
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { ...common, tableName: 'service_addons', indexes: [{ fields: ['service_id', 'is_active', 'sort_order'] }] });

const ServicePricingRule = sequelize.define('ServicePricingRule', {
  id: uuid,
  serviceId: { type: DataTypes.UUID, allowNull: false },
  cityId: DataTypes.UUID,
  areaId: DataTypes.UUID,
  adjustmentType: statusEnum(['fixed', 'percentage', 'multiplier']),
  adjustmentValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  startsAt: DataTypes.DATE,
  endsAt: DataTypes.DATE,
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  ...common,
  tableName: 'service_pricing_rules',
  indexes: [
    { fields: ['service_id', 'is_active', 'priority'] },
    { fields: ['city_id', 'area_id', 'is_active'] },
    { fields: ['starts_at', 'ends_at'] }
  ],
  validate: {
    locationScopeIsValid() {
      if (this.areaId && !this.cityId) throw new Error('A pricing rule area requires a city');
      if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
        throw new Error('endsAt must be after startsAt');
      }
      if (this.adjustmentType === 'multiplier' && Number(this.adjustmentValue) <= 0) {
        throw new Error('A multiplier must be greater than zero');
      }
    }
  }
});

const ServiceArea = sequelize.define('ServiceArea', {
  serviceId: { type: DataTypes.UUID, primaryKey: true },
  areaId: { type: DataTypes.UUID, primaryKey: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { ...common, tableName: 'service_areas' });

const BookingServiceItem = sequelize.define('BookingServiceItem', {
  id: uuid,
  bookingId: { type: DataTypes.UUID, allowNull: false },
  itemType: statusEnum(['package', 'addon']),
  servicePackageId: DataTypes.UUID,
  serviceAddonId: DataTypes.UUID,
  nameSnapshot: { type: DataTypes.STRING(120), allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false }
}, { ...common, tableName: 'booking_service_items' });

const Provider = sequelize.define('Provider', {
  id: uuid,
  userId: { type: DataTypes.UUID, allowNull: false, unique: true },
  displayName: { type: DataTypes.STRING(120), allowNull: false },
  businessName: DataTypes.STRING(160),
  bio: DataTypes.TEXT,
  legalName: DataTypes.STRING(160),
  dateOfBirth: DataTypes.DATEONLY,
  professionalTitle: DataTypes.STRING(120),
  businessType: DataTypes.STRING(80),
  approvalStatus: statusEnum(['pending', 'approved', 'rejected', 'suspended']),
  approvalReviewedBy: DataTypes.UUID,
  approvalReviewedAt: DataTypes.DATE,
  rejectionReason: DataTypes.STRING(500),
  identityVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isOnline: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  experienceYears: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  averageRating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
  reviewCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
  ...common,
  tableName: 'providers',
  indexes: [
    { fields: ['approval_status', 'identity_verified', 'is_online'] },
    { fields: ['approval_reviewed_by'] }
  ]
});

const ProviderDocument = sequelize.define('ProviderDocument', {
  id: uuid,
  providerId: { type: DataTypes.UUID, allowNull: false },
  documentType: { type: DataTypes.STRING(60), allowNull: false },
  storageKey: { type: DataTypes.STRING(512), allowNull: false },
  status: statusEnum(['pending', 'approved', 'rejected', 'expired']),
  expiresAt: DataTypes.DATEONLY,
  reviewedBy: DataTypes.UUID,
  reviewedAt: DataTypes.DATE,
  rejectionReason: DataTypes.STRING(500),
  contentType: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'application/octet-stream' },
  fileSizeBytes: DataTypes.INTEGER.UNSIGNED,
  uploadedAt: DataTypes.DATE
}, {
  ...common,
  tableName: 'provider_documents',
  indexes: [{ fields: ['provider_id', 'status'] }, { fields: ['document_type', 'status'] }]
});

const ProviderAvailability = sequelize.define('ProviderAvailability', {
  id: uuid,
  providerId: { type: DataTypes.UUID, allowNull: false },
  weekday: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 0, max: 6 } },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  effectiveFrom: DataTypes.DATEONLY,
  effectiveUntil: DataTypes.DATEONLY,
  timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UTC' }
}, { ...common, tableName: 'provider_availabilities', indexes: [{ fields: ['provider_id', 'weekday', 'is_available'] }] });

const ProviderService = sequelize.define('ProviderService', {
  providerId: { type: DataTypes.UUID, primaryKey: true },
  serviceId: { type: DataTypes.UUID, primaryKey: true },
  customPrice: DataTypes.DECIMAL(10, 2),
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { ...common, tableName: 'provider_services' });

const ProviderArea = sequelize.define('ProviderArea', {
  providerId: { type: DataTypes.UUID, primaryKey: true },
  areaId: { type: DataTypes.UUID, primaryKey: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { ...common, tableName: 'provider_areas', indexes: [{ fields: ['area_id', 'is_active'] }] });

const Booking = sequelize.define('Booking', {
  id: uuid,
  bookingNumber: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  customerId: { type: DataTypes.UUID, allowNull: false },
  providerId: DataTypes.UUID,
  serviceId: { type: DataTypes.UUID, allowNull: false },
  addressId: { type: DataTypes.UUID, allowNull: false },
  serviceNameSnapshot: { type: DataTypes.STRING(140), allowNull: false },
  scheduledStart: { type: DataTypes.DATE, allowNull: false },
  scheduledEnd: { type: DataTypes.DATE, allowNull: false },
  status: statusEnum(['pending', 'assigned', 'confirmed', 'in_progress', 'provider_completed', 'completed', 'cancelled', 'rejected']),
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  platformFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  tax: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(3), allowNull: false },
  customerNotes: DataTypes.TEXT,
  cancellationReason: DataTypes.STRING(500),
  completedAt: DataTypes.DATE
}, {
  ...common,
  tableName: 'bookings',
  indexes: [
    { fields: ['customer_id', 'created_at'] },
    { fields: ['provider_id', 'scheduled_start', 'status'] },
    { fields: ['status', 'scheduled_start'] }
  ],
  validate: {
    scheduledRangeIsValid() {
      if (this.scheduledStart && this.scheduledEnd && this.scheduledEnd <= this.scheduledStart) {
        throw new Error('scheduledEnd must be after scheduledStart');
      }
    }
  }
});

const Payment = sequelize.define('Payment', {
  id: uuid,
  bookingId: { type: DataTypes.UUID, allowNull: false },
  providerName: { type: DataTypes.STRING(60), allowNull: false },
  providerTransactionId: { type: DataTypes.STRING(160), unique: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING(3), allowNull: false },
  status: statusEnum(['pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded']),
  method: DataTypes.STRING(40),
  paidAt: DataTypes.DATE,
  metadata: DataTypes.JSON
}, { ...common, tableName: 'payments', indexes: [{ fields: ['booking_id', 'status'] }] });

const Commission = sequelize.define('Commission', {
  id: uuid,
  bookingId: { type: DataTypes.UUID, allowNull: false, unique: true },
  providerId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  ratePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  status: statusEnum(['pending', 'payable', 'paid', 'reversed']),
  currency: { type: DataTypes.STRING(3), allowNull: false }
}, { ...common, tableName: 'commissions', indexes: [{ fields: ['provider_id', 'status'] }] });

const Review = sequelize.define('Review', {
  id: uuid,
  bookingId: { type: DataTypes.UUID, allowNull: false, unique: true },
  customerId: { type: DataTypes.UUID, allowNull: false },
  providerId: { type: DataTypes.UUID, allowNull: false },
  rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 5 } },
  comment: DataTypes.TEXT,
  status: statusEnum(['published', 'hidden', 'flagged'])
}, { ...common, tableName: 'reviews', indexes: [{ fields: ['provider_id', 'status'] }] });

const BookingStatusHistory = sequelize.define('BookingStatusHistory', {
  id: uuid,
  bookingId: { type: DataTypes.UUID, allowNull: false },
  actorUserId: DataTypes.UUID,
  fromStatus: DataTypes.STRING(32),
  toStatus: { type: DataTypes.STRING(32), allowNull: false },
  reason: DataTypes.STRING(500),
  metadata: DataTypes.JSON
}, {
  ...common,
  tableName: 'booking_status_history',
  indexes: [{ fields: ['booking_id', 'created_at'] }]
});

const Notification = sequelize.define('Notification', {
  id: uuid,
  userId: { type: DataTypes.UUID, allowNull: false },
  bookingId: DataTypes.UUID,
  type: { type: DataTypes.STRING(60), allowNull: false },
  message: { type: DataTypes.STRING(500), allowNull: false },
  readAt: DataTypes.DATE
}, {
  ...common,
  tableName: 'notifications',
  indexes: [{ fields: ['user_id', 'created_at'] }, { fields: ['booking_id'] }]
});

const RefreshToken = sequelize.define('RefreshToken', {
  id: uuid,
  userId: { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  revokedAt: DataTypes.DATE,
  replacedByTokenId: DataTypes.UUID,
  createdByIp: DataTypes.STRING(45),
  userAgent: DataTypes.STRING(512)
}, {
  ...common,
  tableName: 'refresh_tokens',
  indexes: [{ fields: ['user_id', 'revoked_at'] }, { fields: ['expires_at'] }]
});

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: uuid,
  userId: { type: DataTypes.UUID, allowNull: false },
  tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: DataTypes.DATE,
  createdByIp: DataTypes.STRING(45)
}, {
  ...common,
  tableName: 'password_reset_tokens',
  indexes: [{ fields: ['user_id', 'used_at'] }, { fields: ['expires_at'] }]
});

const OtpVerification = sequelize.define('OtpVerification', {
  id: uuid,
  userId: { type: DataTypes.UUID, allowNull: false },
  purpose: { type: DataTypes.STRING(40), allowNull: false },
  target: { type: DataTypes.STRING(254), allowNull: false },
  codeHash: { type: DataTypes.STRING(64), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  verifiedAt: DataTypes.DATE,
  attempts: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 }
}, {
  ...common,
  tableName: 'otp_verifications',
  indexes: [{ fields: ['user_id', 'purpose', 'verified_at'] }, { fields: ['expires_at'] }]
});

User.belongsToMany(Role, { through: UserRole, as: 'roles', foreignKey: 'userId', otherKey: 'roleId' });
Role.belongsToMany(User, { through: UserRole, as: 'users', foreignKey: 'roleId', otherKey: 'userId' });
User.hasMany(Address, { as: 'addresses', foreignKey: 'userId' });
Address.belongsTo(User, { as: 'user', foreignKey: 'userId' });
City.hasMany(Address, { as: 'addresses', foreignKey: 'cityId' });
Address.belongsTo(City, { as: 'serviceCity', foreignKey: 'cityId' });
Area.hasMany(Address, { as: 'addresses', foreignKey: 'areaId' });
Address.belongsTo(Area, { as: 'serviceArea', foreignKey: 'areaId' });
ServiceCategory.hasMany(Service, { as: 'services', foreignKey: 'categoryId' });
Service.belongsTo(ServiceCategory, { as: 'category', foreignKey: 'categoryId' });
ServiceCategory.belongsTo(ServiceCategory, { as: 'parent', foreignKey: 'parentId' });
ServiceCategory.hasMany(ServiceCategory, { as: 'children', foreignKey: 'parentId' });
Service.hasMany(ServiceImage, { as: 'images', foreignKey: 'serviceId' });
ServiceImage.belongsTo(Service, { as: 'service', foreignKey: 'serviceId' });
Service.hasMany(ServicePackage, { as: 'packages', foreignKey: 'serviceId' });
ServicePackage.belongsTo(Service, { as: 'service', foreignKey: 'serviceId' });
Service.hasMany(ServiceAddon, { as: 'addons', foreignKey: 'serviceId' });
ServiceAddon.belongsTo(Service, { as: 'service', foreignKey: 'serviceId' });
Service.hasMany(ServicePricingRule, { as: 'pricingRules', foreignKey: 'serviceId' });
ServicePricingRule.belongsTo(Service, { as: 'service', foreignKey: 'serviceId' });
City.hasMany(Area, { as: 'areas', foreignKey: 'cityId' });
Area.belongsTo(City, { as: 'city', foreignKey: 'cityId' });
City.hasMany(ServicePricingRule, { as: 'pricingRules', foreignKey: 'cityId' });
ServicePricingRule.belongsTo(City, { as: 'city', foreignKey: 'cityId' });
Area.hasMany(ServicePricingRule, { as: 'pricingRules', foreignKey: 'areaId' });
ServicePricingRule.belongsTo(Area, { as: 'area', foreignKey: 'areaId' });
Service.belongsToMany(Area, { through: ServiceArea, as: 'availableAreas', foreignKey: 'serviceId', otherKey: 'areaId' });
Area.belongsToMany(Service, { through: ServiceArea, as: 'availableServices', foreignKey: 'areaId', otherKey: 'serviceId' });
User.hasOne(Provider, { as: 'providerProfile', foreignKey: 'userId' });
Provider.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Provider.hasMany(ProviderDocument, { as: 'documents', foreignKey: 'providerId' });
ProviderDocument.belongsTo(Provider, { as: 'provider', foreignKey: 'providerId' });
ProviderDocument.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });
Provider.belongsTo(User, { as: 'approvalReviewer', foreignKey: 'approvalReviewedBy' });
Provider.hasMany(ProviderAvailability, { as: 'availability', foreignKey: 'providerId' });
ProviderAvailability.belongsTo(Provider, { as: 'provider', foreignKey: 'providerId' });
Provider.hasMany(ProviderService, { as: 'providerServices', foreignKey: 'providerId' });
ProviderService.belongsTo(Provider, { as: 'provider', foreignKey: 'providerId' });
ProviderService.belongsTo(Service, { as: 'service', foreignKey: 'serviceId' });
Service.hasMany(ProviderService, { as: 'providerServices', foreignKey: 'serviceId' });
Provider.hasMany(ProviderArea, { as: 'providerAreas', foreignKey: 'providerId' });
ProviderArea.belongsTo(Provider, { as: 'provider', foreignKey: 'providerId' });
ProviderArea.belongsTo(Area, { as: 'area', foreignKey: 'areaId' });
Area.hasMany(ProviderArea, { as: 'providerAreas', foreignKey: 'areaId' });
Provider.belongsToMany(Service, { through: ProviderService, as: 'services', foreignKey: 'providerId', otherKey: 'serviceId' });
Service.belongsToMany(Provider, { through: ProviderService, as: 'providers', foreignKey: 'serviceId', otherKey: 'providerId' });
Provider.belongsToMany(Area, { through: ProviderArea, as: 'serviceAreas', foreignKey: 'providerId', otherKey: 'areaId' });
Area.belongsToMany(Provider, { through: ProviderArea, as: 'providers', foreignKey: 'areaId', otherKey: 'providerId' });
User.hasMany(Booking, { as: 'customerBookings', foreignKey: 'customerId' });
Booking.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
Provider.hasMany(Booking, { as: 'bookings', foreignKey: 'providerId' });
Booking.belongsTo(Provider, { as: 'provider', foreignKey: 'providerId' });
Service.hasMany(Booking, { as: 'bookings', foreignKey: 'serviceId' });
Booking.belongsTo(Service, { as: 'service', foreignKey: 'serviceId' });
Address.hasMany(Booking, { as: 'bookings', foreignKey: 'addressId' });
Booking.belongsTo(Address, { as: 'address', foreignKey: 'addressId' });
Booking.hasMany(BookingServiceItem, { as: 'serviceItems', foreignKey: 'bookingId' });
BookingServiceItem.belongsTo(Booking, { as: 'booking', foreignKey: 'bookingId' });
Booking.hasMany(BookingStatusHistory, { as: 'statusHistory', foreignKey: 'bookingId' });
BookingStatusHistory.belongsTo(Booking, { as: 'booking', foreignKey: 'bookingId' });
BookingStatusHistory.belongsTo(User, { as: 'actor', foreignKey: 'actorUserId' });
User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Booking.hasMany(Notification, { as: 'notifications', foreignKey: 'bookingId' });
Notification.belongsTo(Booking, { as: 'booking', foreignKey: 'bookingId' });
ServicePackage.hasMany(BookingServiceItem, { as: 'bookingItems', foreignKey: 'servicePackageId' });
BookingServiceItem.belongsTo(ServicePackage, { as: 'servicePackage', foreignKey: 'servicePackageId' });
ServiceAddon.hasMany(BookingServiceItem, { as: 'bookingItems', foreignKey: 'serviceAddonId' });
BookingServiceItem.belongsTo(ServiceAddon, { as: 'serviceAddon', foreignKey: 'serviceAddonId' });
Booking.hasMany(Payment, { as: 'payments', foreignKey: 'bookingId' });
Payment.belongsTo(Booking, { as: 'booking', foreignKey: 'bookingId' });
Booking.hasOne(Commission, { as: 'commission', foreignKey: 'bookingId' });
Commission.belongsTo(Booking, { as: 'booking', foreignKey: 'bookingId' });
Provider.hasMany(Commission, { as: 'commissions', foreignKey: 'providerId' });
Commission.belongsTo(Provider, { as: 'provider', foreignKey: 'providerId' });
Booking.hasOne(Review, { as: 'review', foreignKey: 'bookingId' });
Review.belongsTo(Booking, { as: 'booking', foreignKey: 'bookingId' });
User.hasMany(Review, { as: 'reviews', foreignKey: 'customerId' });
Review.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
Provider.hasMany(Review, { as: 'reviews', foreignKey: 'providerId' });
Review.belongsTo(Provider, { as: 'provider', foreignKey: 'providerId' });
User.hasMany(RefreshToken, { as: 'refreshTokens', foreignKey: 'userId' });
RefreshToken.belongsTo(User, { as: 'user', foreignKey: 'userId' });
RefreshToken.belongsTo(RefreshToken, { as: 'replacedBy', foreignKey: 'replacedByTokenId' });
User.hasMany(PasswordResetToken, { as: 'passwordResetTokens', foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(OtpVerification, { as: 'otpVerifications', foreignKey: 'userId' });
OtpVerification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Role,
  UserRole,
  Address,
  ServiceCategory,
  Service,
  City,
  Area,
  ServiceImage,
  ServicePackage,
  ServiceAddon,
  ServicePricingRule,
  ServiceArea,
  BookingServiceItem,
  Provider,
  ProviderDocument,
  ProviderAvailability,
  ProviderService,
  ProviderArea,
  Booking,
  BookingStatusHistory,
  Notification,
  Payment,
  Commission,
  Review,
  RefreshToken,
  PasswordResetToken,
  OtpVerification
};
