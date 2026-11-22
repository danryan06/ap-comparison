#!/usr/bin/env node
'use strict';

const fs = require('fs');
const {
  TAXONOMY_PATH,
  SOURCE_PATH,
  EXPORT_PATH,
  SCHEMA_PATH,
  AP_DATA_PATH,
  loadJson,
  isExternalCapable,
  makeApId,
  finalizeProfile,
  loadTaxonomyCached,
  stableStringify
} = require('./lib/ap-rf-common');
const { buildProfiles } = require('./lib/build-ap-rf-source');
const { publicProfile, buildSchema } = require('./generate-ap-rf-export');

const errors = [];

function fail(msg) {
  errors.push(msg);
}

function assert(condition, msg) {
  if (!condition) fail(msg);
}

function validateProfile(profile, taxonomy, label) {
  assert(typeof profile.ap_id === 'string' && /^[a-z0-9-]+:[a-z0-9-]+$/.test(profile.ap_id), `${label}: invalid ap_id`);
  assert(typeof profile.hardware_profile_id === 'string' && profile.hardware_profile_id, `${label}: hardware_profile_id required`);
  assert(taxonomy.antenna_architectures.includes(profile.antenna_architecture), `${label}: bad antenna_architecture`);
  assert(Array.isArray(profile.antenna_configurations), `${label}: antenna_configurations must be array`);
  assert(profile.completeness && taxonomy.completeness_statuses.includes(profile.completeness.status), `${label}: bad completeness.status`);
  assert(Array.isArray(profile.completeness.missing), `${label}: completeness.missing must be array`);

  const sourceIds = new Set((profile.rf_sources || []).map(s => s.source_id));
  const configIds = new Set();
  let defaultCount = 0;
  let externalInterfaceCount = 0;

  (profile.antenna_configurations || []).forEach(cfg => {
    assert(cfg.configuration_id, `${label}: configuration_id required`);
    assert(!configIds.has(cfg.configuration_id), `${label}: duplicate configuration_id ${cfg.configuration_id}`);
    configIds.add(cfg.configuration_id);
    if (cfg.is_default) defaultCount += 1;

    (cfg.active_bands || []).forEach(band => {
      assert(taxonomy.bands.includes(band), `${label} ${cfg.configuration_id}: bad active band ${band}`);
    });

    const ifaceIds = new Set();
    (cfg.external_interfaces || []).forEach(iface => {
      externalInterfaceCount += 1;
      assert(iface.interface_id, `${label}: interface_id required`);
      assert(!ifaceIds.has(iface.interface_id), `${label}: duplicate interface_id ${iface.interface_id}`);
      ifaceIds.add(iface.interface_id);
      assert(taxonomy.purposes.includes(iface.purpose), `${label}.${iface.interface_id}: bad purpose`);
      assert(taxonomy.requirements.includes(iface.requirement), `${label}.${iface.interface_id}: bad requirement`);
      assert(taxonomy.attachments.includes(iface.attachment), `${label}.${iface.interface_id}: bad attachment`);
      assert(iface.connector && taxonomy.connector_families.includes(iface.connector.family), `${label}.${iface.interface_id}: bad connector.family`);
      assert(Number.isInteger(iface.connector_count) && iface.connector_count >= 1, `${label}.${iface.interface_id}: connector_count`);
      assert(Number.isInteger(iface.rf_path_count) && iface.rf_path_count >= 1, `${label}.${iface.interface_id}: rf_path_count`);

      if (taxonomy.proprietary_connector_families.includes(iface.connector.family)) {
        assert(iface.connector.variant, `${label}.${iface.interface_id}: proprietary connector requires variant`);
      }

      const groups = iface.path_groups || [];
      if (groups.length) {
        const sum = groups.reduce((acc, g) => acc + g.count, 0);
        assert(sum === iface.rf_path_count, `${label}.${iface.interface_id}: path_groups count sum ${sum} != rf_path_count ${iface.rf_path_count}`);
        groups.forEach(g => {
          assert(g.path_group_id, `${label}.${iface.interface_id}: path_group_id required`);
          assert(Number.isInteger(g.count) && g.count >= 1, `${label}.${iface.interface_id}.${g.path_group_id}: count`);
          (g.bands || []).forEach(band => {
            assert(taxonomy.bands.includes(band), `${label}.${iface.interface_id}.${g.path_group_id}: bad band ${band}`);
          });
        });
      }

      (iface.source_ids || []).forEach(id => {
        assert(sourceIds.has(id), `${label}.${iface.interface_id}: unknown source_id ${id}`);
      });
      (iface.restrictions || []).forEach(r => {
        if (r.source_id) assert(sourceIds.has(r.source_id), `${label}.${iface.interface_id}: restriction source_id ${r.source_id} unresolved`);
      });
    });
  });

  if (profile.antenna_configurations.length) {
    assert(defaultCount === 1, `${label}: exactly one default configuration required (found ${defaultCount})`);
  }

  if (['external_only', 'selectable', 'simultaneous', 'mixed_by_band'].includes(profile.antenna_architecture)) {
    const hasExternalSomewhere = (profile.antenna_configurations || []).some(c => (c.external_interfaces || []).length > 0);
    assert(hasExternalSomewhere, `${label}: architecture ${profile.antenna_architecture} requires at least one external interface`);
  }
  if (profile.antenna_architecture === 'integrated_only') {
    assert(externalInterfaceCount === 0, `${label}: integrated_only cannot expose external interfaces`);
  }

  const recomputed = finalizeProfile({
    ...profile,
    completeness: { status: 'incomplete', missing: [] }
  }).completeness;
  assert(recomputed.status === profile.completeness.status, `${label}: completeness.status drift`);
  assert(
    stableStringify(recomputed.missing) === stableStringify(profile.completeness.missing),
    `${label}: completeness.missing drift`
  );
  if (profile.completeness.status === 'complete') {
    assert(profile.completeness.missing.length === 0, `${label}: complete profile has missing entries`);
  }
}

function normalizeExportForCompare(doc) {
  return {
    schema_name: doc.schema_name,
    schema_version: doc.schema_version,
    profile_count: doc.profile_count,
    profiles: doc.profiles
  };
}

function main() {
  const taxonomy = loadTaxonomyCached();
  const aps = loadJson(AP_DATA_PATH);
  const source = loadJson(SOURCE_PATH);
  const exported = loadJson(EXPORT_PATH);
  const schema = loadJson(SCHEMA_PATH);

  assert(exported.schema_name === taxonomy.schema_name, 'export schema_name mismatch');
  assert(exported.schema_version === taxonomy.schema_version, 'export schema_version mismatch');
  assert(typeof exported.generated_at === 'string' && exported.generated_at, 'generated_at required');
  assert(typeof exported.source_revision === 'string' && exported.source_revision, 'source_revision required');
  assert(Array.isArray(exported.profiles), 'profiles must be array');
  assert(exported.profile_count === exported.profiles.length, 'profile_count mismatch');

  const external = aps.filter(isExternalCapable);
  assert(exported.profiles.length === external.length, `expected ${external.length} exported profiles, found ${exported.profiles.length}`);
  assert(source.profile_count === external.length, `source profile_count ${source.profile_count} != external count ${external.length}`);

  const rebuilt = buildProfiles(aps).map(publicProfile).sort((a, b) => a.ap_id.localeCompare(b.ap_id));
  const expectedExport = {
    schema_name: taxonomy.schema_name,
    schema_version: taxonomy.schema_version,
    profile_count: rebuilt.length,
    profiles: rebuilt
  };
  assert(
    stableStringify(normalizeExportForCompare(exported)) === stableStringify(expectedExport),
    'export profiles are stale; run: node .github/scripts/generate-ap-rf-export.js'
  );

  const expectedSchema = buildSchema(taxonomy);
  assert(
    stableStringify(schema) === stableStringify(expectedSchema),
    'ap-profiles.schema.json is stale; run: node .github/scripts/generate-ap-rf-export.js'
  );

  const expectedSourceProfiles = buildProfiles(aps);
  assert(
    stableStringify(source.profiles) === stableStringify(expectedSourceProfiles),
    'ap_rf_profiles_source.json is stale; run: node .github/scripts/generate-ap-rf-export.js'
  );

  const apIds = new Set();
  const vendorModel = new Map();
  external.forEach(ap => {
    vendorModel.set(`${ap.vendor}|${ap.model}`, makeApId(ap.vendor, ap.model));
  });

  exported.profiles.forEach((profile, idx) => {
    const label = `profiles[${idx}] (${profile.ap_id})`;
    assert(!apIds.has(profile.ap_id), `${label}: duplicate ap_id`);
    apIds.add(profile.ap_id);
    validateProfile(profile, taxonomy, label);

    const key = `${profile.vendor}|${profile.model}`;
    assert(vendorModel.has(key), `${label}: vendor/model not found among external-capable catalog rows`);
    assert(vendorModel.get(key) === profile.ap_id, `${label}: ap_id does not match deterministic vendor:model slug`);
  });

  // Hardware twins: shared hardware_profile_id must share physical topology fields.
  // Source IDs may differ by branded datasheet URL, so strip provenance before compare.
  function physicalFingerprint(profile) {
    const configs = (profile.antenna_configurations || []).map(cfg => ({
      configuration_id: cfg.configuration_id,
      label: cfg.label,
      is_default: cfg.is_default,
      active_bands: cfg.active_bands,
      integrated_antenna_groups: cfg.integrated_antenna_groups,
      external_interfaces: (cfg.external_interfaces || []).map(iface => ({
        interface_id: iface.interface_id,
        purpose: iface.purpose,
        requirement: iface.requirement,
        attachment: iface.attachment,
        connector: iface.connector,
        connector_count: iface.connector_count,
        rf_path_count: iface.rf_path_count,
        path_groups: iface.path_groups,
        included_accessory_ids: iface.included_accessory_ids,
        capabilities: iface.capabilities,
        restrictions: (iface.restrictions || []).map(r => ({
          code: r.code,
          severity: r.severity,
          value: r.value
        }))
      }))
    }));
    return stableStringify({
      antenna_architecture: profile.antenna_architecture,
      supported_bands: profile.supported_bands,
      antenna_configurations: configs
    });
  }

  const byHardware = new Map();
  exported.profiles.forEach(profile => {
    const arr = byHardware.get(profile.hardware_profile_id) || [];
    arr.push(profile);
    byHardware.set(profile.hardware_profile_id, arr);
  });
  byHardware.forEach((group, hwId) => {
    if (group.length < 2) return;
    const first = physicalFingerprint(group[0]);
    group.slice(1).forEach(p => {
      assert(
        physicalFingerprint(p) === first,
        `hardware_profile_id ${hwId}: physical profile mismatch between ${group[0].ap_id} and ${p.ap_id}`
      );
    });
  });

  // Ensure every external catalog AP is covered
  external.forEach(ap => {
    const id = makeApId(ap.vendor, ap.model);
    assert(apIds.has(id), `missing export profile for ${ap.vendor} ${ap.model} (${id})`);
  });

  if (errors.length) {
    console.error('AP RF export validation failed:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  const incomplete = exported.profiles.filter(p => p.completeness.status !== 'complete').length;
  console.log('AP RF export validation passed.');
  console.log(`  profiles: ${exported.profiles.length}`);
  console.log(`  schema_version: ${exported.schema_version}`);
  console.log(`  incomplete: ${incomplete}`);
  console.log(`  complete: ${exported.profiles.length - incomplete}`);
  console.log(`  export: ${EXPORT_PATH}`);
}

if (require.main === module) {
  try {
    // Ensure taxonomy file exists before validate
    fs.accessSync(TAXONOMY_PATH);
    main();
  } catch (err) {
    console.error(err.stack || err.message || err);
    process.exit(1);
  }
}
