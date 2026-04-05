/**
 * Settings Controller
 * Handles system/financial settings (Admin only)
 */

const settingsService = require('../services/settingsService');
const { sendSuccess } = require('../utils/response');

const getFinancialSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getFinancialSettings();
    sendSuccess(res, settings, 'Financial settings retrieved');
  } catch (error) {
    next(error);
  }
};

const updateFinancialSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updateFinancialSettings(req.body);
    sendSuccess(res, settings, 'Financial settings updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinancialSettings,
  updateFinancialSettings,
};
