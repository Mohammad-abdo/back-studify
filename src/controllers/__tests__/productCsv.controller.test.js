const { Buffer } = require('buffer');

const makeRes = () => {
  const chunks = [];
  return {
    headers: {},
    setHeader: function (k, v) {
      this.headers[k] = v;
    },
    write: function (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    },
    end: function (chunk) {
      if (chunk !== undefined) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
    },
    getBody: () => Buffer.concat(chunks).toString('utf8'),
  };
};

describe('product.controller CSV import/export', () => {
  test('downloadProductsCsvTemplate returns a CSV template', async () => {
    const prismaMock = {};
    jest.resetModules();
    jest.doMock('../../config/database', () => prismaMock);

    const controller = require('../product.controller');
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    await controller.downloadProductsCsvTemplate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.headers['Content-Type']).toContain('text/csv');
    expect(res.getBody()).toContain('id,name,description,categoryId,isInstituteProduct,basePrice,pricingStrategy,imageUrls');
  });

  test('exportProductsCsv writes header + records', async () => {
    const prismaMock = {
      productCategory: { findUnique: jest.fn() },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'p1',
            name: 'Pen',
            description: 'Blue pen',
            categoryId: 'c1',
            isInstituteProduct: false,
            basePrice: 1.5,
            pricingStrategy: null,
            imageUrls: '["a"]',
          },
        ]),
      },
    };

    jest.resetModules();
    jest.doMock('../../config/database', () => prismaMock);

    const controller = require('../product.controller');
    const req = { query: {} };
    const res = makeRes();
    const next = jest.fn();

    await controller.exportProductsCsv(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.headers['Content-Type']).toContain('text/csv');
    const body = res.getBody();
    expect(body).toContain('id,name,description,categoryId,isInstituteProduct,basePrice,pricingStrategy,imageUrls');
    // csv-writer will escape quotes inside JSON strings
    expect(body).toContain('p1,Pen,Blue pen,c1,false,1.5,,');
    expect(body).toContain('a');
  });

  test('importProductsCsv creates/updates and reports errors', async () => {
    const prismaMock = {
      product: {
        findUnique: jest.fn()
          .mockResolvedValueOnce({ id: 'existing' }) // for first row
          .mockResolvedValueOnce(null), // for second row with id=newid
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
    };

    jest.resetModules();
    jest.doMock('../../config/database', () => prismaMock);

    const controller = require('../product.controller');

    const csv = [
      'id,name,description,categoryId,isInstituteProduct,basePrice,pricingStrategy,imageUrls',
      'existing,Item A,Desc A,cat1,false,10,,[]',
      'newid,Item B,Desc B,cat1,true,,FIXED_TIERS,[]',
      ',,Missing desc,cat1,false,5,,[]',
    ].join('\n');

    const req = { file: { buffer: Buffer.from(csv) }, query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await controller.importProductsCsv(req, res, next);
    expect(next).not.toHaveBeenCalled();

    const payload = res.json.mock.calls[0][0];
    expect(payload.data.createdCount).toBe(1);
    expect(payload.data.updatedCount).toBe(1);
    expect(payload.data.skippedCount).toBe(1);
    expect(payload.data.errors.length).toBe(1);
    expect(prismaMock.product.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.product.create).toHaveBeenCalledTimes(1);
  });

  test('importProductPricingCsv replace mode deletes then creates', async () => {
    const prismaMock = {
      productPricing: {
        deleteMany: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
    };

    jest.resetModules();
    jest.doMock('../../config/database', () => prismaMock);

    const controller = require('../product.controller');

    const csv = [
      'id,productId,minQuantity,maxQuantity,price,fixedPrice,discountPercent',
      ',p1,1,10,100,,',
      ',p1,11,,90,,',
    ].join('\n');

    const req = { file: { buffer: Buffer.from(csv) }, query: { replace: 'true' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await controller.importProductPricingCsv(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(prismaMock.productPricing.deleteMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.productPricing.create).toHaveBeenCalledTimes(2);

    const payload = res.json.mock.calls[0][0];
    expect(payload.data.createdCount).toBe(2);
    expect(payload.data.skippedCount).toBe(0);
  });
});

