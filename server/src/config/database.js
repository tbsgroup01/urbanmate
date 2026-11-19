const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: env.DB_POOL_MAX,
    min: env.DB_POOL_MIN,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true
  },
  timezone: '+00:00'
});

module.exports = sequelize;
