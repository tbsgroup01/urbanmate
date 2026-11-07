const { Op } = require('sequelize');
const { ProviderDocument } = require('../../models');

async function hasCurrentIdentityDocuments(providerId, transaction, now = new Date()) {
  const documents = await ProviderDocument.findAll({
    where: {
      providerId,
      documentType: { [Op.in]: ['identity_front', 'identity_back'] },
      uploadedAt: { [Op.ne]: null }
    },
    attributes: ['documentType', 'status', 'expiresAt', 'createdAt'],
    order: [['createdAt', 'DESC']],
    transaction
  });
  const latest = new Map();
  for (const document of documents) {
    if (!latest.has(document.documentType)) latest.set(document.documentType, document);
  }
  const today = now.toISOString().slice(0, 10);
  return ['identity_front', 'identity_back'].every((type) => {
    const document = latest.get(type);
    return document?.status === 'approved' && (!document.expiresAt || document.expiresAt >= today);
  });
}

module.exports = { hasCurrentIdentityDocuments };
