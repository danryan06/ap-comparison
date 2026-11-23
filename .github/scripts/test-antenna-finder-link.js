#!/usr/bin/env node
'use strict';

// Every AP that takes external antennas links to the AntennaComparison Finder,
// and the ap_id in that link must exist in the antenna-compatibility export
// (otherwise the Finder opens with "AP profile unavailable").
const assert = require('assert');
const path = require('path');
const fmt = require('../../ap-format.js');
const { makeApId, isExternalCapable } = require('./lib/ap-rf-common.js');

const root = path.join(__dirname, '..', '..');
const aps = require(path.join(root, 'ap_data.json'));
const exportProfiles = require(path.join(root, 'exports', 'antenna-compatibility', 'v1', 'ap-profiles.json')).profiles;
const exported = new Set(exportProfiles.map(p => p.ap_id));

let linked = 0;
aps.forEach(entry => {
  const label = `${entry.vendor} ${entry.model}`;
  const href = fmt.antennaFinderHref(entry);
  if (!isExternalCapable(entry)) {
    assert.strictEqual(href, '', `${label}: internal-only AP must not link to the antenna Finder`);
    return;
  }
  const apId = fmt.antennaCompatApId(entry.vendor, entry.model);
  assert.strictEqual(apId, makeApId(entry.vendor, entry.model), `${label}: browser ap_id drifted from makeApId`);
  assert.ok(exported.has(apId), `${label}: ${apId} is not in exports/antenna-compatibility/v1/ap-profiles.json`);
  const url = new URL(href);
  assert.strictEqual(`${url.origin}${url.pathname}`, fmt.ANTENNA_FINDER_URL);
  assert.strictEqual(url.searchParams.get('ap'), apId);
  linked += 1;
});

assert.ok(linked > 0, 'expected at least one external-antenna AP');
console.log(`OK: ${linked} external-antenna APs link to the AntennaComparison Finder with exported ap_ids`);
