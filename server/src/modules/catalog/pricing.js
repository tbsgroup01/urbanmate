function roundPrice(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function calculateEffectivePrice(basePrice, rules = [], location = {}, now = new Date()) {
  const applicable = rules
    .filter((rule) => {
      if (!rule.isActive) return false;
      if (rule.startsAt && new Date(rule.startsAt) > now) return false;
      if (rule.endsAt && new Date(rule.endsAt) <= now) return false;
      if (rule.cityId === null && rule.areaId === null) return true;
      if (!location.cityId || rule.cityId !== location.cityId) return false;
      return rule.areaId === null || rule.areaId === location.areaId;
    })
    .sort((first, second) => {
      const firstSpecificity = Number(Boolean(first.areaId)) + Number(Boolean(first.cityId));
      const secondSpecificity = Number(Boolean(second.areaId)) + Number(Boolean(second.cityId));
      return secondSpecificity - firstSpecificity
        || Number(second.priority) - Number(first.priority)
        || new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
    });

  const base = Number(basePrice);
  const rule = applicable[0];
  if (!rule) return roundPrice(base);
  const value = Number(rule.adjustmentValue);
  if (rule.adjustmentType === 'fixed') return roundPrice(value);
  if (rule.adjustmentType === 'percentage') return roundPrice(base * (1 + value / 100));
  return roundPrice(base * value);
}

module.exports = { calculateEffectivePrice, roundPrice };
