'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const popularServices = [
      {
        id: '30000000-0000-4000-8000-000000000101',
        category_id: '4b8191ee-c708-4a76-a5d2-81ff8f00e19d', // Saloon
        name: 'Threading',
        slug: 'threading',
        description: 'Precise and gentle eyebrow and facial hair removal using organic cotton thread.',
        base_price: 49.00,
        duration_minutes: 10,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '30000000-0000-4000-8000-000000000102',
        category_id: '20000000-0000-4000-8000-000000000001', // Cleaning
        name: 'Intense cleaning (2 bathroom)',
        slug: 'intense-cleaning-2-bathroom',
        description: 'Machine scrubbing for tiles, hard water stain removal, disinfection of toilet and fittings.',
        base_price: 918.00,
        duration_minutes: 60,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '30000000-0000-4000-8000-000000000103',
        category_id: '20000000-0000-4000-8000-000000000003', // Electrical / AC
        name: 'Foam-jet AC service',
        slug: 'foam-jet-ac-service',
        description: 'High-pressure 2X deeper foam jet cleaning of indoor cooling coils and outdoor unit.',
        base_price: 599.00,
        duration_minutes: 60,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '30000000-0000-4000-8000-000000000104',
        category_id: '20000000-0000-4000-8000-000000000013', // Living & Bedroom Cleaning
        name: 'Fabric sofa cleaning',
        slug: 'fabric-sofa-cleaning',
        description: 'Deep vacuuming, industrial foam shampooing, and wet extraction for fabric sofas.',
        base_price: 399.00,
        duration_minutes: 45,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '30000000-0000-4000-8000-000000000105',
        category_id: '20000000-0000-4000-8000-000000000011', // Full Home/ By Room Cleaning
        name: 'Furnished apartment - Home deep cleaning',
        slug: 'furnished-apartment-home-deep-cleaning',
        description: 'Full house top-to-bottom mechanized cleaning with floor scrubbing and kitchen degreasing.',
        base_price: 3499.00,
        duration_minutes: 225, // 3 HRS 45 MINS
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    for (const s of popularServices) {
      await queryInterface.bulkInsert('services', [s], {
        updateOnDuplicate: ['name', 'category_id', 'description', 'base_price', 'duration_minutes', 'is_active', 'updated_at']
      });
    }

    const serviceImages = [
      {
        id: '40000000-0000-4000-8000-000000000101',
        service_id: '30000000-0000-4000-8000-000000000101',
        image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Threading',
        sort_order: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: '40000000-0000-4000-8000-000000000102',
        service_id: '30000000-0000-4000-8000-000000000102',
        image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Intense cleaning (2 bathroom)',
        sort_order: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: '40000000-0000-4000-8000-000000000103',
        service_id: '30000000-0000-4000-8000-000000000103',
        image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Foam-jet AC service',
        sort_order: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: '40000000-0000-4000-8000-000000000104',
        service_id: '30000000-0000-4000-8000-000000000104',
        image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Fabric sofa cleaning',
        sort_order: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: '40000000-0000-4000-8000-000000000105',
        service_id: '30000000-0000-4000-8000-000000000105',
        image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Furnished apartment - Home deep cleaning',
        sort_order: 0,
        created_at: now,
        updated_at: now
      }
    ];

    for (const img of serviceImages) {
      await queryInterface.bulkInsert('service_images', [img], {
        updateOnDuplicate: ['image_url', 'alt_text', 'sort_order', 'updated_at']
      });
    }

    // Seed packages to provide option counts
    const packages = [
      // Threading (8 options)
      { id: '50000000-0000-4000-8000-000000000101', service_id: '30000000-0000-4000-8000-000000000101', name: 'Eyebrows', price: 49.00, duration_minutes: 10, is_active: true, sort_order: 0, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000102', service_id: '30000000-0000-4000-8000-000000000101', name: 'Upper lip', price: 39.00, duration_minutes: 5, is_active: true, sort_order: 1, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000103', service_id: '30000000-0000-4000-8000-000000000101', name: 'Chin', price: 39.00, duration_minutes: 5, is_active: true, sort_order: 2, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000104', service_id: '30000000-0000-4000-8000-000000000101', name: 'Forehead', price: 49.00, duration_minutes: 10, is_active: true, sort_order: 3, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000105', service_id: '30000000-0000-4000-8000-000000000101', name: 'Full face', price: 199.00, duration_minutes: 25, is_active: true, sort_order: 4, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000106', service_id: '30000000-0000-4000-8000-000000000101', name: 'Sideburns', price: 59.00, duration_minutes: 10, is_active: true, sort_order: 5, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000107', service_id: '30000000-0000-4000-8000-000000000101', name: 'Jawline', price: 49.00, duration_minutes: 10, is_active: true, sort_order: 6, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000108', service_id: '30000000-0000-4000-8000-000000000101', name: 'Eyebrows + Upper lip', price: 79.00, duration_minutes: 15, is_active: true, sort_order: 7, created_at: now, updated_at: now },

      // Foam-jet AC (9 options)
      { id: '50000000-0000-4000-8000-000000000121', service_id: '30000000-0000-4000-8000-000000000103', name: '1 Split AC foam jet', price: 599.00, duration_minutes: 60, is_active: true, sort_order: 0, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000122', service_id: '30000000-0000-4000-8000-000000000103', name: '2 Split AC foam jet', price: 1099.00, duration_minutes: 120, is_active: true, sort_order: 1, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000123', service_id: '30000000-0000-4000-8000-000000000103', name: '3 Split AC foam jet', price: 1599.00, duration_minutes: 180, is_active: true, sort_order: 2, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000124', service_id: '30000000-0000-4000-8000-000000000103', name: '1 Window AC foam jet', price: 499.00, duration_minutes: 60, is_active: true, sort_order: 3, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000125', service_id: '30000000-0000-4000-8000-000000000103', name: 'Anti-rust protective coating', price: 299.00, duration_minutes: 30, is_active: true, sort_order: 4, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000126', service_id: '30000000-0000-4000-8000-000000000103', name: 'Gas check & top-up', price: 899.00, duration_minutes: 45, is_active: true, sort_order: 5, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000127', service_id: '30000000-0000-4000-8000-000000000103', name: 'Drain pipe leak repair', price: 349.00, duration_minutes: 30, is_active: true, sort_order: 6, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000128', service_id: '30000000-0000-4000-8000-000000000103', name: 'Indoor master PCB overhaul', price: 699.00, duration_minutes: 60, is_active: true, sort_order: 7, created_at: now, updated_at: now },
      { id: '50000000-0000-4000-8000-000000000129', service_id: '30000000-0000-4000-8000-000000000103', name: 'Full system health diagnostic', price: 199.00, duration_minutes: 30, is_active: true, sort_order: 8, created_at: now, updated_at: now }
    ];

    for (const pkg of packages) {
      await queryInterface.bulkInsert('service_packages', [{
        ...pkg,
        features: JSON.stringify(['Verified professional', 'Standard warranty'])
      }], {
        updateOnDuplicate: ['name', 'price', 'duration_minutes', 'features', 'is_active', 'sort_order', 'updated_at']
      });
    }
  },

  async down(queryInterface) {
    const serviceIds = [
      '30000000-0000-4000-8000-000000000101',
      '30000000-0000-4000-8000-000000000102',
      '30000000-0000-4000-8000-000000000103',
      '30000000-0000-4000-8000-000000000104',
      '30000000-0000-4000-8000-000000000105'
    ];
    await queryInterface.bulkDelete('service_packages', { service_id: serviceIds });
    await queryInterface.bulkDelete('service_images', { service_id: serviceIds });
    await queryInterface.bulkDelete('services', { id: serviceIds });
  }
};
