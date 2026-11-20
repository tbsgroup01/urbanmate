'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  UserRole,
  Address,
  ServiceCategory,
  Service,
  City,
  Area,
  ServiceArea,
  Provider,
  ProviderDocument,
  ProviderService,
  ProviderArea,
  ProviderAvailability,
  Booking,
  BookingServiceItem,
  BookingStatusHistory,
  Payment,
  Commission,
  Review,
  Notification
} = require('../models');

/**
 * Ensures the `is_dummy` column exists on relevant tables without schema conflicts.
 */
async function ensureDummyColumns() {
  const tables = ['bookings', 'providers', 'users', 'reviews'];
  for (const table of tables) {
    const [existing] = await sequelize.query(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :db AND TABLE_NAME = :table AND COLUMN_NAME = :column',
      {
        replacements: {
          db: process.env.DB_NAME || 'urbanmate',
          table,
          column: 'is_dummy'
        }
      }
    );
    if (!existing || existing.length === 0) {
      await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`is_dummy\` TINYINT(1) NOT NULL DEFAULT 0`);
      console.log(`Added is_dummy column to table ${table}.`);
    }
  }
}

/**
 * Safely purges dummy bookings and cascades related child rows.
 */
async function purgeDummyBookings({ customerId, providerId, all = false } = {}) {
  const where = { isDummy: true };
  if (!all) {
    if (customerId) where.customerId = customerId;
    if (providerId) where.providerId = providerId;
  }

  const dummyBookings = await Booking.findAll({ where, attributes: ['id'] });
  if (!dummyBookings || dummyBookings.length === 0) return 0;

  const ids = dummyBookings.map((b) => b.id);

  await sequelize.transaction(async (t) => {
    await BookingServiceItem.destroy({ where: { bookingId: { [Op.in]: ids } }, transaction: t });
    await Payment.destroy({ where: { bookingId: { [Op.in]: ids } }, transaction: t });
    await Commission.destroy({ where: { bookingId: { [Op.in]: ids } }, transaction: t });
    await BookingStatusHistory.destroy({ where: { bookingId: { [Op.in]: ids } }, transaction: t });
    await Review.destroy({ where: { bookingId: { [Op.in]: ids } }, transaction: t });
    await Notification.destroy({ where: { bookingId: { [Op.in]: ids } }, transaction: t });
    await Booking.destroy({ where: { id: { [Op.in]: ids } }, transaction: t });
  });

  console.log(`Purged ${ids.length} dummy booking(s) successfully.`);
  return ids.length;
}

/**
 * Auto-purge dummy bookings if real data exists.
 * If customerId provided: checks if customer has real bookings, and deletes dummy bookings for that customer.
 * If providerId provided: checks if provider has real bookings, and deletes dummy bookings for that provider.
 * If all: if any real booking exists in the system, purges all dummy bookings.
 */
async function autoPurgeIfRealDataExists({ customerId, providerId, all = false } = {}) {
  try {
    if (customerId) {
      const realCustomerCount = await Booking.count({ where: { customerId, isDummy: false } });
      if (realCustomerCount > 0) {
        await purgeDummyBookings({ customerId });
      }
    }
    if (providerId) {
      const realProviderCount = await Booking.count({ where: { providerId, isDummy: false } });
      if (realProviderCount > 0) {
        await purgeDummyBookings({ providerId });
      }
    }
    if (all) {
      const totalRealCount = await Booking.count({ where: { isDummy: false } });
      if (totalRealCount > 0) {
        await purgeDummyBookings({ all: true });
      }
    }
  } catch (error) {
    console.warn('Auto-purge dummy data warning:', error.message);
  }
}

/**
 * Seeds comprehensive, realistic dummy data for categories, services, cities, providers, customers, and bookings.
 */
async function seedDummyData({ force = false } = {}) {
  await ensureDummyColumns();

  console.log('--- Starting Dummy Data Seeding ---');
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const dayAfter = new Date(Date.now() + 48 * 3600 * 1000);

  // 1. Roles
  const [customerRole] = await Role.findOrCreate({
    where: { name: 'customer' },
    defaults: { id: '10000000-0000-4000-8000-000000000001', description: 'Customer account' }
  });
  const [providerRole] = await Role.findOrCreate({
    where: { name: 'provider' },
    defaults: { id: '10000000-0000-4000-8000-000000000002', description: 'Service provider account' }
  });
  await Role.findOrCreate({
    where: { name: 'admin' },
    defaults: { id: '10000000-0000-4000-8000-000000000003', description: 'Platform administrator' }
  });

  // 2. Categories
  const categoriesData = [
    { id: '20000000-0000-4000-8000-000000000001', name: 'Cleaning', slug: 'cleaning', description: 'Home deep cleaning, sofa and kitchen cleaning', sortOrder: 1, isActive: true },
    { id: '20000000-0000-4000-8000-000000000002', name: 'Plumbing', slug: 'plumbing', description: 'Pipe leakages, tap repairs, sanitary fixtures', sortOrder: 2, isActive: true },
    { id: '20000000-0000-4000-8000-000000000003', name: 'Electrical', slug: 'electrical', description: 'Wiring, fixtures, switches, inspections & repairs', sortOrder: 3, isActive: true },
    { id: '20000000-0000-4000-8000-000000000004', name: 'Painting & Walls', slug: 'painting-wall-design', description: 'Interior painting, acoustic wood panel accent walls', sortOrder: 4, isActive: true },
    { id: '20000000-0000-4000-8000-000000000005', name: 'AC & Appliance Repair', slug: 'ac-appliance-repair', description: 'Air conditioner servicing, refrigerators, washing machines', sortOrder: 5, isActive: true },
    { id: '20000000-0000-4000-8000-000000000006', name: 'Pest Control', slug: 'pest-control', description: 'Cockroach, termite, bed bug control and sanitization', sortOrder: 6, isActive: true }
  ];

  for (const cat of categoriesData) {
    await ServiceCategory.findOrCreate({ where: { slug: cat.slug }, defaults: cat });
  }

  // 3. Services
  const servicesData = [
    {
      id: '30000000-0000-4000-8000-000000000001',
      categoryId: '20000000-0000-4000-8000-000000000001',
      name: 'Standard home cleaning',
      slug: 'standard-home-cleaning',
      description: 'Routine dusting, sweeping, mopping, and surfaces wipe-down',
      basePrice: 499.00,
      durationMinutes: 120,
      isActive: true
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      categoryId: '20000000-0000-4000-8000-000000000002',
      name: 'Plumbing repair',
      slug: 'plumbing-repair',
      description: 'General household plumbing repair, leak detection and fixing',
      basePrice: 399.00,
      durationMinutes: 90,
      isActive: true
    },
    {
      id: '30000000-0000-4000-8000-000000000003',
      categoryId: '20000000-0000-4000-8000-000000000003',
      name: 'Electrical inspection',
      slug: 'electrical-inspection',
      description: 'Comprehensive household wiring, earthing, and load check',
      basePrice: 69.00,
      durationMinutes: 60,
      isActive: true
    },
    {
      id: '30000000-0000-4000-8000-000000000004',
      categoryId: '20000000-0000-4000-8000-000000000001',
      name: 'Furnished apartment - Home deep cleaning',
      slug: 'furnished-apartment-home-deep-cleaning',
      description: 'Intensive deep scrubbing, machine floor polishing, sanitization',
      basePrice: 3499.00,
      durationMinutes: 240,
      isActive: true
    },
    {
      id: '30000000-0000-4000-8000-000000000005',
      categoryId: '20000000-0000-4000-8000-000000000004',
      name: 'Acoustic fluted wood panel accent wall',
      slug: 'acoustic-fluted-wood-panel-accent-wall',
      description: 'Precision architectural fluted timber panel installation with sound damping',
      basePrice: 1249.00,
      durationMinutes: 180,
      isActive: true
    },
    {
      id: '30000000-0000-4000-8000-000000000006',
      categoryId: '20000000-0000-4000-8000-000000000005',
      name: 'Split AC service & deep foam clean',
      slug: 'split-ac-service-deep-foam-clean',
      description: 'Jet pump foam wash, indoor filter antibacterial rinse, cooling check',
      basePrice: 599.00,
      durationMinutes: 60,
      isActive: true
    }
  ];

  for (const s of servicesData) {
    await Service.findOrCreate({ where: { slug: s.slug }, defaults: s });
  }

  // 4. Cities and Areas
  const [cityNy] = await City.findOrCreate({
    where: { slug: 'new-york' },
    defaults: { id: '40000000-0000-4000-8000-000000000001', name: 'New York', countryCode: 'US', isActive: true }
  });
  const [cityMumbai] = await City.findOrCreate({
    where: { slug: 'mumbai' },
    defaults: { id: '40000000-0000-4000-8000-000000000002', name: 'Mumbai', countryCode: 'IN', isActive: true }
  });

  const [areaNy] = await Area.findOrCreate({
    where: { cityId: cityNy.id, slug: 'manhattan' },
    defaults: { id: '50000000-0000-4000-8000-000000000001', name: '123 Market St, Manhattan 10001', isActive: true }
  });
  const [areaMumbai] = await Area.findOrCreate({
    where: { cityId: cityMumbai.id, slug: 'bandra-west' },
    defaults: { id: '50000000-0000-4000-8000-000000000002', name: 'Bandra West', isActive: true }
  });

  // Link services to areas
  for (const s of servicesData) {
    await ServiceArea.findOrCreate({ where: { serviceId: s.id, areaId: areaNy.id }, defaults: { isActive: true } });
    await ServiceArea.findOrCreate({ where: { serviceId: s.id, areaId: areaMumbai.id }, defaults: { isActive: true } });
  }

  // 5. Customer Users (Dummy)
  const passwordHash = await bcrypt.hash('Pass@123', 10);

  const [customerUser1] = await User.findOrCreate({
    where: { email: 'rocketremitt@gmail.com' },
    defaults: {
      id: '60000000-0000-4000-8000-000000000001',
      fullName: 'Rajeev Aggarwal',
      phone: '+19876543210',
      passwordHash,
      status: 'active',
      emailVerifiedAt: now,
      isDummy: true
    }
  });
  await UserRole.findOrCreate({ where: { userId: customerUser1.id, roleId: customerRole.id } });

  const [customerUser2] = await User.findOrCreate({
    where: { email: 'priya@gmail.com' },
    defaults: {
      id: '60000000-0000-4000-8000-000000000002',
      fullName: 'Priya Sharma',
      phone: '+919876543211',
      passwordHash,
      status: 'active',
      emailVerifiedAt: now,
      isDummy: true
    }
  });
  await UserRole.findOrCreate({ where: { userId: customerUser2.id, roleId: customerRole.id } });

  // Customer Addresses
  const [address1] = await Address.findOrCreate({
    where: { userId: customerUser1.id, isDefault: true },
    defaults: {
      id: '70000000-0000-4000-8000-000000000001',
      label: 'Home',
      line1: '123 Market St',
      line2: 'Apt 4B',
      city: 'New York',
      cityId: cityNy.id,
      areaId: areaNy.id,
      postalCode: '10001',
      countryCode: 'US',
      isDefault: true
    }
  });

  const [address2] = await Address.findOrCreate({
    where: { userId: customerUser2.id, isDefault: true },
    defaults: {
      id: '70000000-0000-4000-8000-000000000002',
      label: 'Apartment',
      line1: 'Flat 302, Palm Heights',
      line2: 'Bandra West',
      city: 'Mumbai',
      cityId: cityMumbai.id,
      areaId: areaMumbai.id,
      postalCode: '400050',
      countryCode: 'IN',
      isDefault: true
    }
  });

  // 6. Provider Users (Dummy)
  // Provider 1: Arjan Sharma (Jane Plumbing & Home Care)
  const [providerUser1] = await User.findOrCreate({
    where: { email: 'jane@example.com' },
    defaults: {
      id: '60000000-0000-4000-8000-000000000003',
      fullName: 'Jane Plumbing & Home Services',
      phone: '+19876543212',
      passwordHash,
      status: 'active',
      emailVerifiedAt: now,
      isDummy: true
    }
  });
  await UserRole.findOrCreate({ where: { userId: providerUser1.id, roleId: providerRole.id } });

  const [provider1] = await Provider.findOrCreate({
    where: { userId: providerUser1.id },
    defaults: {
      id: '80000000-0000-4000-8000-000000000001',
      displayName: 'Arjan Sharma (Home Specialist)',
      businessName: 'Sharma Home Care Pro',
      bio: 'Licensed home electrician and deep cleaning specialist with 6 years experience.',
      approvalStatus: 'approved',
      identityVerified: true,
      isOnline: true,
      experienceYears: 6,
      averageRating: 4.90,
      reviewCount: 38,
      isDummy: true
    }
  });

  // Provider 2: Karan & Team (matches provider2 from user's screenshot)
  const [providerUser2] = await User.findOrCreate({
    where: { email: 'provider2@gmail.com' },
    defaults: {
      id: '60000000-0000-4000-8000-000000000004',
      fullName: 'Karan Salon & Home Pro',
      phone: '+19876543213',
      passwordHash,
      status: 'active',
      emailVerifiedAt: now,
      isDummy: true
    }
  });
  await UserRole.findOrCreate({ where: { userId: providerUser2.id, roleId: providerRole.id } });

  const [provider2] = await Provider.findOrCreate({
    where: { userId: providerUser2.id },
    defaults: {
      id: '80000000-0000-4000-8000-000000000002',
      displayName: 'Karan & Team (Salon Experts)',
      businessName: 'Karan Home & Salon Services',
      bio: 'Certified styling, grooming, and interior wall finishes expert.',
      approvalStatus: 'approved',
      identityVerified: true,
      isOnline: true,
      experienceYears: 4,
      averageRating: 4.80,
      reviewCount: 24,
      isDummy: true
    }
  });

  // Provider 3: Pending review application for Admin Portal
  const [providerUser3] = await User.findOrCreate({
    where: { email: 'vikram.electric@gmail.com' },
    defaults: {
      id: '60000000-0000-4000-8000-000000000005',
      fullName: 'Vikram Patel',
      phone: '+919876543214',
      passwordHash,
      status: 'pending',
      isDummy: true
    }
  });
  await UserRole.findOrCreate({ where: { userId: providerUser3.id, roleId: providerRole.id } });

  await Provider.findOrCreate({
    where: { userId: providerUser3.id },
    defaults: {
      id: '80000000-0000-4000-8000-000000000003',
      displayName: 'Vikram Patel (Quick Electric)',
      businessName: 'Patel Electrical Repairs',
      bio: 'Commercial and residential electrician seeking platform onboarding.',
      approvalStatus: 'pending',
      identityVerified: false,
      experienceYears: 3,
      averageRating: 0.00,
      reviewCount: 0,
      isDummy: true
    }
  });

  // Map Provider services and areas
  for (const s of servicesData) {
    await ProviderService.findOrCreate({
      where: { providerId: provider1.id, serviceId: s.id },
      defaults: { customPrice: s.basePrice, isActive: true }
    });
    await ProviderService.findOrCreate({
      where: { providerId: provider2.id, serviceId: s.id },
      defaults: { customPrice: s.basePrice, isActive: true }
    });
  }
  await ProviderArea.findOrCreate({ where: { providerId: provider1.id, areaId: areaNy.id }, defaults: { isActive: true } });
  await ProviderArea.findOrCreate({ where: { providerId: provider1.id, areaId: areaMumbai.id }, defaults: { isActive: true } });
  await ProviderArea.findOrCreate({ where: { providerId: provider2.id, areaId: areaNy.id }, defaults: { isActive: true } });
  await ProviderArea.findOrCreate({ where: { providerId: provider2.id, areaId: areaMumbai.id }, defaults: { isActive: true } });

  // Availability for providers 1 and 2
  for (let weekday = 0; weekday <= 6; weekday++) {
    await ProviderAvailability.findOrCreate({
      where: { providerId: provider1.id, weekday },
      defaults: {
        startTime: '00:00:00',
        endTime: '23:59:00',
        isAvailable: true,
        timezone: 'UTC'
      }
    });
    await ProviderAvailability.findOrCreate({
      where: { providerId: provider2.id, weekday },
      defaults: {
        startTime: '00:00:00',
        endTime: '23:59:00',
        isAvailable: true,
        timezone: 'UTC'
      }
    });
  }

  // Approved identity documents for providers 1 and 2
  const docTypes = ['identity_front', 'identity_back'];
  for (const p of [provider1, provider2]) {
    for (const dt of docTypes) {
      await ProviderDocument.findOrCreate({
        where: { providerId: p.id, documentType: dt },
        defaults: {
          storageKey: `documents/${p.id}/${dt}.pdf`,
          status: 'approved',
          contentType: 'application/pdf',
          fileSizeBytes: 10240,
          uploadedAt: now,
          reviewedAt: now
        }
      });
    }
  }

  // 7. Seed Bookings with dummy flag
  const realBookingsCount = await Booking.count({ where: { isDummy: false } });
  if (realBookingsCount > 0 && !force) {
    console.log(`Real bookings (${realBookingsCount}) exist in database. Preserving live real-time data.`);
    return;
  }
  const dummyBookingsCount = await Booking.count({ where: { isDummy: true } });
  if (dummyBookingsCount > 0 && !force) {
    console.log(`Dummy bookings already exist (${dummyBookingsCount}). Skipping duplicate creation.`);
    return;
  }

  console.log('Seeding initial realistic dummy bookings...');

  const dummyBookings = [
    // 1. Electrical inspection -> provider_completed (Waiting for customer confirmation)
    {
      id: '90000000-0000-4000-8000-000000000001',
      bookingNumber: 'UM-7F233F1440DC47DABEA7',
      customerId: customerUser1.id,
      providerId: provider1.id,
      serviceId: '30000000-0000-4000-8000-000000000003',
      addressId: address1.id,
      serviceNameSnapshot: 'Electrical inspection',
      scheduledStart: tomorrow,
      scheduledEnd: new Date(tomorrow.getTime() + 3600 * 1000),
      status: 'provider_completed',
      subtotal: 69.00,
      platformFee: 0.00,
      tax: 0.00,
      total: 69.00,
      currency: 'INR',
      customerNotes: 'Main breaker trip check in kitchen and hallway',
      isDummy: true
    },
    // 2. Acoustic fluted wood panel accent wall -> assigned
    {
      id: '90000000-0000-4000-8000-000000000002',
      bookingNumber: 'UM-E994640B2D494056BE63',
      customerId: customerUser1.id,
      providerId: provider2.id,
      serviceId: '30000000-0000-4000-8000-000000000005',
      addressId: address1.id,
      serviceNameSnapshot: 'Acoustic fluted wood panel accent wall',
      scheduledStart: dayAfter,
      scheduledEnd: new Date(dayAfter.getTime() + 3 * 3600 * 1000),
      status: 'assigned',
      subtotal: 1249.00,
      platformFee: 0.00,
      tax: 0.00,
      total: 1249.00,
      currency: 'INR',
      customerNotes: 'Living room feature wall behind TV console',
      isDummy: true
    },
    // 3. Furnished apartment - Home deep cleaning -> completed (Generates earnings!)
    {
      id: '90000000-0000-4000-8000-000000000003',
      bookingNumber: 'UM-2012C8F98159400B8943',
      customerId: customerUser1.id,
      providerId: provider1.id,
      serviceId: '30000000-0000-4000-8000-000000000004',
      addressId: address1.id,
      serviceNameSnapshot: 'Furnished apartment - Home deep cleaning',
      scheduledStart: yesterday,
      scheduledEnd: new Date(yesterday.getTime() + 4 * 3600 * 1000),
      completedAt: yesterday,
      status: 'completed',
      subtotal: 3499.00,
      platformFee: 0.00,
      tax: 0.00,
      total: 3499.00,
      currency: 'INR',
      customerNotes: 'Full apartment move-in deep cleaning',
      isDummy: true
    },
    // 4. Plumbing repair -> pending (Awaiting provider assignment for Admin pulse)
    {
      id: '90000000-0000-4000-8000-000000000004',
      bookingNumber: 'UM-A14890B73C21400D9F10',
      customerId: customerUser2.id,
      providerId: null,
      serviceId: '30000000-0000-4000-8000-000000000002',
      addressId: address2.id,
      serviceNameSnapshot: 'Plumbing repair',
      scheduledStart: tomorrow,
      scheduledEnd: new Date(tomorrow.getTime() + 2 * 3600 * 1000),
      status: 'pending',
      subtotal: 399.00,
      platformFee: 0.00,
      tax: 0.00,
      total: 399.00,
      currency: 'INR',
      customerNotes: 'Bathroom pipe joint dripping under sink',
      isDummy: true
    },
    // 5. Electrical inspection -> cancelled
    {
      id: '90000000-0000-4000-8000-000000000005',
      bookingNumber: 'UM-24791-3-19/11/2026',
      customerId: customerUser1.id,
      providerId: provider1.id,
      serviceId: '30000000-0000-4000-8000-000000000003',
      addressId: address1.id,
      serviceNameSnapshot: 'Electrical inspection',
      scheduledStart: yesterday,
      scheduledEnd: new Date(yesterday.getTime() + 3600 * 1000),
      status: 'cancelled',
      subtotal: 69.00,
      platformFee: 0.00,
      tax: 0.00,
      total: 69.00,
      currency: 'INR',
      cancellationReason: 'Customer rescheduled',
      isDummy: true
    }
  ];

  for (const b of dummyBookings) {
    const createdBooking = await Booking.create(b);

    // Create item
    await BookingServiceItem.create({
      bookingId: createdBooking.id,
      itemType: 'package',
      nameSnapshot: createdBooking.serviceNameSnapshot,
      unitPrice: createdBooking.subtotal,
      durationMinutes: 60
    });

    // Create Status History
    await BookingStatusHistory.create({
      bookingId: createdBooking.id,
      actorUserId: createdBooking.customerId,
      fromStatus: null,
      toStatus: createdBooking.status,
      reason: 'Initial booking setup'
    });

    // If completed, add Payment, Commission, and Review
    if (b.status === 'completed') {
      await Payment.create({
        bookingId: createdBooking.id,
        providerName: 'Simulated Card / UPI',
        providerTransactionId: `TXN-DEMO-${Date.now()}-1`,
        amount: createdBooking.total,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        paidAt: yesterday
      });

      await Commission.create({
        bookingId: createdBooking.id,
        providerId: b.providerId,
        amount: createdBooking.total,
        ratePercent: 0,
        status: 'payable',
        currency: 'INR'
      });

      await Review.create({
        bookingId: createdBooking.id,
        customerId: createdBooking.customerId,
        providerId: b.providerId,
        rating: 5,
        comment: 'Superb cleaning service! Very courteous and thorough. Highly recommended.',
        status: 'published',
        isDummy: true
      });
    }
  }

  console.log('\x1b[32m%s\x1b[0m', 'Dummy data seeded successfully!');
}

module.exports = {
  ensureDummyColumns,
  seedDummyData,
  purgeDummyBookings,
  autoPurgeIfRealDataExists
};
