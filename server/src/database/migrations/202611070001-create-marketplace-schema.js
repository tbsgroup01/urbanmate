'use strict';

const { DataTypes } = require('sequelize');

const uuid = { type: DataTypes.UUID, allowNull: false, primaryKey: true };
const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};
const reference = (table, onDelete = 'RESTRICT') => ({
  type: DataTypes.UUID,
  allowNull: false,
  references: { model: table, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete
});

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('users', {
      id: uuid,
      full_name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
      phone: { type: DataTypes.STRING(30), unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.ENUM('active', 'pending', 'suspended', 'deleted'), allowNull: false, defaultValue: 'active' },
      email_verified_at: DataTypes.DATE,
      last_login_at: DataTypes.DATE,
      ...timestamps
    });
    await queryInterface.addIndex('users', ['status']);

    await queryInterface.createTable('roles', {
      id: uuid,
      name: { type: DataTypes.STRING(40), allowNull: false, unique: true },
      description: DataTypes.STRING(255),
      ...timestamps
    });
    await queryInterface.createTable('user_roles', {
      user_id: {
        type: DataTypes.UUID, allowNull: false, primaryKey: true,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      role_id: {
        type: DataTypes.UUID, allowNull: false, primaryKey: true,
        references: { model: 'roles', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      ...timestamps
    });
    await queryInterface.addIndex('user_roles', ['role_id']);

    await queryInterface.createTable('addresses', {
      id: uuid,
      user_id: reference('users', 'CASCADE'),
      label: { type: DataTypes.STRING(60), allowNull: false },
      line1: { type: DataTypes.STRING(255), allowNull: false },
      line2: DataTypes.STRING(255),
      city: { type: DataTypes.STRING(100), allowNull: false },
      region: DataTypes.STRING(100),
      postal_code: { type: DataTypes.STRING(20), allowNull: false },
      country_code: { type: DataTypes.STRING(2), allowNull: false },
      latitude: DataTypes.DECIMAL(10, 7),
      longitude: DataTypes.DECIMAL(10, 7),
      is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      ...timestamps
    });
    await queryInterface.addIndex('addresses', ['user_id']);

    await queryInterface.createTable('service_categories', {
      id: uuid,
      name: { type: DataTypes.STRING(100), allowNull: false },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      description: DataTypes.TEXT,
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });
    await queryInterface.addIndex('service_categories', ['is_active', 'sort_order']);

    await queryInterface.createTable('services', {
      id: uuid,
      category_id: reference('service_categories'),
      name: { type: DataTypes.STRING(140), allowNull: false },
      slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      description: DataTypes.TEXT,
      base_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps
    });
    await queryInterface.addIndex('services', ['category_id', 'is_active']);

    await queryInterface.createTable('providers', {
      id: uuid,
      user_id: { ...reference('users', 'CASCADE'), unique: true },
      display_name: { type: DataTypes.STRING(120), allowNull: false },
      business_name: DataTypes.STRING(160),
      bio: DataTypes.TEXT,
      approval_status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'), allowNull: false, defaultValue: 'pending' },
      experience_years: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      average_rating: { type: DataTypes.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      review_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });
    await queryInterface.addIndex('providers', ['approval_status']);

    await queryInterface.createTable('provider_documents', {
      id: uuid,
      provider_id: reference('providers', 'CASCADE'),
      document_type: { type: DataTypes.STRING(60), allowNull: false },
      storage_key: { type: DataTypes.STRING(512), allowNull: false },
      status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'), allowNull: false, defaultValue: 'pending' },
      expires_at: DataTypes.DATEONLY,
      reviewed_by: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      reviewed_at: DataTypes.DATE,
      rejection_reason: DataTypes.STRING(500),
      ...timestamps
    });
    await queryInterface.addIndex('provider_documents', ['provider_id', 'status']);
    await queryInterface.addIndex('provider_documents', ['reviewed_by']);

    await queryInterface.createTable('provider_availabilities', {
      id: uuid,
      provider_id: reference('providers', 'CASCADE'),
      weekday: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
      is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      effective_from: DataTypes.DATEONLY,
      effective_until: DataTypes.DATEONLY,
      timezone: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UTC' },
      ...timestamps
    });
    await queryInterface.addIndex('provider_availabilities', ['provider_id', 'weekday', 'is_available']);

    await queryInterface.createTable('provider_services', {
      provider_id: {
        type: DataTypes.UUID, allowNull: false, primaryKey: true,
        references: { model: 'providers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      service_id: {
        type: DataTypes.UUID, allowNull: false, primaryKey: true,
        references: { model: 'services', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      custom_price: DataTypes.DECIMAL(10, 2),
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps
    });
    await queryInterface.addIndex('provider_services', ['service_id']);

    await queryInterface.createTable('bookings', {
      id: uuid,
      booking_number: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      customer_id: reference('users'),
      provider_id: {
        type: DataTypes.UUID, allowNull: true,
        references: { model: 'providers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      service_id: reference('services'),
      address_id: reference('addresses'),
      service_name_snapshot: { type: DataTypes.STRING(140), allowNull: false },
      scheduled_start: { type: DataTypes.DATE, allowNull: false },
      scheduled_end: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      platform_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      tax: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      customer_notes: DataTypes.TEXT,
      cancellation_reason: DataTypes.STRING(500),
      completed_at: DataTypes.DATE,
      ...timestamps
    });
    await queryInterface.addIndex('bookings', ['customer_id', 'created_at']);
    await queryInterface.addIndex('bookings', ['provider_id', 'scheduled_start', 'status']);
    await queryInterface.addIndex('bookings', ['status', 'scheduled_start']);
    await queryInterface.addIndex('bookings', ['service_id']);
    await queryInterface.addIndex('bookings', ['address_id']);

    await queryInterface.createTable('payments', {
      id: uuid,
      booking_id: reference('bookings'),
      provider_name: { type: DataTypes.STRING(60), allowNull: false },
      provider_transaction_id: { type: DataTypes.STRING(160), unique: true },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      status: { type: DataTypes.ENUM('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'), allowNull: false, defaultValue: 'pending' },
      method: DataTypes.STRING(40),
      paid_at: DataTypes.DATE,
      metadata: DataTypes.JSON,
      ...timestamps
    });
    await queryInterface.addIndex('payments', ['booking_id', 'status']);

    await queryInterface.createTable('commissions', {
      id: uuid,
      booking_id: { ...reference('bookings'), unique: true },
      provider_id: reference('providers'),
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      rate_percent: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      status: { type: DataTypes.ENUM('pending', 'payable', 'paid', 'reversed'), allowNull: false, defaultValue: 'pending' },
      currency: { type: DataTypes.STRING(3), allowNull: false },
      ...timestamps
    });
    await queryInterface.addIndex('commissions', ['provider_id', 'status']);

    await queryInterface.createTable('reviews', {
      id: uuid,
      booking_id: { ...reference('bookings'), unique: true },
      customer_id: reference('users'),
      provider_id: reference('providers'),
      rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
      comment: DataTypes.TEXT,
      status: { type: DataTypes.ENUM('published', 'hidden', 'flagged'), allowNull: false, defaultValue: 'published' },
      ...timestamps
    });
    await queryInterface.addIndex('reviews', ['provider_id', 'status']);
    await queryInterface.addIndex('reviews', ['customer_id']);
  },

  async down(queryInterface) {
    const tables = [
      'reviews',
      'commissions',
      'payments',
      'bookings',
      'provider_services',
      'provider_availabilities',
      'provider_documents',
      'providers',
      'services',
      'service_categories',
      'addresses',
      'user_roles',
      'roles',
      'users'
    ];
    for (const table of tables) await queryInterface.dropTable(table);
  }
};
