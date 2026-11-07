'use strict';

const roles = [
  ['10000000-0000-4000-8000-000000000001', 'customer', 'Customer account'],
  ['10000000-0000-4000-8000-000000000002', 'provider', 'Service provider account'],
  ['10000000-0000-4000-8000-000000000003', 'admin', 'Platform administrator']
];

const categories = [
  ['20000000-0000-4000-8000-000000000001', 'Cleaning', 'cleaning', 'Home cleaning services', 1],
  ['20000000-0000-4000-8000-000000000002', 'Plumbing', 'plumbing', 'Plumbing repairs and installations', 2],
  ['20000000-0000-4000-8000-000000000003', 'Electrical', 'electrical', 'Electrical repairs and installations', 3]
];

const services = [
  ['30000000-0000-4000-8000-000000000001', categories[0][0], 'Standard home cleaning', 'standard-home-cleaning', 'Routine cleaning for homes', 49.00, 120],
  ['30000000-0000-4000-8000-000000000002', categories[1][0], 'Plumbing repair', 'plumbing-repair', 'General household plumbing repair', 59.00, 90],
  ['30000000-0000-4000-8000-000000000003', categories[2][0], 'Electrical inspection', 'electrical-inspection', 'Basic household electrical inspection', 69.00, 60]
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', roles.map(([id, name, description]) => ({
      id, name, description, created_at: now, updated_at: now
    })), { updateOnDuplicate: ['name', 'description', 'updated_at'] });

    await queryInterface.bulkInsert('service_categories', categories.map(([id, name, slug, description, sort_order]) => ({
      id, name, slug, description, sort_order, is_active: true, created_at: now, updated_at: now
    })), { updateOnDuplicate: ['name', 'description', 'sort_order', 'updated_at'] });

    await queryInterface.bulkInsert('services', services.map(([id, category_id, name, slug, description, base_price, duration_minutes]) => ({
      id, category_id, name, slug, description, base_price, duration_minutes, is_active: true, created_at: now, updated_at: now
    })), { updateOnDuplicate: ['name', 'description', 'base_price', 'duration_minutes', 'updated_at'] });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('services', { id: services.map(([id]) => id) });
    await queryInterface.bulkDelete('service_categories', { id: categories.map(([id]) => id) });
    await queryInterface.bulkDelete('roles', { id: roles.map(([id]) => id) });
  }
};
