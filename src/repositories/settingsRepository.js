const prisma = require('../config/database');

const findFinancialSettings = () =>
  prisma.financialSettings.findUnique({
    where: { id: 'default' },
  });

const createFinancialSettings = (data) =>
  prisma.financialSettings.create({
    data,
  });

const upsertFinancialSettings = (createData, updateData) =>
  prisma.financialSettings.upsert({
    where: { id: 'default' },
    create: createData,
    update: updateData,
  });

module.exports = {
  findFinancialSettings,
  createFinancialSettings,
  upsertFinancialSettings,
};
