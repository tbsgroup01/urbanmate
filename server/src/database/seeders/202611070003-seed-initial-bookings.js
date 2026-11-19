'use strict';

const crypto = require('node:crypto');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Check if bookings already exist
    const existing = await queryInterface.rawSelect('bookings', {}, ['id']);
    if (existing) return;

    // Get an address
    const address = await queryInterface.rawSelect('addresses', {}, ['id', 'user_id']);
    const customer = await queryInterface.rawSelect('users', {
      where: { email: 'rocketremitt@gmail.com' }
    }, ['id']) || await queryInterface.rawSelect('users', {}, ['id']);

    const provider = await queryInterface.rawSelect('providers', {
      where: { approval_status: 'approved' }
    }, ['id']);

    const services = await queryInterface.sequelize.query(
      'SELECT id, name, base_price FROM services LIMIT 4',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!services || services.length === 0 || !customer) return;

    // Create address if needed
    let addressId = address;
    if (!addressId) {
      addressId = crypto.randomUUID();
      await queryInterface.bulkInsert('addresses', [{
        id: addressId,
        user_id: customer,
        label: 'Home',
        line1: '123 Market St',
        line2: 'Apt 4B',
        city: 'New York',
        postal_code: '10001',
        country_code: 'US',
        is_default: true,
        created_at: now,
        updated_at: now
      }]);
    }

    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const dayAfter = new Date(Date.now() + 48 * 3600 * 1000);
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);

    const bookingsToInsert = [
      {
        id: crypto.randomUUID(),
        booking_number: `UB-${Date.now().toString().slice(-6)}-1`,
        customer_id: customer,
        provider_id: provider || null,
        service_id: services[0].id,
        address_id: addressId,
        service_name_snapshot: services[0].name,
        scheduled_start: yesterday,
        scheduled_end: new Date(yesterday.getTime() + 2 * 3600 * 1000),
        status: 'completed',
        subtotal: services[0].base_price,
        platform_fee: (Number(services[0].base_price) * 0.1).toFixed(2),
        tax: 0,
        total: services[0].base_price,
        currency: 'INR',
        customer_notes: 'Please ring the doorbell on arrival',
        completed_at: yesterday,
        created_at: yesterday,
        updated_at: yesterday
      },
      {
        id: crypto.randomUUID(),
        booking_number: `UB-${Date.now().toString().slice(-6)}-2`,
        customer_id: customer,
        provider_id: provider || null,
        service_id: services[1] ? services[1].id : services[0].id,
        address_id: addressId,
        service_name_snapshot: services[1] ? services[1].name : services[0].name,
        scheduled_start: tomorrow,
        scheduled_end: new Date(tomorrow.getTime() + 2 * 3600 * 1000),
        status: 'confirmed',
        subtotal: services[1] ? services[1].base_price : services[0].base_price,
        platform_fee: 5.00,
        tax: 0,
        total: services[1] ? services[1].base_price : services[0].base_price,
        currency: 'INR',
        customer_notes: 'Kitchen sink pipe repair',
        created_at: now,
        updated_at: now
      },
      {
        id: crypto.randomUUID(),
        booking_number: `UB-${Date.now().toString().slice(-6)}-3`,
        customer_id: customer,
        provider_id: null,
        service_id: services[2] ? services[2].id : services[0].id,
        address_id: addressId,
        service_name_snapshot: services[2] ? services[2].name : services[0].name,
        scheduled_start: dayAfter,
        scheduled_end: new Date(dayAfter.getTime() + 2 * 3600 * 1000),
        status: 'pending',
        subtotal: services[2] ? services[2].base_price : services[0].base_price,
        platform_fee: 6.00,
        tax: 0,
        total: services[2] ? services[2].base_price : services[0].base_price,
        currency: 'INR',
        customer_notes: 'Awaiting provider confirmation',
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('bookings', bookingsToInsert);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
  }
};

