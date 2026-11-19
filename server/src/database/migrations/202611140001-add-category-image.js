const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('service_categories');
    if (!table.image_url) {
      await queryInterface.addColumn('service_categories', 'image_url', {
        type: DataTypes.STRING(2048),
        allowNull: true
      });
    }
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('service_categories');
    if (table.image_url) {
      await queryInterface.removeColumn('service_categories', 'image_url');
    }
  }
};

