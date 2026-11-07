const { sequelize, Address, User, City, Area } = require('../../models');
const AppError = require('../../utils/app-error');

async function listAddresses(userId) {
  return Address.findAll({
    where: { userId },
    order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
  });
}

async function createAddress(userId, input) {
  return sequelize.transaction(async (transaction) => {
    await User.findByPk(userId, { attributes: ['id'], transaction, lock: transaction.LOCK.UPDATE });
    if (input.cityId) {
      const city = await City.findOne({
        where: { id: input.cityId, isActive: true },
        attributes: ['id'],
        transaction
      });
      if (!city) throw new AppError('City was not found or is unavailable', 400, 'INVALID_ADDRESS_CITY');
    }
    if (input.areaId) {
      const area = await Area.findOne({
        where: { id: input.areaId, cityId: input.cityId, isActive: true },
        attributes: ['id'],
        transaction
      });
      if (!area) throw new AppError('Area does not belong to the selected city', 400, 'INVALID_ADDRESS_AREA');
    }
    const hasAddresses = await Address.count({ where: { userId }, transaction });
    const makeDefault = input.isDefault === true || hasAddresses === 0;
    if (makeDefault) {
      await Address.update({ isDefault: false }, { where: { userId }, transaction });
    }

    return Address.create({
      ...input,
      userId,
      isDefault: makeDefault
    }, { transaction });
  });
}

module.exports = { listAddresses, createAddress };
