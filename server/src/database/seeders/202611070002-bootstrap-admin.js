'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const env = require('../../config/env');

module.exports = {
  async up(queryInterface) {
    if (!env.ADMIN_EMAIL && !env.ADMIN_PASSWORD) return;
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap the first admin');
    }

    const email = env.ADMIN_EMAIL.trim().toLowerCase();
    const [existingUsers] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { replacements: { email } }
    );
    if (existingUsers.length) {
      const [existingAdmins] = await queryInterface.sequelize.query(
        `SELECT ur.user_id
         FROM user_roles ur
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = :userId AND r.name = 'admin'
         LIMIT 1`,
        { replacements: { userId: existingUsers[0].id } }
      );
      if (existingAdmins.length) return;
      throw new Error('ADMIN_EMAIL already belongs to a non-admin account; refusing role escalation');
    }

    const [adminRoles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin' LIMIT 1"
    );
    if (!adminRoles.length) throw new Error('Admin role is not seeded; run the marketplace seeder first');

    const id = crypto.randomUUID();
    const now = new Date();
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkInsert('users', [{
        id,
        full_name: env.ADMIN_FULL_NAME,
        email,
        password_hash: await bcrypt.hash(env.ADMIN_PASSWORD, env.BCRYPT_SALT_ROUNDS),
        status: 'active',
        created_at: now,
        updated_at: now
      }], { transaction });
      await queryInterface.bulkInsert('user_roles', [{
        user_id: id,
        role_id: adminRoles[0].id,
        created_at: now,
        updated_at: now
      }], { transaction });
    });
  },

  async down() {}
};
