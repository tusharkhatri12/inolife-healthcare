const XLSX = require('xlsx');
const fs = require('fs');
const Product = require('../models/Product');

// Normalize header: lowercase, trim, replace spaces with nothing for matching
function norm(s) {
  if (s == null || typeof s !== 'string') return '';
  return s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

// Map row to Product. Accepts various column names from Excel.
const PRODUCT_COL_MAP = [
  ['name', 'productname', 'product_name', 'product', 'itemname', 'item_name'],
  ['code', 'productcode', 'product_code', 'code', 'itemcode', 'item_code', 'sku'],
  ['category', 'category', 'productcategory'],
  ['type', 'type', 'producttype', 'form', 'dosageform'],
  ['packSize', 'packsize', 'pack_size', 'packaging', 'pack'],
  ['mrp', 'mrp', 'price', 'rate', 'sellingprice'],
  ['sku', 'sku', 'skucode'],
  ['hsnCode', 'hsncode', 'hsn_code', 'hsn'],
  ['description', 'description', 'desc'],
  ['composition', 'composition', 'ingredients', 'content'],
  ['manufacturer', 'manufacturer', 'company', 'maker'],
];

// Map row to Doctor. Accepts various column names from Excel.
const DOCTOR_COL_MAP = [
  ['name', 'doctorname', 'doctor_name', 'doctor', 'name', 'drname'],
  ['specialization', 'specialization', 'speciality', 'specialty', 'department'],
  ['qualification', 'qualification', 'qualifications', 'degree'],
  ['registrationNumber', 'registrationnumber', 'reg_no', 'registration_no', 'mci', 'mcino'],
  ['phone', 'phone', 'mobile', 'contact', 'phoneno', 'mobileno'],
  ['email', 'email', 'emailid'],
  ['clinicName', 'clinicname', 'clinic_name', 'hospital', 'hospitalname', 'workplace'],
  ['address', 'address', 'address1', 'location'],
  ['area', 'area', 'locality', 'locality'],
  ['city', 'city', 'district'],
  ['state', 'state'],
  ['pincode', 'pincode', 'pin', 'zip'],
  ['category', 'category', 'class', 'classification'],
  ['notes', 'notes', 'remarks', 'note'],
];

function findCol(headers, aliases) {
  const hNorm = headers.map((h) => norm(h));
  for (const a of aliases) {
    const idx = hNorm.indexOf(norm(a));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Treat as date (Excel often exports dates as "8/1/2026" or "2026-08-01") — don't use as product name
function isDateLikeString(s) {
  if (s == null || typeof s !== 'string') return false;
  const t = String(s).trim();
  if (!t) return false;
  // e.g. 8/1/2026, 1/8/2026, 2026-08-01, 01-08-2026
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t)) return true;
  if (/^\d{2,4}-\d{1,2}-\d{1,2}$/.test(t)) return true;
  if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(t)) return true;
  return false;
}

// Generate a unique product code from name (and optional suffix for duplicates)
function generateProductCode(name, existingCodes = new Set()) {
  const base = String(name)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 30) || 'PRODUCT';
  let code = base;
  let n = 1;
  while (existingCodes.has(code)) {
    code = `${base}-${++n}`;
  }
  existingCodes.add(code);
  return code;
}

function buildProductRow(row, indices) {
  const get = (key) => {
    const i = indices[key];
    if (i == null || i < 0) return undefined;
    const v = row[i];
    if (v == null || v === '') return undefined;
    return String(v).trim();
  };
  const num = (key) => {
    const v = get(key);
    if (v == null) return undefined;
    const n = parseFloat(String(v).replace(/,/g, ''));
    return Number.isNaN(n) ? undefined : n;
  };

  // Name: from "name" column or fallback to first non-date column (Excel often puts dates in col A)
  let name = get('name') ?? (row[0] != null && String(row[0]).trim() !== '' ? String(row[0]).trim() : undefined);
  if (isDateLikeString(name)) {
    name = undefined;
    for (let c = 0; c < (row && row.length); c++) {
      const v = row[c] != null ? String(row[c]).trim() : '';
      if (v !== '' && !isDateLikeString(v)) {
        name = v;
        break;
      }
    }
  }
  if (!name || isDateLikeString(name)) return null;

  const codeFromSheet = get('code');
  const mrp = num('mrp');
  // Name and MRP required for import (MRP from Excel for stockist pricing). Code auto-generated if missing.
  if (mrp == null || mrp < 0) return null; // Skip row if no valid MRP
  const mrpVal = mrp;

  const typeValues = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Other'];
  let type = get('type');
  if (type) {
    type = typeValues.find((t) => norm(t) === norm(type)) || 'Other';
  } else {
    type = 'Tablet';
  }

  return {
    name,
    code: codeFromSheet ? codeFromSheet.toUpperCase() : null, // null = generate in import loop
    category: get('category') || undefined,
    type,
    packSize: get('packSize') || undefined,
    mrp: mrpVal,
    sku: get('sku') ? get('sku').toUpperCase() : undefined,
    hsnCode: get('hsnCode') || undefined,
    description: get('description') || undefined,
    composition: get('composition') || undefined,
    manufacturer: get('manufacturer') || 'INOLIFE HEALTHCARE',
    isActive: true,
  };
}

function buildDoctorRow(row, indices) {
  const get = (key) => {
    const i = indices[key];
    if (i == null || i < 0) return undefined;
    const v = row[i];
    if (v == null || v === '') return undefined;
    return String(v).trim();
  };

  const name = get('name');
  const specialization = get('specialization');
  const city = get('city');
  if (!name || !specialization) return null;

  const categoryValues = ['A', 'B', 'C'];
  let category = get('category');
  if (category && categoryValues.includes(category.toUpperCase())) {
    category = category.toUpperCase();
  } else {
    category = 'B';
  }

  return {
    name,
    specialization,
    qualification: get('qualification') || undefined,
    registrationNumber: get('registrationNumber') || undefined,
    phone: get('phone') || undefined,
    email: get('email') || undefined,
    clinicName: get('clinicName') || undefined,
    address: get('address') || undefined,
    area: get('area') || undefined,
    city: city || 'To be updated',
    state: get('state') || undefined,
    pincode: get('pincode') || undefined,
    category,
    notes: get('notes') || undefined,
    isActive: true,
    isApproved: true,
  };
}

/**
 * Parse Excel file and return rows as array of arrays (first row = headers).
 */
function parseExcelToRows(filePath) {
  const buf = fs.readFileSync(filePath);
  const workbook = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });
  return data;
}

/**
 * Import products from Excel file.
 * First row = headers. Column names are matched flexibly (e.g. Product Name, Name, Code, MRP, Category, Type, Pack Size, etc.).
 */
async function importProductsFromExcel(filePath, options = {}) {
  const data = parseExcelToRows(filePath);
  if (!data.length) {
    return { total: 0, created: 0, updated: 0, errors: 0, errorDetails: [] };
  }

  const headers = data[0].map((h) => (h != null ? String(h) : ''));
  const indices = {};
  PRODUCT_COL_MAP.forEach(([key, ...aliases]) => {
    indices[key] = findCol(headers, aliases);
  });

  if (indices.mrp < 0) {
    return {
      total: 0,
      created: 0,
      updated: 0,
      errors: data.length - 1,
      errorDetails: [{ row: 0, error: 'Excel must have an MRP column (e.g. "MRP" or "Price"). Product import requires Name and MRP.' }],
    };
  }

  if (options.clearExisting) {
    await Product.deleteMany({});
  }

  const stats = { total: 0, created: 0, updated: 0, errors: 0, errorDetails: [] };
  const existingCodes = new Set(await Product.distinct('code'));

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0) continue;

    stats.total++;
    const doc = buildProductRow(row, indices);
    if (!doc) {
      stats.errors++;
      const firstVal = row && row[0] != null ? String(row[0]).trim() : '';
      let hint = 'Missing product name or valid MRP';
      if (isDateLikeString(firstVal)) hint = 'First column looks like a date; use columns for Name and MRP';
      else if (indices.mrp < 0) hint = 'Excel must have an MRP column (e.g. "MRP" or "Price")';
      stats.errorDetails.push({ row: r + 1, error: hint });
      continue;
    }

    if (!doc.code) {
      doc.code = generateProductCode(doc.name, existingCodes);
      existingCodes.add(doc.code);
    }

    try {
      const existing = await Product.findOne({ code: doc.code });
      if (existing) {
        if (!options.updateExisting) {
          stats.errors++;
          stats.errorDetails.push({ row: r + 1, error: `Product code already exists: ${doc.code}` });
          continue;
        }
        Object.assign(existing, doc);
        await existing.save();
        stats.updated++;
      } else {
        await Product.create(doc);
        stats.created++;
      }
    } catch (err) {
      stats.errors++;
      stats.errorDetails.push({ row: r + 1, error: err.message });
    }
  }

  return stats;
}

/**
 * Import doctors from Excel file.
 * First row = headers. Column names matched flexibly (e.g. Doctor Name, Name, Specialization, City, Phone, etc.).
 */
async function importDoctorsFromExcel(filePath, options = {}) {
  const DoctorModel = require('../models/Doctor');
  const data = parseExcelToRows(filePath);
  if (!data.length) {
    return { total: 0, created: 0, updated: 0, errors: 0, errorDetails: [] };
  }

  const headers = data[0].map((h) => (h != null ? String(h) : ''));
  const indices = {};
  DOCTOR_COL_MAP.forEach(([key, ...aliases]) => {
    indices[key] = findCol(headers, aliases);
  });

  const stats = { total: 0, created: 0, updated: 0, errors: 0, errorDetails: [] };
  const assignedMR = options.assignedMR || null;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0) continue;

    stats.total++;
    const doc = buildDoctorRow(row, indices);
    if (!doc) {
      stats.errors++;
      stats.errorDetails.push({ row: r + 1, error: 'Missing name or specialization' });
      continue;
    }

    if (assignedMR) doc.assignedMR = assignedMR;

    try {
      let existing = null;
      if (doc.registrationNumber) {
        existing = await DoctorModel.findOne({ registrationNumber: doc.registrationNumber });
      }
      if (!existing && doc.email) {
        existing = await DoctorModel.findOne({ email: doc.email });
      }

      if (existing) {
        if (!options.updateExisting) {
          stats.errors++;
          stats.errorDetails.push({
            row: r + 1,
            error: `Doctor already exists (reg no or email): ${doc.registrationNumber || doc.email}`,
          });
          continue;
        }
        Object.assign(existing, doc);
        await existing.save();
        stats.updated++;
      } else {
        await DoctorModel.create(doc);
        stats.created++;
      }
    } catch (err) {
      stats.errors++;
      stats.errorDetails.push({ row: r + 1, error: err.message });
    }
  }

  return stats;
}

module.exports = {
  parseExcelToRows,
  importProductsFromExcel,
  importDoctorsFromExcel,
};
