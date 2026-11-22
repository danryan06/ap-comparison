#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const {
  TAXONOMY_PATH,
  SOURCE_PATH,
  EXPORT_PATH,
  SCHEMA_PATH,
  AP_DATA_PATH,
  loadJson,
  writeJson,
  stableStringify,
  isExternalCapable,
  finalizeProfile,
  loadTaxonomyCached
} = require('./lib/ap-rf-common');
const { buildProfiles } = require('./lib/build-ap-rf-source');

function gitSourceRevision() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (err) {
    return 'unknown';
  }
}

function publicProfile(sourceProfile) {
  const finalized = finalizeProfile(sourceProfile);
  return {
    ap_id: finalized.ap_id,
    hardware_profile_id: finalized.hardware_profile_id,
    vendor: finalized.vendor,
    model: finalized.model,
    display_name: finalized.display_name,
    status: finalized.status || 'active',
    supported_bands: finalized.supported_bands || [],
    antenna_architecture: finalized.antenna_architecture,
    antenna_configurations: finalized.antenna_configurations || [],
    rf_sources: (finalized.rf_sources || []).map(src => ({
      source_id: src.source_id,
      url: src.url,
      title: src.title,
      document_revision: src.document_revision == null ? null : src.document_revision,
      locator: src.locator == null ? null : src.locator
    })),
    completeness: finalized.completeness,
    datasheet_url: finalized.catalog_refs && finalized.catalog_refs.datasheet_url
      ? finalized.catalog_refs.datasheet_url
      : null,
    notes: finalized.notes == null ? null : finalized.notes
  };
}

function buildSchema(taxonomy) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://apcomparison.com/exports/antenna-compatibility/v1/ap-profiles.schema.json',
    title: 'APComparison external antenna RF profiles',
    type: 'object',
    additionalProperties: false,
    required: [
      'schema_name',
      'schema_version',
      'generated_at',
      'source_revision',
      'profile_count',
      'profiles'
    ],
    properties: {
      schema_name: { const: taxonomy.schema_name },
      schema_version: { type: 'string', pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$' },
      generated_at: { type: 'string', minLength: 1 },
      source_revision: { type: 'string', minLength: 1 },
      profile_count: { type: 'integer', minimum: 0 },
      profiles: {
        type: 'array',
        items: { $ref: '#/$defs/profile' }
      }
    },
    $defs: {
      band: { type: 'string', enum: taxonomy.bands },
      profile: {
        type: 'object',
        additionalProperties: false,
        required: [
          'ap_id',
          'hardware_profile_id',
          'vendor',
          'model',
          'display_name',
          'status',
          'supported_bands',
          'antenna_architecture',
          'antenna_configurations',
          'rf_sources',
          'completeness'
        ],
        properties: {
          ap_id: { type: 'string', pattern: '^[a-z0-9-]+:[a-z0-9-]+$' },
          hardware_profile_id: { type: 'string', minLength: 1 },
          vendor: { type: 'string', minLength: 1 },
          model: { type: 'string', minLength: 1 },
          display_name: { type: 'string', minLength: 1 },
          status: { type: 'string', enum: taxonomy.profile_statuses },
          supported_bands: {
            type: 'array',
            items: { $ref: '#/$defs/band' }
          },
          antenna_architecture: {
            type: 'string',
            enum: taxonomy.antenna_architectures
          },
          antenna_configurations: {
            type: 'array',
            items: { $ref: '#/$defs/configuration' }
          },
          rf_sources: {
            type: 'array',
            items: { $ref: '#/$defs/source' }
          },
          completeness: { $ref: '#/$defs/completeness' },
          datasheet_url: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
          superseded_by: { type: ['string', 'null'] }
        }
      },
      configuration: {
        type: 'object',
        additionalProperties: false,
        required: [
          'configuration_id',
          'label',
          'is_default',
          'active_bands',
          'integrated_antenna_groups',
          'external_interfaces'
        ],
        properties: {
          configuration_id: { type: 'string', minLength: 1 },
          label: { type: 'string', minLength: 1 },
          is_default: { type: 'boolean' },
          active_bands: {
            type: 'array',
            items: { $ref: '#/$defs/band' }
          },
          integrated_antenna_groups: {
            type: 'array',
            items: { $ref: '#/$defs/integrated_group' }
          },
          external_interfaces: {
            type: 'array',
            items: { $ref: '#/$defs/external_interface' }
          }
        }
      },
      integrated_group: {
        type: 'object',
        additionalProperties: false,
        required: ['group_id', 'bands', 'removable'],
        properties: {
          group_id: { type: 'string', minLength: 1 },
          count: { type: ['integer', 'null'], minimum: 1 },
          bands: {
            type: 'array',
            items: { $ref: '#/$defs/band' }
          },
          removable: { type: 'boolean' }
        }
      },
      external_interface: {
        type: 'object',
        additionalProperties: false,
        required: [
          'interface_id',
          'purpose',
          'requirement',
          'attachment',
          'connector',
          'connector_count',
          'rf_path_count',
          'path_groups',
          'included_accessory_ids',
          'capabilities',
          'restrictions',
          'source_ids'
        ],
        properties: {
          interface_id: { type: 'string', minLength: 1 },
          purpose: { type: 'string', enum: taxonomy.purposes },
          requirement: { type: 'string', enum: taxonomy.requirements },
          attachment: { type: 'string', enum: taxonomy.attachments },
          connector: { $ref: '#/$defs/connector' },
          connector_count: { type: 'integer', minimum: 1 },
          rf_path_count: { type: 'integer', minimum: 1 },
          path_groups: {
            type: 'array',
            items: { $ref: '#/$defs/path_group' }
          },
          included_accessory_ids: {
            type: 'array',
            items: { type: 'string', minLength: 1 }
          },
          capabilities: {
            type: 'array',
            items: { type: 'string', minLength: 1 }
          },
          restrictions: {
            type: 'array',
            items: { $ref: '#/$defs/restriction' }
          },
          source_ids: {
            type: 'array',
            items: { type: 'string', minLength: 1 }
          }
        }
      },
      connector: {
        type: 'object',
        additionalProperties: false,
        required: ['family', 'variant', 'gender', 'orientation'],
        properties: {
          family: { type: 'string', enum: taxonomy.connector_families },
          variant: { type: ['string', 'null'] },
          gender: {
            anyOf: [
              { type: 'null' },
              { type: 'string', enum: taxonomy.genders }
            ]
          },
          orientation: { type: ['string', 'null'] }
        }
      },
      path_group: {
        type: 'object',
        additionalProperties: false,
        required: ['path_group_id', 'count', 'bands', 'interchangeable'],
        properties: {
          path_group_id: { type: 'string', minLength: 1 },
          count: { type: 'integer', minimum: 1 },
          bands: {
            type: 'array',
            items: { $ref: '#/$defs/band' }
          },
          interchangeable: { type: 'boolean' }
        }
      },
      restriction: {
        type: 'object',
        additionalProperties: false,
        required: ['code', 'severity', 'value', 'source_id'],
        properties: {
          code: { type: 'string', minLength: 1 },
          severity: { type: 'string', enum: ['info', 'warning', 'hard'] },
          value: { type: ['string', 'null'] },
          source_id: { type: ['string', 'null'] }
        }
      },
      source: {
        type: 'object',
        additionalProperties: false,
        required: ['source_id', 'url', 'title'],
        properties: {
          source_id: { type: 'string', minLength: 1 },
          url: { type: ['string', 'null'] },
          title: { type: 'string', minLength: 1 },
          document_revision: { type: ['string', 'null'] },
          locator: { type: ['string', 'null'] }
        }
      },
      completeness: {
        type: 'object',
        additionalProperties: false,
        required: ['status', 'missing'],
        properties: {
          status: { type: 'string', enum: taxonomy.completeness_statuses },
          missing: {
            type: 'array',
            items: { type: 'string', minLength: 1 }
          }
        }
      }
    }
  };
}

function main() {
  const taxonomy = loadTaxonomyCached();
  const aps = loadJson(AP_DATA_PATH);
  const externalCount = aps.filter(isExternalCapable).length;

  // Rebuild curated source from the authoring module so source + export stay aligned.
  const profiles = buildProfiles(aps);
  if (profiles.length !== externalCount) {
    throw new Error(`Built ${profiles.length} profiles but catalog has ${externalCount} external-capable APs`);
  }

  const sourceDoc = {
    schema_name: 'apcomparison.external-antenna-profiles-source',
    schema_version: taxonomy.schema_version,
    description:
      'Maintainer-authored RF interface profiles for external-capable APs. Public consumers must use exports/antenna-compatibility/v1/ap-profiles.json.',
    profile_count: profiles.length,
    profiles
  };
  writeJson(SOURCE_PATH, sourceDoc);

  const publicProfiles = profiles.map(publicProfile);
  publicProfiles.sort((a, b) => a.ap_id.localeCompare(b.ap_id));

  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const exportDoc = {
    schema_name: taxonomy.schema_name,
    schema_version: taxonomy.schema_version,
    generated_at: generatedAt,
    source_revision: gitSourceRevision(),
    profile_count: publicProfiles.length,
    profiles: publicProfiles
  };

  writeJson(EXPORT_PATH, exportDoc);
  writeJson(SCHEMA_PATH, buildSchema(taxonomy));

  console.log(`Generated ${publicProfiles.length} profiles`);
  console.log(`  source: ${SOURCE_PATH}`);
  console.log(`  export: ${EXPORT_PATH}`);
  console.log(`  schema: ${SCHEMA_PATH}`);
  console.log(`  schema_version: ${taxonomy.schema_version}`);
  console.log(`  source_revision: ${exportDoc.source_revision}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.stack || err.message || err);
    process.exit(1);
  }
}

module.exports = { publicProfile, buildSchema, gitSourceRevision };
