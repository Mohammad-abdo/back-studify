const { Readable } = require('stream');
const csvParser = require('csv-parser');

const MAX_ROWS = 5000;

const toBool = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  const v = String(value).trim().toLowerCase();
  if (v === '') return undefined;
  if (['true', '1', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', 'no', 'n'].includes(v)) return false;
  return undefined;
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toIntOrNull = (value) => {
  const n = toNumberOrNull(value);
  if (n === null) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
};

const toJsonArrayStringOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  if (v === '') return null;
  try {
    const parsed = JSON.parse(v);
    if (!Array.isArray(parsed)) return null;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
};

const parseCsvBuffer = async (buffer) => {
  const rows = [];
  const stream = Readable.from(buffer);

  return new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on('data', (data) => {
        if (rows.length >= MAX_ROWS) return;
        rows.push(data);
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
};

module.exports = {
  MAX_ROWS,
  toBool,
  toNumberOrNull,
  toIntOrNull,
  toJsonArrayStringOrNull,
  parseCsvBuffer,
};

