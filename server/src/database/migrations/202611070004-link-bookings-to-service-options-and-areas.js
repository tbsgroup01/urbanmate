'use strict';

const { DataTypes } = require('sequelize');

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('addresses', 'city_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'cities', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('addresses', 'area_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'areas', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex('addresses', ['city_id', 'area_id']);

    await queryInterface.createTable('booking_service_items', {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      booking_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      item_type: { type: DataTypes.ENUM('package', 'addon'), allowNull: false },
      service_package_id: {
        type: DataTypes.UUID,
        references: { model: 'service_packages', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      service_addon_id: {
        type: DataTypes.UUID,
        references: { model: 'service_addons', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name_snapshot: { type: DataTypes.STRING(120), allowNull: false },
      unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
      ...timestamps
    });
    await queryInterface.addIndex('booking_service_items', ['booking_id']);
    await queryInterface.addIndex('booking_service_items', ['service_package_id']);
    await queryInterface.addIndex('booking_service_items', ['service_addon_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('booking_service_items');
    await queryInterface.removeColumn('addresses', 'area_id');
    await queryInterface.removeColumn('addresses', 'city_id');
  }
};
