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

// Finder PoE and uplink filters.
const { poeLevel, fastestPortGbps } = require('../../ap-format.js');
[
  ['802.3af (Class 3)', 1], ['802.3at (Class 4)', 2], ['802.3bt (Class 6)', 3],
  ['PoE++ (802.3bt)', 3], ['N/A', 0]
].forEach(([text, level]) => assert.strictEqual(poeLevel(text), level, `poeLevel("${text}")`));
[
  ['1× 100M/1/2.5/5 GbE (RJ45, PoE in) + 1× 1 GbE (RJ45, PoE out)', 5],
  ['2× 1 GbE (PoE-in on Eth0)', 1],
  ['1× 100M/1/2.5 GbE (RJ45, PoE in) + 1× 10 GbE SFP+', 10],
  ['1× 10/100 WAN 4× 10/100 LAN', 0]
].forEach(([text, gbps]) => assert.strictEqual(fastestPortGbps(text), gbps, `fastestPortGbps("${text}")`));
const noSpeed = data.filter(e => fastestPortGbps(e.ethernet_ports_speed) === 0 && poeLevel(e.min_poe_class) !== 0);
if (noSpeed.length) {
  console.error(`Uplink filter cannot read ethernet_ports_speed for: ${noSpeed.map(e => `${e.vendor} ${e.model}`).join(', ')}`);
  process.exit(1);
}
console.log('OK: Finder PoE and uplink parsing');
