/**
 * Settings Controller
 * Handles system/financial settings (Admin only)
 */

const prisma = require('../config/database');
const { sendSuccess } = require('../utils/response');

const DEFAULT_FINANCIAL = {
  id: 'default',
  taxRate: 0,
  commissionRate: 0,
  shippingValue: 0,
  deliveryCommissionRate: 0,
  printCenterCommissionRate: 0,
};

/**
 * Get financial settings (singleton). Creates default row if not exists.
 */
const getFinancialSettings = async (req, res, next) => {
  try {
    let settings = await prisma.financialSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.financialSettings.create({
        data: DEFAULT_FINANCIAL,
      });
    }

    sendSuccess(res, settings, 'Financial settings retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Update financial settings (Admin only)
 */
const updateFinancialSettings = async (req, res, next) => {
  try {
    const {
      taxRate,
      commissionRate,
      shippingValue,
      deliveryCommissionRate,
      printCenterCommissionRate,
    } = req.body;

    const data = {};
    if (typeof taxRate === 'number') data.taxRate = Math.max(0, Math.min(100, taxRate));
    if (typeof commissionRate === 'number') data.commissionRate = Math.max(0, Math.min(100, commissionRate));
    if (typeof shippingValue === 'number') data.shippingValue = Math.max(0, shippingValue);
    if (typeof deliveryCommissionRate === 'number') data.deliveryCommissionRate = Math.max(0, Math.min(100, deliveryCommissionRate));
    if (typeof printCenterCommissionRate === 'number') data.printCenterCommissionRate = Math.max(0, Math.min(100, printCenterCommissionRate));

    const settings = await prisma.financialSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...DEFAULT_FINANCIAL, ...data },
      update: data,
    });

    sendSuccess(res, settings, 'Financial settings updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinancialSettings,
  updateFinancialSettings,
};
