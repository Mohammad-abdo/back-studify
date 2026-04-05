const settingsRepository = require('../repositories/settingsRepository');

const DEFAULT_FINANCIAL = {
  id: 'default',
  taxRate: 0,
  commissionRate: 0,
  shippingValue: 0,
  deliveryCommissionRate: 0,
  printCenterCommissionRate: 0,
};

const getFinancialSettings = async () => {
  let settings = await settingsRepository.findFinancialSettings();

  if (!settings) {
    settings = await settingsRepository.createFinancialSettings(DEFAULT_FINANCIAL);
  }

  return settings;
};

const updateFinancialSettings = async ({
  taxRate,
  commissionRate,
  shippingValue,
  deliveryCommissionRate,
  printCenterCommissionRate,
}) => {
  const data = {};
  if (typeof taxRate === 'number') data.taxRate = Math.max(0, Math.min(100, taxRate));
  if (typeof commissionRate === 'number') data.commissionRate = Math.max(0, Math.min(100, commissionRate));
  if (typeof shippingValue === 'number') data.shippingValue = Math.max(0, shippingValue);
  if (typeof deliveryCommissionRate === 'number') data.deliveryCommissionRate = Math.max(0, Math.min(100, deliveryCommissionRate));
  if (typeof printCenterCommissionRate === 'number') data.printCenterCommissionRate = Math.max(0, Math.min(100, printCenterCommissionRate));

  return settingsRepository.upsertFinancialSettings(
    { id: 'default', ...DEFAULT_FINANCIAL, ...data },
    data,
  );
};

module.exports = {
  getFinancialSettings,
  updateFinancialSettings,
};
