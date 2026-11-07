'use strict';

const { DataTypes } = require('sequelize');

const uuid = { type: DataTypes.UUID, allowNull: false, primaryKey: true };
const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};
const reference = (table, allowNull = false, onDelete = 'RESTRICT') => ({
  type: DataTypes.UUID,
  allowNull,
  references: { model: table, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete
});

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('service_categories', 'parent_id', reference('service_categories', true, 'SET NULL'));
    await queryInterface.addColumn('services', 'short_description', DataTypes.STRING(500));
    await queryInterface.addIndex('service_categories', ['parent_id', 'is_active']);
    await queryInterface.addIndex('services', ['is_active', 'name']);

    await queryInterface.createTable('cities', {
      id: uuid,
      name: { type: DataTypes.STRING(100), allowNull: false },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      country_code: { type: DataTypes.STRING(2), allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps
    });
    await queryInterface.addIndex('cities', ['country_code', 'is_active']);

    await queryInterface.createTable('areas', {
      id: uuid,
      city_id: reference('cities'),
      name: { type: DataTypes.STRING(100), allowNull: false },
      slug: { type: DataTypes.STRING(120), allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps
    });
    await queryInterface.addConstraint('areas', {
      fields: ['city_id', 'slug'],
      type: 'unique',
      name: 'areas_city_slug_unique'
    });
    await queryInterface.addIndex('areas', ['city_id', 'is_active']);

    await queryInterface.createTable('service_images', {
      id: uuid,
      service_id: reference('services', false, 'CASCADE'),
      image_url: { type: DataTypes.STRING(2048), allowNull: false },
      alt_text: DataTypes.STRING(255),
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });
    await queryInterface.addIndex('service_images', ['service_id', 'sort_order']);

    await queryInterface.createTable('service_packages', {
      id: uuid,
      service_id: reference('services', false, 'CASCADE'),
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: DataTypes.TEXT,
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
      features: { type: DataTypes.JSON, allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });
    await queryInterface.addIndex('service_packages', ['service_id', 'is_active', 'sort_order']);

    await queryInterface.createTable('service_addons', {
      id: uuid,
      service_id: reference('services', false, 'CASCADE'),
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: DataTypes.TEXT,
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      duration_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ...timestamps
    });
    await queryInterface.addIndex('service_addons', ['service_id', 'is_active', 'sort_order']);

    await queryInterface.createTable('service_pricing_rules', {
      id: uuid,
      service_id: reference('services', false, 'CASCADE'),
      city_id: reference('cities', true, 'CASCADE'),
      area_id: reference('areas', true, 'CASCADE'),
      adjustment_type: {
        type: DataTypes.ENUM('fixed', 'percentage', 'multiplier'),
        allowNull: false
      },
      adjustment_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      starts_at: DataTypes.DATE,
      ends_at: DataTypes.DATE,
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps
    });
    await queryInterface.addIndex('service_pricing_rules', ['service_id', 'is_active', 'priority']);
    await queryInterface.addIndex('service_pricing_rules', ['city_id', 'area_id', 'is_active']);
    await queryInterface.addIndex('service_pricing_rules', ['starts_at', 'ends_at']);

    await queryInterface.createTable('service_areas', {
      service_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      area_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'areas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      ...timestamps
    });
    await queryInterface.addIndex('service_areas', ['area_id', 'is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_areas');
    await queryInterface.dropTable('service_pricing_rules');
    await queryInterface.dropTable('service_addons');
    await queryInterface.dropTable('service_packages');
    await queryInterface.dropTable('service_images');
    await queryInterface.dropTable('areas');
    await queryInterface.dropTable('cities');
    await queryInterface.removeColumn('services', 'short_description');
    await queryInterface.removeColumn('service_categories', 'parent_id');
  }
};
