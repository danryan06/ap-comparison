#!/usr/bin/env node
// Finder Wi-Fi filters: generation parsing and 6 GHz detection against every AP.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { wifiGeneration, has6GHz } = require('../../ap-format.js');

const cases = [
  ['Wi-Fi 7 (2.4/5/6)', 'wifi7', true],
  ['Wi-Fi 7 (2.4/5)', 'wifi7', false],
  ['Wi-Fi 7 (2.4/5 or 2.4/6)', 'wifi7', true],
  ['Wi-Fi 7 (2.4/5 or 5/6)', 'wifi7', true],
  ['Wi-Fi 7 (5/6 Low/6 High)', 'wifi7', true],
  ['Wi-Fi 6E (2.4/5/6)', 'wifi6e', true],
  ['Wi-Fi 6 (2.4/5)', 'wifi6', false],
  ['Wi-Fi 6 (2.4/5/5)', 'wifi6', false],
  ['802.11g', '', false]
];
cases.forEach(([text, gen, six]) => {
  assert.strictEqual(wifiGeneration(text), gen, `generation of "${text}"`);
  assert.strictEqual(has6GHz(text), six, `6 GHz for "${text}"`);
});

// Every wifi_gen_radios string in the data must be one the parser has a known answer for.
const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'ap_data.json'), 'utf8'));
const known = new Set(cases.map(c => c[0]));
const unknown = [...new Set(data.map(e => e.wifi_gen_radios))].filter(v => !known.has(v));
if (unknown.length) {
  console.error(`Add Finder test cases for new wifi_gen_radios values: ${unknown.join(' | ')}`);
  process.exit(1);
}
console.log(`OK: Finder Wi-Fi parsing covers all ${known.size} wifi_gen_radios values`);
