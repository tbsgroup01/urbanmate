'use strict';

const { DataTypes } = require('sequelize');

const reference = (table, allowNull, onDelete = 'CASCADE') => ({
  type: DataTypes.UUID,
  allowNull,
  references: { model: table, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete
});
const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.changeColumn('bookings', 'status', {
      type: DataTypes.ENUM(
        'pending', 'assigned', 'confirmed', 'in_progress',
        'provider_completed', 'completed', 'cancelled', 'rejected'
      ),
      allowNull: false,
      defaultValue: 'pending'
    });

    await queryInterface.createTable('booking_status_history', {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      booking_id: reference('bookings', false),
      actor_user_id: reference('users', true, 'SET NULL'),
      from_status: DataTypes.STRING(32),
      to_status: { type: DataTypes.STRING(32), allowNull: false },
      reason: DataTypes.STRING(500),
      metadata: DataTypes.JSON,
      ...timestamps
    });
    await queryInterface.addIndex('booking_status_history', ['booking_id', 'created_at']);

    await queryInterface.createTable('notifications', {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      user_id: reference('users', false),
      booking_id: reference('bookings', true, 'SET NULL'),
      type: { type: DataTypes.STRING(60), allowNull: false },
      message: { type: DataTypes.STRING(500), allowNull: false },
      read_at: DataTypes.DATE,
      ...timestamps
    });
    await queryInterface.addIndex('notifications', ['user_id', 'created_at']);
    await queryInterface.addIndex('notifications', ['booking_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('booking_status_history');
    await queryInterface.bulkUpdate('bookings', { status: 'pending' }, { status: 'assigned' });
    await queryInterface.bulkUpdate('bookings', { status: 'in_progress' }, { status: 'provider_completed' });
    await queryInterface.bulkUpdate('bookings', { status: 'cancelled' }, { status: 'rejected' });
    await queryInterface.changeColumn('bookings', 'status', {
      type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    });
  }
};
