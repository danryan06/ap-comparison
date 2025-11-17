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

try {
  const file = path.join(process.cwd(), 'ap_data.json');
  const raw = fs.readFileSync(file, 'utf8');
  // quick newline-in-url guard
  if (/\"datasheet_url\"\s*:\s*\"https?:\/\/[^\n]*\n/.test(raw)) {
    fail('datasheet_url contains a newline; URLs must be single-line strings.');
  }
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) fail('ap_data.json must be an array.');

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


