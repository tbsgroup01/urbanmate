const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('providers');
    if (!table.avatar_url) {
      await queryInterface.addColumn('providers', 'avatar_url', {
        type: DataTypes.STRING(2048),
        allowNull: true
      });
    }
  },
  async down(queryInterface) {
    const table = await queryInterface.describeTable('providers');
    if (table.avatar_url) {
      await queryInterface.removeColumn('providers', 'avatar_url');
    }
  }
};

