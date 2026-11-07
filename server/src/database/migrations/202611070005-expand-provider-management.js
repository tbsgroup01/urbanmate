'use strict';

const { DataTypes } = require('sequelize');

const userReference = {
  type: DataTypes.UUID,
  allowNull: true,
  references: { model: 'users', key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: 'SET NULL'
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn('providers', 'legal_name', DataTypes.STRING(160));
    await queryInterface.addColumn('providers', 'date_of_birth', DataTypes.DATEONLY);
    await queryInterface.addColumn('providers', 'professional_title', DataTypes.STRING(120));
    await queryInterface.addColumn('providers', 'business_type', DataTypes.STRING(80));
    await queryInterface.addColumn('providers', 'approval_reviewed_by', userReference);
    await queryInterface.addColumn('providers', 'approval_reviewed_at', DataTypes.DATE);
    await queryInterface.addColumn('providers', 'rejection_reason', DataTypes.STRING(500));
    await queryInterface.addColumn('providers', 'identity_verified', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('providers', 'is_online', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addIndex('providers', ['approval_status', 'identity_verified', 'is_online']);
    await queryInterface.addIndex('providers', ['approval_reviewed_by']);

    await queryInterface.addColumn('provider_documents', 'content_type', {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'application/octet-stream'
    });
    await queryInterface.addColumn('provider_documents', 'file_size_bytes', DataTypes.INTEGER.UNSIGNED);
    await queryInterface.addColumn('provider_documents', 'uploaded_at', DataTypes.DATE);
    await queryInterface.addIndex('provider_documents', ['document_type', 'status']);

    await queryInterface.createTable('provider_areas', {
      provider_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'providers', key: 'id' },
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
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('provider_areas', ['area_id', 'is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provider_areas');
    await queryInterface.removeColumn('provider_documents', 'uploaded_at');
    await queryInterface.removeColumn('provider_documents', 'file_size_bytes');
    await queryInterface.removeColumn('provider_documents', 'content_type');
    await queryInterface.removeColumn('providers', 'is_online');
    await queryInterface.removeColumn('providers', 'identity_verified');
    await queryInterface.removeColumn('providers', 'rejection_reason');
    await queryInterface.removeColumn('providers', 'approval_reviewed_at');
    await queryInterface.removeColumn('providers', 'approval_reviewed_by');
    await queryInterface.removeColumn('providers', 'business_type');
    await queryInterface.removeColumn('providers', 'professional_title');
    await queryInterface.removeColumn('providers', 'date_of_birth');
    await queryInterface.removeColumn('providers', 'legal_name');
  }
};
