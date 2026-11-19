const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  await sequelize.authenticate();
  console.log('Database connected');

  const server = app.listen(env.PORT, () => {
    console.log(`Server started on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`Shutting down server (${signal})`);
    server.close(async (serverError) => {
      if (serverError) {
        console.error('HTTP server shutdown failed:', serverError);
        process.exitCode = 1;
      }
      try {
        await sequelize.close();
      } catch (databaseError) {
        console.error('Database connection shutdown failed:', databaseError);
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('Server startup failed:', error);
  process.exitCode = 1;
});
