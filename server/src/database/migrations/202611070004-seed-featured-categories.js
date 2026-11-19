'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const featuredCategories = [
      {
        id: '20000000-0000-4000-8000-000000000011',
        name: 'Full Home/ By Room Cleaning',
        slug: 'full-home-by-room-cleaning',
        description: 'Complete deep cleaning for entire homes or specific rooms by verified pros',
        image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        is_active: true,
        sort_order: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: '20000000-0000-4000-8000-000000000012',
        name: 'Statement design wall',
        slug: 'statement-design-wall',
        description: 'Premium wood slat accent walls, textures, and bespoke decorative backdrops',
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        is_active: true,
        sort_order: 2,
        created_at: now,
        updated_at: now
      },
      {
        id: '20000000-0000-4000-8000-000000000013',
        name: 'Living & Bedroom Cleaning',
        slug: 'living-bedroom-cleaning',
        description: 'Specialized upholstery, mattress, and dusting care for living and sleeping spaces',
        image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        is_active: true,
        sort_order: 3,
        created_at: now,
        updated_at: now
      },
      {
        id: '20000000-0000-4000-8000-000000000014',
        name: 'Native Water Purifier',
        slug: 'native-water-purifier',
        description: 'Next-generation smart RO+UV water purifiers with phone monitoring & filter alerts',
        image_url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
        is_active: true,
        sort_order: 4,
        created_at: now,
        updated_at: now
      },
      {
        id: '20000000-0000-4000-8000-000000000015',
        name: 'Native Smart Locks',
        slug: 'native-smart-locks',
        description: 'High-security keyless digital door locks with 3D face recognition & app unlock',
        image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
        is_active: true,
        sort_order: 5,
        created_at: now,
        updated_at: now
      }
    ];

    // Upsert featured categories
    for (const cat of featuredCategories) {
      await queryInterface.bulkInsert('service_categories', [cat], {
        updateOnDuplicate: ['name', 'description', 'image_url', 'sort_order', 'is_active', 'updated_at']
      });
    }

    // Update images for initial categories if null
    await queryInterface.bulkUpdate('service_categories',
      { image_url: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80', sort_order: 6 },
      { id: '20000000-0000-4000-8000-000000000001' }
    );
    await queryInterface.bulkUpdate('service_categories',
      { image_url: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80', sort_order: 7 },
      { id: '20000000-0000-4000-8000-000000000002' }
    );
    await queryInterface.bulkUpdate('service_categories',
      { image_url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80', sort_order: 8 },
      { id: '20000000-0000-4000-8000-000000000003' }
    );

    // Seed services for new categories so when user clicks any category they get services
    const services = [
      {
        id: '30000000-0000-4000-8000-000000000011',
        category_id: '20000000-0000-4000-8000-000000000011',
        name: 'Full home deep cleaning (2 BHK / 3 BHK)',
        slug: 'full-home-deep-cleaning',
        description: 'Intense top-to-bottom scrub, sanitize, and vacuum for all rooms, kitchen, and bathrooms.',
        base_price: 129.00,
        duration_minutes: 240,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '30000000-0000-4000-8000-000000000012',
        category_id: '20000000-0000-4000-8000-000000000012',
        name: 'Acoustic fluted wood panel accent wall',
        slug: 'acoustic-fluted-wood-wall',
        description: 'Contemporary vertical wooden slats with LED ambient backlit profiles for TV consoles.',
        base_price: 249.00,
        duration_minutes: 360,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '30000000-0000-4000-8000-000000000013',
        category_id: '20000000-0000-4000-8000-000000000013',
        name: 'Sofa shampooing & living room revitalizer',
        slug: 'sofa-shampooing-living-cleaning',
        description: 'Multi-stage deep extraction shampooing for couches, cushions, and living room carpets.',
        base_price: 69.00,
        duration_minutes: 90,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '30000000-0000-4000-8000-000000000014',
        category_id: '20000000-0000-4000-8000-000000000014',
        name: 'Native M2 Smart RO+UV Water Purifier',
        slug: 'native-m2-smart-water-purifier',
        description: '10-stage purification with 2-year no-service-required filters and real-time app tracking.',
        base_price: 189.00,
        duration_minutes: 60,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: '30000000-0000-4000-8000-000000000015',
        category_id: '20000000-0000-4000-8000-000000000015',
        name: 'Native 3D Face ID Smart Door Lock',
        slug: 'native-3d-face-id-smart-lock',
        description: 'Biometric facial scan, fingerprint, NFC keycard, and mobile app door access.',
        base_price: 219.00,
        duration_minutes: 90,
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    for (const s of services) {
      await queryInterface.bulkInsert('services', [s], {
        updateOnDuplicate: ['name', 'description', 'base_price', 'duration_minutes', 'is_active', 'updated_at']
      });
    }

    // Add service images
    const serviceImages = [
      {
        id: '40000000-0000-4000-8000-000000000011',
        service_id: '30000000-0000-4000-8000-000000000011',
        image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Full home cleaning service',
        sort_order: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: '40000000-0000-4000-8000-000000000012',
        service_id: '30000000-0000-4000-8000-000000000012',
        image_url: 'https://www.urbancompany.com/img/images/growth/home-screen/1794421454113-a0f0a9.jpeg?bucket=urbanclap-prod&quality=85&format=auto',
        alt_text: 'Statement design wall',
        sort_order: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: '40000000-0000-4000-8000-000000000013',
        service_id: '30000000-0000-4000-8000-000000000013',
        image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Living room cleaning',
        sort_order: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: '40000000-0000-4000-8000-000000000014',
        service_id: '30000000-0000-4000-8000-000000000014',
        image_url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Native Water Purifier',
        sort_order: 0,
        created_at: now,
        updated_at: now
      },
      {
        id: '40000000-0000-4000-8000-000000000015',
        service_id: '30000000-0000-4000-8000-000000000015',
        image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Native Smart Locks',
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
  },

  async down(queryInterface) {
    const categoryIds = [
      '20000000-0000-4000-8000-000000000011',
      '20000000-0000-4000-8000-000000000012',
      '20000000-0000-4000-8000-000000000013',
      '20000000-0000-4000-8000-000000000014',
      '20000000-0000-4000-8000-000000000015'
    ];
    await queryInterface.bulkDelete('service_images', {
      service_id: [
        '30000000-0000-4000-8000-000000000011',
        '30000000-0000-4000-8000-000000000012',
        '30000000-0000-4000-8000-000000000013',
        '30000000-0000-4000-8000-000000000014',
        '30000000-0000-4000-8000-000000000015'
      ]
    });
    await queryInterface.bulkDelete('services', {
      id: [
        '30000000-0000-4000-8000-000000000011',
        '30000000-0000-4000-8000-000000000012',
        '30000000-0000-4000-8000-000000000013',
        '30000000-0000-4000-8000-000000000014',
        '30000000-0000-4000-8000-000000000015'
      ]
    });
    await queryInterface.bulkDelete('service_categories', { id: categoryIds });
  }
};

