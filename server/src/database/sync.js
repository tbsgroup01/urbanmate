'use strict';

require('dotenv').config();
const { sequelize, Role, ServiceCategory, Service, SystemSetting } = require('../models');

async function syncDatabase() {
  const isForce = process.argv.includes('--force') || process.env.DB_SYNC_FORCE === 'true';

  console.log(`Connecting to database ${process.env.DB_NAME || 'urbanmate'} on ${process.env.DB_HOST || 'localhost'}...`);
  await sequelize.authenticate();
  console.log('Database connection verified.');

  if (isForce) {
    console.log('\x1b[33m%s\x1b[0m', 'WARNING: Running sync with { force: true } — all existing tables and data will be dropped and recreated.');
    await sequelize.sync({ force: true });
    console.log('\x1b[32m%s\x1b[0m', 'All database tables recreated successfully.');
  } else {
    console.log('Running sync with { alter: true } — safely creating/updating tables and columns without dropping data...');
    await sequelize.sync({ alter: true });
    console.log('\x1b[32m%s\x1b[0m', 'All database tables and columns synchronized successfully.');
  }

  // Ensure default roles exist
  console.log('Seeding default roles (customer, provider, admin)...');
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
  console.log('\x1b[32m%s\x1b[0m', 'Roles ready.');

  // Ensure base categories exist
  console.log('Checking default categories...');
  const baseCategories = [
    { id: '20000000-0000-4000-8000-000000000001', name: 'Cleaning', slug: 'cleaning', description: 'Home cleaning services', sortOrder: 1, isActive: true },
    { id: '20000000-0000-4000-8000-000000000002', name: 'Plumbing', slug: 'plumbing', description: 'Plumbing repairs and installations', sortOrder: 2, isActive: true },
    { id: '20000000-0000-4000-8000-000000000003', name: 'Electrical', slug: 'electrical', description: 'Electrical repairs and installations', sortOrder: 3, isActive: true }
  ];

  for (const cat of baseCategories) {
    await ServiceCategory.findOrCreate({
      where: { slug: cat.slug },
      defaults: cat
    });
  }
  console.log('\x1b[32m%s\x1b[0m', 'Base categories ready.');

  console.log('\x1b[32m%s\x1b[0m', '\n========================================');
  console.log('\x1b[32m%s\x1b[0m', 'Database setup completed successfully!');
  console.log('\x1b[32m%s\x1b[0m', '========================================\n');
  process.exit(0);
}

syncDatabase().catch((error) => {
  console.error('\x1b[31m%s\x1b[0m', 'Database sync failed:', error);
  process.exit(1);
});

