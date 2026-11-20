const app = require('./app');
const env = require('./config/env');
const { sequelize, Role } = require('./models');

async function bootstrapDefaultRoles() {
  try {
    const now = new Date();
    await Role.findOrCreate({
      where: { name: 'customer' },
      defaults: { id: '10000000-0000-4000-8000-000000000001', description: 'Customer account', createdAt: now, updatedAt: now }
    });
    await Role.findOrCreate({
      where: { name: 'provider' },
      defaults: { id: '10000000-0000-4000-8000-000000000002', description: 'Service provider account', createdAt: now, updatedAt: now }
    });
    await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: { id: '10000000-0000-4000-8000-000000000003', description: 'Platform administrator', createdAt: now, updatedAt: now }
    });
  } catch (err) {
    console.warn('Role bootstrap notice:', err.message);
  }
}

async function start() {
  await sequelize.authenticate();
  console.log('Database connected');

  if (process.env.DB_SYNC_FORCE === 'true') {
    console.log('WARNING: Running sequelize.sync({ force: true }) on startup...');
    await sequelize.sync({ force: true });
    await bootstrapDefaultRoles();
    console.log('Database tables recreated with force: true and roles seeded');
  } else if (process.env.DB_AUTO_SYNC === 'true' || process.env.DB_SYNC_ALTER === 'true') {
    console.log('Running auto sequelize.sync({ alter: true }) on startup...');
    await sequelize.sync({ alter: true });
    await bootstrapDefaultRoles();
    console.log('Database tables & columns auto-synchronized');
  }

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
