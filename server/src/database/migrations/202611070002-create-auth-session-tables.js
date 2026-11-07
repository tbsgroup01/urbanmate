'use strict';

const { DataTypes } = require('sequelize');

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
};

const userReference = () => ({
  type: DataTypes.UUID,
  allowNull: false,
  references: { model: 'users', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
});

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('users', 'auth_version', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.createTable('refresh_tokens', {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      user_id: userReference(),
      token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: DataTypes.DATE,
      replaced_by_token_id: {
        type: DataTypes.UUID,
        references: { model: 'refresh_tokens', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_by_ip: DataTypes.STRING(45),
      user_agent: DataTypes.STRING(512),
      ...timestamps
    });
    await queryInterface.addIndex('refresh_tokens', ['user_id', 'revoked_at']);
    await queryInterface.addIndex('refresh_tokens', ['expires_at']);

    await queryInterface.createTable('password_reset_tokens', {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      user_id: userReference(),
      token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: DataTypes.DATE,
      created_by_ip: DataTypes.STRING(45),
      ...timestamps
    });
    await queryInterface.addIndex('password_reset_tokens', ['user_id', 'used_at']);
    await queryInterface.addIndex('password_reset_tokens', ['expires_at']);

    await queryInterface.createTable('otp_verifications', {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      user_id: userReference(),
      purpose: { type: DataTypes.STRING(40), allowNull: false },
      target: { type: DataTypes.STRING(254), allowNull: false },
      code_hash: { type: DataTypes.STRING(64), allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      verified_at: DataTypes.DATE,
      attempts: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      ...timestamps
    });
    await queryInterface.addIndex('otp_verifications', ['user_id', 'purpose', 'verified_at']);
    await queryInterface.addIndex('otp_verifications', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('otp_verifications');
    await queryInterface.dropTable('password_reset_tokens');
    await queryInterface.dropTable('refresh_tokens');
    await queryInterface.removeColumn('users', 'auth_version');
  }
};
