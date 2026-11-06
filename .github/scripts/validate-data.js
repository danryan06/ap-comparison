#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function normalizeForSlug(s) {
  if (!s) return '';
  return String(s).toLowerCase().trim().replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, ' ');
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const ANTENNA_TYPES = new Set(['Internal', 'Directional', 'External']);
const BAND_KEYS = ['2.4', '5', '5-lower', '5-upper', '6'];
const BAND_KEY_SET = new Set(BAND_KEYS);
const OPTIONAL_STRING_FIELDS = ['hazloc_certification', 'operating_humidity', 'ingress_protection'];

function entryName(entry, idx) {
  return `index ${idx} (${entry.vendor} ${entry.model})`;
}

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function checkBandMap(entry, idx, path, obj, valueKind) {
  if (!isPlainObject(obj)) fail(`${entryName(entry, idx)} ${path} must be an object.`);
  const keys = Object.keys(obj);
  if (!keys.length) fail(`${entryName(entry, idx)} ${path} is empty.`);
  keys.forEach(key => {
    if (!BAND_KEY_SET.has(key)) {
      fail(`${entryName(entry, idx)} ${path} has band key "${key}". Allowed keys: ${BAND_KEYS.join(', ')}.`);
    }
    const value = obj[key];
    if (valueKind === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        fail(`${entryName(entry, idx)} ${path}.${key} must be a number.`);
      }
    } else if (typeof value !== 'string' || !value.trim()) {
      fail(`${entryName(entry, idx)} ${path}.${key} must be a non-empty string.`);
    }
  });
}

function checkAntennaType(entry, idx) {
  const value = entry.antenna_type;
  const pendingT350se = entry.vendor === 'Ruckus' && entry.model === 'T350se' && value === 'Directional';
  if (typeof value === 'string') {
    if (!pendingT350se) {
      fail(`${entryName(entry, idx)} antenna_type must be an array of Internal, Directional, and/or External. The only allowed string is Ruckus T350se, pending review.`);
    }
    return;
  }
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${entryName(entry, idx)} antenna_type must be a non-empty array.`);
  }
  const seen = new Set();
  value.forEach(item => {
    if (!ANTENNA_TYPES.has(item)) {
      fail(`${entryName(entry, idx)} antenna_type contains "${item}". Allowed values: Internal, Directional, External.`);
    }
    if (seen.has(item)) fail(`${entryName(entry, idx)} antenna_type repeats "${item}".`);
    seen.add(item);
  });
}

function checkAntennaModes(entry, idx) {
  if (entry.antenna_modes == null) return;
  if (!Array.isArray(entry.antenna_modes)) fail(`${entryName(entry, idx)} antenna_modes must be an array.`);
  entry.antenna_modes.forEach((mode, modeIndex) => {
    const path = `antenna_modes[${modeIndex}]`;
    if (!isPlainObject(mode)) fail(`${entryName(entry, idx)} ${path} must be an object.`);
    Object.keys(mode).forEach(key => {
      if (!['mode', 'antenna_gain_dbi', 'beamwidth'].includes(key)) {
        fail(`${entryName(entry, idx)} ${path} has unexpected field "${key}".`);
      }
    });
    if (typeof mode.mode !== 'string' || !mode.mode.trim()) {
      fail(`${entryName(entry, idx)} ${path}.mode is required.`);
    }
    if (mode.antenna_gain_dbi != null) checkBandMap(entry, idx, `${path}.antenna_gain_dbi`, mode.antenna_gain_dbi, 'number');
    if (mode.beamwidth != null) checkBandMap(entry, idx, `${path}.beamwidth`, mode.beamwidth, 'string');
  });
}

function checkBeamwidth(entry, idx) {
  if (entry.beamwidth == null) return;
  if (!isPlainObject(entry.beamwidth)) fail(`${entryName(entry, idx)} beamwidth must be an object.`);
  const values = Object.values(entry.beamwidth);
  if (!values.length) fail(`${entryName(entry, idx)} beamwidth is empty.`);
  const nested = values.every(value => isPlainObject(value));
  const flat = values.every(value => typeof value === 'string');
  if (nested) {
    Object.entries(entry.beamwidth).forEach(([mode, bands]) => {
      if (!String(mode).trim()) fail(`${entryName(entry, idx)} beamwidth has an empty mode name.`);
      checkBandMap(entry, idx, `beamwidth.${mode}`, bands, 'string');
    });
    return;
  }
  if (flat) {
    checkBandMap(entry, idx, 'beamwidth', entry.beamwidth, 'string');
    return;
  }
  fail(`${entryName(entry, idx)} beamwidth must be a flat band map or an object of named modes.`);
}

function checkOptionalStrings(entry, idx) {
  OPTIONAL_STRING_FIELDS.forEach(field => {
    if (entry[field] == null) return;
    if (typeof entry[field] !== 'string' || !entry[field].trim()) {
      fail(`${entryName(entry, idx)} ${field} must be a non-empty string when present.`);
    }
  });
}

try {
  const file = path.join(process.cwd(), 'ap_data.json');
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) fail('ap_data.json must be an array.');

  data.forEach((entry, idx) => {
    if (typeof entry.datasheet_url === 'string') {
      if (/\r|\n/.test(entry.datasheet_url)) {
        fail(`Entry index ${idx} (${entry.vendor} ${entry.model}) has a datasheet_url containing a newline; URLs must be single-line strings.`);
      }
    }
    checkAntennaType(entry, idx);
    checkAntennaModes(entry, idx);
    checkBeamwidth(entry, idx);
    checkOptionalStrings(entry, idx);
  });

  const slugToIndexes = new Map();
  data.forEach((e, idx) => {
    const slug = `${normalizeForSlug(e.vendor)}|${normalizeForSlug(e.model)}`;
    const arr = slugToIndexes.get(slug) || [];
    arr.push(idx);
    slugToIndexes.set(slug, arr);
  });
  const dups = Array.from(slugToIndexes.entries()).filter(([, idxs]) => idxs.length > 1);
  if (dups.length) {
    console.error('Duplicate vendor+model slugs detected:');
    dups.forEach(([slug, idxs]) => console.error(`  ${slug} at indexes ${idxs.join(', ')}`));
    process.exit(2);
  }

  console.log('ap_data.json validation passed.');
  process.exit(0);
} catch (err) {
  fail(`Validation failed: ${err.message}`);
}


