/**
 * Excel (.xlsx) helpers for product + pricing import/export (exceljs).
 */

const path = require('path');
const fs = require('fs').promises;
const ExcelJS = require('exceljs');
const config = require('../config/env');
const { generateFileName } = require('./helpers');
const { getFileUrl, getFilePath } = require('../services/fileUpload.service');
const {
  toBool,
  toNumberOrNull,
  toIntOrNull,
  toJsonArrayStringOrNull,
} = require('./productCsv');

const SHEET_PRODUCTS = 'Products';
const SHEET_PRICING = 'ProductPricing';
const SHEET_LISTS = '_lists';

const PRICING_STRATEGIES = ['FIXED_TIERS', 'DISCOUNT_TIERS'];
const XLSX_VALIDATION_MAX_ROWS = 5000;

const PRODUCT_HEADERS = [
  'id',
  'name',
  'description',
  'categoryId',
  'isInstituteProduct',
  'basePrice',
  'pricingStrategy',
  'imageUrls',
];

const ensurePricingStrategiesNamedRange = (workbook) => {
  // Excel data validation list separators vary by locale; using a named range is robust.
  const existing = workbook.getWorksheet(SHEET_LISTS);
  const ws = existing || workbook.addWorksheet(SHEET_LISTS, { state: 'veryHidden' });
  if (!existing) {
    ws.getColumn(1).width = 28;
  }

  // Populate A1..An with strategies (idempotent overwrite).
  for (let i = 0; i < PRICING_STRATEGIES.length; i++) {
    ws.getCell(i + 1, 1).value = PRICING_STRATEGIES[i];
  }

  // Define / overwrite a workbook-level named range.
  const range = `${SHEET_LISTS}!$A$1:$A$${PRICING_STRATEGIES.length}`;
  workbook.definedNames.add('PricingStrategies', range);
};

const applyProductsSheetValidations = (workbook, worksheet) => {
  ensurePricingStrategiesNamedRange(workbook);

  // pricingStrategy column is "G" (7th column) in PRODUCT_HEADERS.
  const range = `G2:G${XLSX_VALIDATION_MAX_ROWS}`;
  worksheet.dataValidations.add(range, {
    type: 'list',
    allowBlank: true,
    showDropDown: false, // show the in-cell dropdown arrow
    showErrorMessage: true,
    errorStyle: 'error',
    errorTitle: 'Invalid pricingStrategy',
    error: `Choose one of: ${PRICING_STRATEGIES.join(', ')}`,
    formulae: ['=PricingStrategies'],
  });
};

const PRICING_HEADERS = [
  'id',
  'productId',
  'minQuantity',
  'maxQuantity',
  'price',
  'fixedPrice',
  'discountPercent',
];

const MAX_XLSX_BYTES = 25 * 1024 * 1024;
const MAX_EMBEDDED_IMAGES = 500;

const ensureUploadDir = async () => {
  try {
    await fs.access(config.uploadDir);
  } catch {
    await fs.mkdir(config.uploadDir, { recursive: true });
  }
};

/**
 * Save raw image bytes to uploads dir (same pattern as multer disk uploads).
 */
const saveImageBuffer = async (buffer, extension) => {
  const extRaw = (extension || 'png').toLowerCase().replace(/^\./, '');
  const ext =
    extRaw === 'jpg' || extRaw === 'jpeg'
      ? 'jpeg'
      : ['png', 'gif', 'webp'].includes(extRaw)
        ? extRaw
        : 'png';
  await ensureUploadDir();
  const originalName = `import_image.${ext}`;
  const filename = generateFileName(originalName);
  const dest = path.join(config.uploadDir, filename);
  await fs.writeFile(dest, buffer);
  return getFileUrl(filename);
};

const cellText = (cell) => {
  if (cell == null) return '';
  const v = cell.value;
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }
  if (typeof v === 'object' && v.text != null) return String(v.text);
  if (typeof v === 'object' && v.result != null) return String(v.result);
  return String(v);
};

const readHeaderMap = (worksheet) => {
  const headerRow = worksheet.getRow(1);
  const map = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = cellText(cell).trim();
    if (key) map[colNumber] = key;
  });
  return map;
};

const readRowsAsObjects = (worksheet, expectedKeys) => {
  const colToKey = readHeaderMap(worksheet);
  const rows = [];
  const lastRow = worksheet.rowCount || 0;
  for (let r = 2; r <= lastRow; r++) {
    const row = worksheet.getRow(r);
    let empty = true;
    const obj = {};
    for (const key of expectedKeys) {
      obj[key] = '';
    }
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = colToKey[colNumber];
      if (!key) return;
      const t = cellText(cell).trim();
      if (t) empty = false;
      obj[key] = t;
    });
    if (!empty) rows.push({ sheetRow: r, data: obj });
  }
  return rows;
};

/**
 * Excel row number (1-based) from an embedded image's top-left anchor.
 */
const anchorExcelRow = (image) => {
  const tl = image.range && image.range.tl;
  if (!tl) return null;
  if (typeof tl.row === 'number') return Math.floor(tl.row) + 1;
  if (tl.nativeRow !== undefined) return tl.nativeRow + 1;
  return null;
};

/**
 * Map sheet row -> list of uploaded image URLs from embedded drawings on Products sheet.
 */
const extractEmbeddedImagesByRow = async (workbook, productsWorksheet, imageErrors) => {
  const byRow = new Map();
  const images = productsWorksheet.getImages();
  let saved = 0;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (saved >= MAX_EMBEDDED_IMAGES) {
      imageErrors.push({ message: `Too many embedded images (max ${MAX_EMBEDDED_IMAGES})` });
      break;
    }
    const medium = workbook.getImage(img.imageId);
    if (!medium || !medium.buffer) {
      imageErrors.push({ message: `Image index ${i}: missing buffer in workbook` });
      continue;
    }
    const ext = medium.extension || 'png';
    const excelRow = anchorExcelRow(img);
    if (excelRow == null || excelRow < 1) {
      imageErrors.push({ message: `Image index ${i}: could not resolve anchor row` });
      continue;
    }
    if (excelRow < 2) {
      imageErrors.push({ message: `Image index ${i}: anchored on header row (${excelRow}); skipped` });
      continue;
    }
    try {
      const url = await saveImageBuffer(medium.buffer, ext);
      if (!byRow.has(excelRow)) byRow.set(excelRow, []);
      byRow.get(excelRow).push(url);
      saved++;
    } catch (e) {
      imageErrors.push({ message: `Image index ${i}: ${e.message || 'save failed'}` });
    }
  }
  return byRow;
};

const mergeImageUrlsCellAndEmbedded = (cellJson, embeddedUrls) => {
  const fromCell = toJsonArrayStringOrNull(cellJson);
  let arr = [];
  if (fromCell) {
    try {
      arr = JSON.parse(fromCell);
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = [];
    }
  }
  const merged = [...arr, ...(embeddedUrls || [])];
  const seen = new Set();
  const deduped = [];
  for (const u of merged) {
    if (typeof u !== 'string' || !u.trim()) continue;
    const s = u.trim();
    if (seen.has(s)) continue;
    seen.add(s);
    deduped.push(s);
  }
  return deduped.length ? JSON.stringify(deduped) : null;
};

const parseWorkbookFromBuffer = async (buffer) => {
  if (!buffer || buffer.length > MAX_XLSX_BYTES) {
    throw new Error(`Workbook too large (max ${MAX_XLSX_BYTES} bytes)`);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
};

const buildProductsSheet = (worksheet, products) => {
  worksheet.addRow(PRODUCT_HEADERS);
  for (const p of products) {
    worksheet.addRow([
      p.id,
      p.name,
      p.description,
      p.categoryId,
      p.isInstituteProduct ? 'TRUE' : 'FALSE',
      p.basePrice ?? '',
      p.pricingStrategy ?? '',
      p.imageUrls ?? '',
    ]);
  }
  const wb = worksheet && worksheet.workbook;
  if (wb) applyProductsSheetValidations(wb, worksheet);
};

const buildPricingSheet = (worksheet, tiers) => {
  worksheet.addRow(PRICING_HEADERS);
  for (const t of tiers) {
    worksheet.addRow([
      t.id,
      t.productId,
      t.minQuantity,
      t.maxQuantity ?? '',
      t.price,
      t.fixedPrice ?? '',
      t.discountPercent ?? '',
    ]);
  }
};

/**
 * Try to embed first local image from imageUrls JSON into column I (0-based col 8) for each data row.
 */
const embedLocalImagesOnProductsSheet = async (workbook, worksheet, products) => {
  const dataStartRow = 2;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const excelRow = dataStartRow + i;
    if (!p.imageUrls) continue;
    let urls = [];
    try {
      urls = JSON.parse(p.imageUrls);
    } catch {
      continue;
    }
    if (!Array.isArray(urls) || urls.length === 0) continue;
    const first = urls.find((u) => typeof u === 'string');
    if (!first) continue;
    let filename = null;
    if (first.includes('/uploads/')) {
      filename = first.split('/uploads/').pop();
    } else if (first.startsWith('http') && first.includes('/uploads/')) {
      try {
        const u = new URL(first);
        const idx = u.pathname.indexOf('/uploads/');
        if (idx >= 0) filename = u.pathname.slice(idx + '/uploads/'.length);
      } catch {
        /* ignore */
      }
    }
    if (!filename || filename.includes('..')) continue;
    const filePath = getFilePath(filename);
    let buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      continue;
    }
    const lower = filename.toLowerCase();
    let extension = 'png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) extension = 'jpeg';
    else if (lower.endsWith('.gif')) extension = 'gif';
    else if (lower.endsWith('.webp')) extension = 'webp';
    else if (lower.endsWith('.png')) extension = 'png';
    try {
      const imageId = workbook.addImage({ buffer, extension });
      worksheet.addImage(imageId, {
        tl: { col: 8, row: excelRow - 1 },
        ext: { width: 120, height: 120 },
      });
    } catch {
      /* skip embed failure */
    }
  }
};

module.exports = {
  SHEET_PRODUCTS,
  SHEET_PRICING,
  SHEET_LISTS,
  PRODUCT_HEADERS,
  PRICING_HEADERS,
  MAX_XLSX_BYTES,
  MAX_EMBEDDED_IMAGES,
  parseWorkbookFromBuffer,
  readRowsAsObjects,
  extractEmbeddedImagesByRow,
  mergeImageUrlsCellAndEmbedded,
  buildProductsSheet,
  buildPricingSheet,
  embedLocalImagesOnProductsSheet,
  cellText,
};
