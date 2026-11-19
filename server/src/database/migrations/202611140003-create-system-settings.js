const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some((t) => (typeof t === 'string' ? t : t.tableName) === 'system_settings');
    
    if (!tableExists) {
      await queryInterface.createTable('system_settings', {
        id: {
          type: DataTypes.CHAR(36),
          primaryKey: true,
          allowNull: false
        },
        key: {
          type: DataTypes.STRING(64),
          unique: true,
          allowNull: false
        },
        value: {
          type: DataTypes.JSON,
          allowNull: false
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      });
    }

    const now = new Date();
    const initialSettings = [
      {
        id: '10000000-0000-4000-8000-000000000001',
        key: 'general',
        value: JSON.stringify({
          siteName: 'UrbanMate',
          siteTitle: 'UrbanMate - On-Demand Doorstep Home & Salon Services',
          metaDescription: 'UrbanMate connects you with verified local professionals for cleaning, repair, salon, and handyman services across your city.',
          metaKeywords: 'urbanmate, home services, salon at home, cleaning, plumbing, electrician, appliance repair',
          headerScripts: '',
          bodyScripts: '',
          logoUrl: '',
          faviconUrl: ''
        }),
        created_at: now,
        updated_at: now
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        key: 'payment',
        value: JSON.stringify({
          mode: 'test',
          razorpayEnabled: true,
          razorpayKeyId: 'rzp_test_1DP5mmOlF5G5ag',
          razorpayKeySecret: '',
          razorpayWebhookSecret: '',
          upiEnabled: true,
          upiId: 'urbanmate@upi',
          upiPayeeName: 'UrbanMate Marketplace',
          upiQrUrl: '',
          upiInstructions: 'Scan QR using any UPI app (GPay, PhonePe, Paytm). Confirm payment and note your transaction ID.',
          codEnabled: true
        }),
        created_at: now,
        updated_at: now
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        key: 'mail',
        value: JSON.stringify({
          enabled: false,
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          encryption: 'tls',
          user: '',
          password: '',
          fromEmail: 'noreply@urbanmate.in',
          fromName: 'UrbanMate Team'
        }),
        created_at: now,
        updated_at: now
      }
    ];

    for (const item of initialSettings) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM system_settings WHERE `key` = :key LIMIT 1',
        { replacements: { key: item.key } }
      );
      if (!existing || existing.length === 0) {
        await queryInterface.bulkInsert('system_settings', [item]);
      }
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some((t) => (typeof t === 'string' ? t : t.tableName) === 'system_settings');
    if (tableExists) {
      await queryInterface.dropTable('system_settings');
    }
  }
};

