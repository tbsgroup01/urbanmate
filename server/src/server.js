const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { sequelize } = require('./models');

async function start() {
  await sequelize.authenticate();
  logger.info('Database connection established');

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'API server listening');
  });

  const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down API server');
    server.close(async (serverError) => {
      if (serverError) {
        logger.error({ err: serverError }, 'HTTP server shutdown failed');
        process.exitCode = 1;
      }
      try {
        await sequelize.close();
      } catch (databaseError) {
        logger.error({ err: databaseError }, 'Database connection shutdown failed');
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  logger.fatal({ err: error }, 'API startup failed');
  process.exitCode = 1;
});
