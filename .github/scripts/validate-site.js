#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { safeUrl } = require('../../ap-format.js');

const root = process.cwd();
const errors = [];

function report(message) {
  errors.push(message);
}

function readJson(relativePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (err) {
    report(`${relativePath}: ${err.message}`);
    return null;
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function checkExternalUrl(value, label) {
  if (value == null || value === '') return;
  if (typeof value !== 'string' || !safeUrl(value)) {
    report(`${label} must be an http(s) URL.`);
  }
}

function checkLocalAsset(value, label) {
  if (value == null || value === '') return;
  if (typeof value !== 'string') {
    report(`${label} must be a URL or repository-relative path.`);
    return;
  }
  if (/^https?:\/\//i.test(value)) {
    checkExternalUrl(value, label);
    return;
  }
  const normalized = path.normalize(value);
  if (!safeUrl(value, { allowRelative: true }) || normalized.startsWith('..') || path.isAbsolute(normalized)) {
    report(`${label} has an unsafe repository-relative path.`);
    return;
  }
  if (!fs.existsSync(path.join(root, normalized))) {
    report(`${label} references missing file ${value}.`);
  }
}

const aps = readJson('ap_data.json');
const mounts = readJson('mounts.json');
['ap_template.json', 'templates/in_box_template.json', 'templates/mount_template.json'].forEach(readJson);

const apSlugs = new Set();
if (Array.isArray(aps)) {
  aps.forEach((entry, index) => {
    const label = `ap_data.json[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      report(`${label} must be an object.`);
      return;
    }
    if (typeof entry.vendor !== 'string' || !entry.vendor.trim()) report(`${label}.vendor is required.`);
    if (typeof entry.model !== 'string' || !entry.model.trim()) report(`${label}.model is required.`);
    const slug = slugify(`${entry.vendor || ''} ${entry.model || ''}`);
    if (apSlugs.has(slug)) report(`${label} duplicates AP slug ${slug}.`);
    apSlugs.add(slug);
    ['datasheet_url', 'install_guide_url', 'end_of_sale_url', 'in_box_source'].forEach(field => {
      checkExternalUrl(entry[field], `${label}.${field}`);
    });
    checkLocalAsset(entry.image_url, `${label}.image_url`);
    if (Object.prototype.hasOwnProperty.call(entry, 'in_box')) {
      if (!Array.isArray(entry.in_box)) {
        report(`${label}.in_box must be an array.`);
      } else {
        entry.in_box.forEach((item, itemIndex) => {
          const itemLabel = `${label}.in_box[${itemIndex}]`;
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            report(`${itemLabel} must be an object.`);
            return;
          }
          if (typeof item.item !== 'string' || !item.item.trim()) report(`${itemLabel}.item is required.`);
          if (item.part_number != null && (typeof item.part_number !== 'string' || !item.part_number.trim())) {
            report(`${itemLabel}.part_number must be null or a non-empty string.`);
          }
          if (item.qty != null && (!Number.isInteger(item.qty) || item.qty < 1)) {
            report(`${itemLabel}.qty must be a positive integer when present.`);
          }
        });
      }
    }
  });
} else if (aps != null) {
  report('ap_data.json must contain an array.');
}

const mountIds = new Set();
const partNumbers = new Map();
if (Array.isArray(mounts)) {
  mounts.forEach((mount, index) => {
    const label = `mounts.json[${index}]`;
    if (!mount || typeof mount !== 'object' || Array.isArray(mount)) {
      report(`${label} must be an object.`);
      return;
    }
    if (typeof mount.id !== 'string' || !mount.id.trim()) {
      report(`${label}.id is required.`);
    } else if (mountIds.has(mount.id)) {
      report(`${label}.id duplicates ${mount.id}.`);
    } else {
      mountIds.add(mount.id);
    }
    if (!Array.isArray(mount.part_numbers) || !mount.part_numbers.length) {
      report(`${label}.part_numbers must be a non-empty array.`);
    } else {
      mount.part_numbers.forEach((part, partIndex) => {
        const number = part && part.part_number;
        if (typeof number !== 'string' || !number.trim()) {
          report(`${label}.part_numbers[${partIndex}].part_number is required.`);
          return;
        }
        const prior = partNumbers.get(number);
        if (prior && prior !== mount.id) {
          report(`Part number ${number} appears in both ${prior} and ${mount.id}.`);
        }
        partNumbers.set(number, mount.id);
      });
    }
    if (!Array.isArray(mount.compatible_aps)) {
      report(`${label}.compatible_aps must be an array.`);
    } else {
      mount.compatible_aps.forEach(ap => {
        if (!apSlugs.has(ap)) report(`${label}.compatible_aps references unknown AP ${ap}.`);
      });
    }
    if (Array.isArray(mount.sources)) {
      mount.sources.forEach((source, sourceIndex) => {
        checkExternalUrl(source && source.url, `${label}.sources[${sourceIndex}].url`);
      });
    }
  });
} else if (mounts != null) {
  report('mounts.json must contain an array.');
}

const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));
htmlFiles.forEach(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const scriptPattern = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptPattern.exec(source))) {
    try {
      new Function(scriptMatch[1]);
    } catch (err) {
      report(`${file} contains invalid inline JavaScript: ${err.message}`);
    }
  }
  const assetPattern = /\b(?:src|href)="([^"]+)"/gi;
  let assetMatch;
  while ((assetMatch = assetPattern.exec(source))) {
    const reference = assetMatch[1];
    if (!reference || reference === '#' || reference.startsWith('#') || /^[a-z]+:/i.test(reference)) continue;
    const relative = reference.split(/[?#]/, 1)[0];
    if (!relative || relative.includes('${')) continue;
    const normalized = path.normalize(relative);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) continue;
    if (!fs.existsSync(path.join(root, normalized))) {
      report(`${file} references missing local file ${relative}.`);
    }
  }
});

// Product photos display at most a few hundred pixels tall; keep the repo and page weight down.
const MAX_IMAGE_BYTES = 600 * 1024;
const MAX_FAVICON_BYTES = 50 * 1024;
function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const full = path.join(dir, item.name);
    return item.isDirectory() ? walkFiles(full) : [full];
  });
}
walkFiles(path.join(root, 'images')).forEach(file => {
  const size = fs.statSync(file).size;
  if (size > MAX_IMAGE_BYTES) {
    report(`${path.relative(root, file)} is ${Math.round(size / 1024)} KB; resize to 1200 px on the long side (limit ${MAX_IMAGE_BYTES / 1024} KB).`);
  }
});
if (fs.statSync(path.join(root, 'favicon.png')).size > MAX_FAVICON_BYTES) {
  report(`favicon.png is over ${MAX_FAVICON_BYTES / 1024} KB; use a 64 px icon.`);
}

if (errors.length) {
  errors.forEach(error => console.error(error));
  process.exit(1);
}

console.log(`Site validation passed (${aps.length} APs, ${mounts.length} mounts, ${htmlFiles.length} HTML files).`);
