const { Op } = require('sequelize');
const { ProviderDocument } = require('../../models');

function isProviderBookable(provider, user, identityDocumentsCurrent) {
  return Boolean(
    provider
    && user
    && provider.approvalStatus === 'approved'
    && provider.identityVerified
    && provider.isOnline
    && user.status === 'active'
    && user.emailVerifiedAt
    && identityDocumentsCurrent
  );
}

async function hasCurrentIdentityDocuments(providerId, transaction, now = new Date()) {
  const documents = await ProviderDocument.findAll({
    where: {
      providerId,
      documentType: { [Op.in]: ['identity_front', 'identity_back'] }
    },
    attributes: ['documentType', 'status', 'expiresAt', 'createdAt'],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
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

module.exports = { hasCurrentIdentityDocuments, isProviderBookable };
