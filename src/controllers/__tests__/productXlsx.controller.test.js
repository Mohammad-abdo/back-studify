const ExcelJS = require('exceljs');
const { PassThrough } = require('stream');

const makeStreamRes = () => {
  const stream = new PassThrough();
  stream.headers = {};
  stream.setHeader = (k, v) => {
    stream.headers[k] = v;
  };
  return stream;
};

describe('product.controller XLSX import/export', () => {
  test('exportProductsXlsx sets workbook content-type', async () => {
    const prismaMock = {
      product: { findMany: jest.fn().mockResolvedValue([]) },
      productPricing: { findMany: jest.fn().mockResolvedValue([]) },
    };
    jest.resetModules();
    jest.doMock('../../config/database', () => prismaMock);
    const controller = require('../product.controller');

    const req = { query: {} };
    const res = makeStreamRes();

    const next = jest.fn();
    await controller.exportProductsXlsx(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.headers['Content-Type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });

  test('importProductsXlsx creates product from workbook', async () => {
    const prismaMock = {
      product: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn(),
      },
      productCategory: { findMany: jest.fn().mockResolvedValue([]) },
      productPricing: { findMany: jest.fn() },
    };

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Products');
    ws.addRow([
      'id',
      'name',
      'description',
      'categoryId',
      'isInstituteProduct',
      'basePrice',
      'pricingStrategy',
      'imageUrls',
    ]);
    ws.addRow([
      '',
      'XlsxProduct',
      'Description at least ten chars.',
      'cat-uuid-0000-0000-0000-000000000001',
      'false',
      '2',
      '',
      '[]',
    ]);
    const buffer = await wb.xlsx.writeBuffer();

    jest.resetModules();
    jest.doMock('../../config/database', () => prismaMock);
    const controller = require('../product.controller');

    const req = { file: { buffer: Buffer.from(buffer) }, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.importProductsXlsx(req, res, jest.fn());

    expect(prismaMock.product.create).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.products.createdCount).toBe(1);
  });

  test('importProductsXlsx maps categoryName to categoryId', async () => {
    const prismaMock = {
      product: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn(),
      },
      productCategory: {
        findMany: jest.fn().mockResolvedValue([{ id: 'cat1', name: 'Stationery' }]),
      },
      productPricing: { findMany: jest.fn() },
    };

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Products');
    ws.addRow([
      'id',
      'name',
      'description',
      'categoryName',
      'isInstituteProduct',
      'basePrice',
      'pricingStrategy',
      'imageUrls',
    ]);
    ws.addRow([
      '',
      'Pen',
      'Blue pen long desc',
      'Stationery',
      'false',
      '2',
      '',
      '[]',
    ]);
    const buffer = await wb.xlsx.writeBuffer();

    jest.resetModules();
    jest.doMock('../../config/database', () => prismaMock);
    const controller = require('../product.controller');

    const req = { file: { buffer: Buffer.from(buffer) }, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await controller.importProductsXlsx(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(prismaMock.product.create).toHaveBeenCalled();
    const createArgs = prismaMock.product.create.mock.calls[0][0];
    expect(createArgs.data.categoryId).toBe('cat1');
  });

  test('downloadProductsImportXlsxTemplate returns a workbook', async () => {
    const prismaMock = {
      productCategory: {
        findMany: jest.fn().mockResolvedValue([{ name: 'Stationery' }, { name: 'Electronics' }]),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: 'p1', name: 'Pen' }]),
      },
    };
    jest.resetModules();
    jest.doMock('../../config/database', () => prismaMock);
    const controller = require('../product.controller');

    const req = {};
    const res = makeStreamRes();
    const next = jest.fn();

    await controller.downloadProductsImportXlsxTemplate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.headers['Content-Type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });
});
