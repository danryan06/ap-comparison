#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const TAXONOMY_PATH = path.join(ROOT, 'data', 'antenna-compatibility', 'taxonomy.json');
const SOURCE_PATH = path.join(ROOT, 'data', 'antenna-compatibility', 'ap_rf_profiles_source.json');
const EXPORT_DIR = path.join(ROOT, 'exports', 'antenna-compatibility', 'v1');
const EXPORT_PATH = path.join(EXPORT_DIR, 'ap-profiles.json');
const SCHEMA_PATH = path.join(EXPORT_DIR, 'ap-profiles.schema.json');
const AP_DATA_PATH = path.join(ROOT, 'ap_data.json');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function vendorNamespace(vendor) {
  return String(vendor || '')
    .toLowerCase()
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function modelSlug(model) {
  return String(model || '')
    .toLowerCase()
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function makeApId(vendor, model) {
  return `${vendorNamespace(vendor)}:${modelSlug(model)}`;
}

function isExternalCapable(entry) {
  const types = Array.isArray(entry.antenna_type)
    ? entry.antenna_type
    : entry.antenna_type == null || entry.antenna_type === ''
      ? []
      : [entry.antenna_type];
  return types.some(t => String(t).toLowerCase() === 'external');
}

function bandsFromWifiGen(wifiGenRadios) {
  const text = String(wifiGenRadios || '').toLowerCase();
  const bands = [];
  if (/\b2\.4\b/.test(text)) bands.push('2.4');
  if (/\b5\b/.test(text)) bands.push('5');
  if (/\b6\b/.test(text)) bands.push('6');
  return bands;
}

function deepSortKeys(value) {
  if (Array.isArray(value)) return value.map(deepSortKeys);
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).sort().forEach(key => {
      out[key] = deepSortKeys(value[key]);
    });
    return out;
  }
  return value;
}

const NON_WIFI_PURPOSES = new Set(['gnss', 'lorawan', 'lte', 'iot', 'other']);

function collectMissing(profile) {
  const missing = new Set(profile.completeness && Array.isArray(profile.completeness.missing)
    ? profile.completeness.missing
    : []);
  const taxonomy = loadTaxonomyCached();
  const configs = profile.antenna_configurations || [];
  configs.forEach(cfg => {
    (cfg.external_interfaces || []).forEach(iface => {
      const base = `antenna_configurations.${cfg.configuration_id}.external_interfaces.${iface.interface_id}`;
      const family = iface.connector && iface.connector.family;
      if (!family) missing.add(`${base}.connector.family`);
      if (
        family &&
        taxonomy.standard_connector_families.includes(family) &&
        (iface.connector.gender == null || iface.connector.gender === '')
      ) {
        missing.add(`${base}.connector.gender`);
      }
      if (
        family &&
        taxonomy.proprietary_connector_families.includes(family) &&
        (iface.connector.variant == null || iface.connector.variant === '')
      ) {
        missing.add(`${base}.connector.variant`);
      }
      if (family === 'vendor-proprietary' && iface.connector.variant === 'unpublished') {
        missing.add(`${base}.connector.family`);
      }
      const groups = iface.path_groups || [];
      const wifiFacing = !NON_WIFI_PURPOSES.has(iface.purpose);
      if (!groups.length) {
        missing.add(`${base}.path_groups`);
      } else if (wifiFacing) {
        groups.forEach(group => {
          if (!Array.isArray(group.bands) || group.bands.length === 0) {
            missing.add(`${base}.path_groups.${group.path_group_id}.bands`);
          }
        });
      }
      if (!Array.isArray(iface.source_ids) || iface.source_ids.length === 0) {
        missing.add(`${base}.source_ids`);
      }
    });
  });
  return [...missing].sort();
}

let _taxonomy;
function loadTaxonomyCached() {
  if (!_taxonomy) _taxonomy = loadJson(TAXONOMY_PATH);
  return _taxonomy;
}

function finalizeProfile(profile) {
  const missing = collectMissing(profile);
  const status = missing.length ? 'incomplete' : 'complete';
  return {
    ...profile,
    completeness: {
      status,
      missing
    }
  };
}

module.exports = {
  ROOT,
  TAXONOMY_PATH,
  SOURCE_PATH,
  EXPORT_DIR,
  EXPORT_PATH,
  SCHEMA_PATH,
  AP_DATA_PATH,
  loadJson,
  writeJson,
  stableStringify,
  vendorNamespace,
  modelSlug,
  makeApId,
  isExternalCapable,
  bandsFromWifiGen,
  deepSortKeys,
  finalizeProfile,
  loadTaxonomyCached
};
