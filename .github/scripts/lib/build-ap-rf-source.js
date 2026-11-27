#!/usr/bin/env node
'use strict';

/**
 * Curated RF interface authoring for external-capable APs.
 * Facts are transcribed conservatively from reviewed catalog connector text + datasheet URLs.
 * Gender and other unsourced mating details stay null and are listed under completeness.missing.
 * Completeness flips to complete only when every hard field is evidenced from manufacturer docs.
 * Do not use this module for runtime free-text parsing of antenna_connectors.
 */

const {
  AP_DATA_PATH,
  SOURCE_PATH,
  loadJson,
  writeJson,
  makeApId,
  isExternalCapable,
  bandsFromWifiGen,
  finalizeProfile
} = require('./ap-rf-common');

function connector(family, extras = {}) {
  return {
    family,
    variant: extras.variant == null ? null : extras.variant,
    gender: extras.gender == null ? null : extras.gender,
    orientation: extras.orientation == null ? null : extras.orientation
  };
}

function pathGroup(path_group_id, count, bands, interchangeable = true) {
  return {
    path_group_id,
    count,
    bands: bands == null ? [] : bands,
    interchangeable
  };
}

function iface(spec) {
  return {
    interface_id: spec.interface_id,
    purpose: spec.purpose || 'client_radio',
    requirement: spec.requirement || 'required',
    attachment: spec.attachment || 'bulkhead',
    connector: connector(spec.family, {
      variant: spec.variant,
      gender: spec.gender,
      orientation: spec.orientation
    }),
    connector_count: spec.connector_count,
    rf_path_count: spec.rf_path_count,
    path_groups: spec.path_groups || [],
    included_accessory_ids: spec.included_accessory_ids || [],
    capabilities: spec.capabilities || [],
    restrictions: spec.restrictions || [],
    source_ids: spec.source_ids || []
  };
}

function config(spec) {
  return {
    configuration_id: spec.configuration_id || 'default',
    label: spec.label || 'Default operation',
    is_default: spec.is_default !== false,
    active_bands: spec.active_bands || [],
    integrated_antenna_groups: spec.integrated_antenna_groups || [],
    external_interfaces: spec.external_interfaces || []
  };
}

function sourceFromAp(ap, suffix = 'datasheet') {
  const id = `${makeApId(ap.vendor, ap.model).replace(':', '-')}-${suffix}`;
  return {
    source_id: id,
    url: ap.datasheet_url || null,
    title: `${ap.vendor} ${ap.model} datasheet`,
    document_revision: null,
    locator: null
  };
}

function baseProfile(ap, overrides) {
  const ap_id = makeApId(ap.vendor, ap.model);
  const supported_bands = bandsFromWifiGen(ap.wifi_gen_radios);
  const rf_sources = [sourceFromAp(ap), ...(overrides.extra_sources || [])];
  return finalizeProfile({
    ap_id,
    hardware_profile_id: overrides.hardware_profile_id || ap_id,
    vendor: ap.vendor,
    model: ap.model,
    display_name: `${ap.vendor} ${ap.model}`,
    status: 'active',
    supported_bands,
    antenna_architecture: overrides.antenna_architecture,
    antenna_configurations: overrides.antenna_configurations,
    rf_sources,
    catalog_refs: {
      vendor: ap.vendor,
      model: ap.model,
      antenna_type: ap.antenna_type,
      antenna_connectors: ap.antenna_connectors,
      datasheet_url: ap.datasheet_url || null
    },
    notes: overrides.notes || null
  });
}

function defaultSourceIds(ap) {
  return [sourceFromAp(ap).source_id];
}

// Arista's Antenna Selection Guide lists which antennas each AP supports.
// It is the evidence for the Arista per-path band requirements below.
const ARISTA_ANTENNA_GUIDE = {
  source_id: 'arista-antenna-selection-guide',
  url: 'https://www.arista.com/assets/data/pdf/Datasheets/Antenna-Selection-Guide.pdf',
  title: 'Arista Antenna Selection Guide',
  document_revision: 'June 17, 2026',
  locator: null
};

function findAp(aps, vendor, model) {
  const hit = aps.find(ap => ap.vendor === vendor && ap.model === model);
  if (!hit) throw new Error(`Missing AP in catalog: ${vendor} ${model}`);
  return hit;
}

function buildProfiles(aps) {
  const profiles = [];

  // --- Allied Telesis ---
  {
    const ap = findAp(aps, 'Allied Telesis', 'TQ6702e GEN2');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              connector_count: 8,
              rf_path_count: 8,
              path_groups: [
                pathGroup('five-ghz', 4, ['5']),
                pathGroup('dual-band', 4, ['2.4', '5'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }

  // --- Arista ---
  {
    const ap = findAp(aps, 'Arista', 'C-460E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [pathGroup('tri-band', 6, ['2.4', '5', '6'])],
              source_ids: [...defaultSourceIds(ap), ARISTA_ANTENNA_GUIDE.source_id]
            })
          ]
        })
      ],
      extra_sources: [ARISTA_ANTENNA_GUIDE],
      notes: 'Datasheet: 6 RP-SMA connectors for 4x4 2.4/5/6 GHz plus a 2x2 tri-band scan radio. ' +
        'The Antenna Selection Guide lists only 6-lead tri-band antennas for the C-460E, so every path ' +
        'is treated as needing 2.4/5/6 GHz. The per-connector map itself is not published.'
    }));
  }
  {
    const ap = findAp(aps, 'Arista', 'O-405E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('tri-band', 4, ['2.4', '5', '6'])],
              source_ids: [...defaultSourceIds(ap), ARISTA_ANTENNA_GUIDE.source_id]
            })
          ]
        })
      ],
      extra_sources: [ARISTA_ANTENNA_GUIDE],
      notes: 'Datasheet: 4 N-type connectors for 2x2 2.4/5/6 GHz radios. The Antenna Selection Guide ' +
        'lists only 4-lead tri-band antennas for the O-405E, so every path is treated as needing ' +
        '2.4/5/6 GHz. The per-connector map itself is not published.'
    }));
  }
  {
    const ap = findAp(aps, 'Arista', 'O-435E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [pathGroup('tri-band', 6, ['2.4', '5', '6'])],
              source_ids: [...defaultSourceIds(ap), ARISTA_ANTENNA_GUIDE.source_id]
            })
          ]
        })
      ],
      extra_sources: [ARISTA_ANTENNA_GUIDE],
      notes: 'Datasheet: 6 N-type connectors for 2x2 2.4/5/6 GHz access radios plus a 2x2 tri-band ' +
        'multi-function radio. The Antenna Selection Guide lists only 6-lead tri-band antennas for the ' +
        'O-435E, so every path is treated as needing 2.4/5/6 GHz. The per-connector map is not published.'
    }));
  }

  // --- Aruba ---
  {
    const ap = findAp(aps, 'Aruba', 'AP-504');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              gender: 'female',
              connector_count: 2,
              rf_path_count: 2,
              path_groups: [pathGroup('dual-band', 2, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Aruba', 'AP-514');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              gender: 'female',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [
                pathGroup('shared-dual-band', 4, ['2.4', '5'], true)
              ],
              source_ids: defaultSourceIds(ap),
              restrictions: [
                {
                  code: 'shared_paths_partial_radio_use',
                  severity: 'info',
                  value: '2.4 GHz radio uses 2 of the 4 shared paths',
                  source_id: defaultSourceIds(ap)[0]
                }
              ]
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Aruba', 'AP-518');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              gender: 'female',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [
                pathGroup('two-four', 2, ['2.4']),
                pathGroup('five', 4, ['5'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Aruba', 'AP-574');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              gender: 'female',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [
                pathGroup('two-four', 2, ['2.4']),
                pathGroup('five', 4, ['5'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Aruba', 'AP-584');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              gender: 'female',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'iot-n',
              purpose: 'iot',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'n',
              gender: 'female',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('ble-zigbee', 1, ['2.4'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Aruba', 'AP-734');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              gender: 'female',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [
                pathGroup('dual-band', 2, ['2.4', '5']),
                pathGroup('six', 2, ['6'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Aruba', 'AP-754');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              gender: 'female',
              connector_count: 8,
              rf_path_count: 8,
              path_groups: [
                pathGroup('dual-band', 4, ['2.4', '5']),
                pathGroup('six', 4, ['6'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Aruba', 'AP-764');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              gender: 'female',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [
                pathGroup('dual-band', 2, ['2.4', '5']),
                pathGroup('six', 2, ['6'])
              ],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'iot-rpsma',
              purpose: 'iot',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'rp-sma',
              connector_count: 2,
              rf_path_count: 2,
              path_groups: [pathGroup('ble-zigbee', 2, ['2.4'])],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'gnss-rpsma',
              purpose: 'gnss',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'rp-sma',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('gnss', 1, [])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }

  // --- Cambium ---
  {
    const ap = findAp(aps, 'Cambium', 'XE3-4TN');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              gender: 'female',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [
                pathGroup('five-six', 4, ['5', '6']),
                pathGroup('dual-band', 2, ['2.4', '5'])
              ],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'gps-sma',
              purpose: 'gnss',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'sma',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('gps', 1, [])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }

  // --- Cisco / Meraki twins helper ---
  function pushCiscoTwin(vendor, model, architecture, configurations, hardwareId, notes) {
    const ap = findAp(aps, vendor, model);
    profiles.push(baseProfile(ap, {
      hardware_profile_id: hardwareId || makeApId('Cisco', model),
      antenna_architecture: architecture,
      antenna_configurations: configurations(ap),
      notes: notes || null
    }));
  }

  // CW9174E
  const cw9174eConfigs = ap => [
    config({
      active_bands: ['2.4', '5', '6'],
      external_interfaces: [
        iface({
          interface_id: 'dart-8',
          attachment: 'proprietary_multiport',
          family: 'dart',
          variant: 'dart-8',
          connector_count: 1,
          rf_path_count: 8,
          path_groups: [],
          source_ids: defaultSourceIds(ap),
          capabilities: ['self_identifying']
        })
      ]
    })
  ];
  pushCiscoTwin('Cisco', 'CW9174E', 'external_only', cw9174eConfigs, 'cisco:cw9174e',
    'DART-8 multiport; per-path bands not authored in v1.');
  pushCiscoTwin('Cisco Meraki', 'CW9174E', 'external_only', cw9174eConfigs, 'cisco:cw9174e',
    'Hardware twin of Cisco CW9174E; distinct ap_id and claim provenance.');

  // CW9177E
  const cw9177eConfigs = ap => [
    config({
      configuration_id: 'default',
      label: 'Default tri-band',
      active_bands: ['2.4', '5', '6'],
      external_interfaces: [
        iface({
          interface_id: 'wifi-n',
          family: 'n',
          gender: 'female',
          connector_count: 8,
          rf_path_count: 8,
          path_groups: [
            pathGroup('dual-band', 4, ['2.4', '5']),
            pathGroup('six-or-high-five', 4, ['6'])
          ],
          source_ids: defaultSourceIds(ap),
          restrictions: [
            {
              code: 'mode_dependent_bands',
              severity: 'warning',
              value: 'Upper 4 paths may carry 5 GHz high band in dual-5 GHz mode',
              source_id: defaultSourceIds(ap)[0]
            }
          ]
        }),
        iface({
          interface_id: 'gnss-sma',
          purpose: 'gnss',
          requirement: 'not_part_of_wifi_antenna_solution',
          family: 'sma',
          gender: 'female',
          connector_count: 1,
          rf_path_count: 1,
          path_groups: [pathGroup('gnss', 1, [])],
          source_ids: defaultSourceIds(ap)
        })
      ]
    })
  ];
  pushCiscoTwin('Cisco', 'CW9177E', 'external_only', cw9177eConfigs, 'cisco:cw9177e');
  pushCiscoTwin('Cisco Meraki', 'CW9177E', 'external_only', cw9177eConfigs, 'cisco:cw9177e');

  // CW9179F — external ports only in front-and-back mode
  const cw9179fConfigs = ap => [
    config({
      configuration_id: 'front-and-back',
      label: 'Front-and-back mode (rear N-type active)',
      is_default: true,
      active_bands: ['2.4', '5', '6'],
      external_interfaces: [
        iface({
          interface_id: 'rear-n',
          family: 'n',
          gender: 'female',
          connector_count: 4,
          rf_path_count: 4,
          path_groups: [
            pathGroup('two-four-and-five-lower', 4, ['2.4', '5-lower'])
          ],
          source_ids: defaultSourceIds(ap),
          capabilities: ['sia'],
          restrictions: [
            {
              code: 'sia_capable_port_position',
              severity: 'info',
              value: 'Left-most rear port is SIA-capable',
              source_id: defaultSourceIds(ap)[0]
            },
            {
              code: 'mode_specific_external_ports',
              severity: 'warning',
              value: 'External ports used for 2.4 GHz and 5 GHz low band in front-and-back mode',
              source_id: defaultSourceIds(ap)[0]
            }
          ]
        })
      ]
    })
  ];
  pushCiscoTwin('Cisco', 'CW9179F', 'selectable', cw9179fConfigs, 'cisco:cw9179f',
    'Directional + external; authored for front-and-back external mode only.');
  pushCiscoTwin('Cisco Meraki', 'CW9179F', 'selectable', cw9179fConfigs, 'cisco:cw9179f');

  // CW9163E
  const cw9163eConfigs = ap => [
    config({
      active_bands: ['2.4', '5', '6'],
      external_interfaces: [
        iface({
          interface_id: 'wifi-n',
          family: 'n',
          gender: 'female',
          connector_count: 4,
          rf_path_count: 4,
          path_groups: [
            pathGroup('dual-band', 2, ['2.4', '5']),
            pathGroup('six', 2, ['6'])
          ],
          source_ids: defaultSourceIds(ap)
        }),
        iface({
          interface_id: 'gnss-sma',
          purpose: 'gnss',
          requirement: 'not_part_of_wifi_antenna_solution',
          family: 'sma',
          gender: 'female',
          connector_count: 1,
          rf_path_count: 1,
          path_groups: [pathGroup('gnss', 1, [])],
          source_ids: defaultSourceIds(ap)
        })
      ]
    })
  ];
  pushCiscoTwin('Cisco', 'CW9163E', 'external_only', cw9163eConfigs, 'cisco:cw9163e',
    'Path groups from CW9163E installation guide port markings (ANT C/D 2.4&5, ANT A/B 6 GHz).');
  pushCiscoTwin('Cisco Meraki', 'CW9163E', 'external_only', cw9163eConfigs, 'cisco:cw9163e');

  // Cisco-only
  {
    const ap = findAp(aps, 'Cisco', 'IW9167E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              connector_count: 8,
              rf_path_count: 8,
              path_groups: [],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'gnss-tnc',
              purpose: 'gnss',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'tnc',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('gnss', 1, [])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Wi-Fi path band map not published in catalog connector text.'
    }));
  }
  {
    const ap = findAp(aps, 'Cisco', '9115AXE');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rptnc',
              family: 'rp-tnc',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Cisco', '9120AXE');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          configuration_id: 'rp-tnc',
          label: 'Conventional RP-TNC ports',
          is_default: true,
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rptnc',
              family: 'rp-tnc',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        }),
        config({
          configuration_id: 'dart-4',
          label: 'Optional DART-4 Smart Antenna connector',
          is_default: false,
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'dart-4',
              attachment: 'proprietary_multiport',
              family: 'dart',
              variant: 'dart-4',
              connector_count: 1,
              rf_path_count: 4,
              path_groups: [],
              source_ids: defaultSourceIds(ap),
              capabilities: ['self_identifying']
            })
          ]
        })
      ],
      notes: 'Two mutually exclusive interface options modeled as configurations; confirm active config before matching.'
    }));
  }
  {
    const ap = findAp(aps, 'Cisco', '9130AXE');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'dart-8',
              attachment: 'proprietary_multiport',
              family: 'dart',
              variant: 'dart-8',
              connector_count: 1,
              rf_path_count: 8,
              path_groups: [],
              source_ids: defaultSourceIds(ap),
              capabilities: ['self_identifying']
            })
          ]
        })
      ],
      notes: 'DART-8; detailed per-path band topology left incomplete in v1.'
    }));
  }

  // Meraki-only (non-twin external)
  {
    const ap = findAp(aps, 'Cisco Meraki', 'MR46E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rptnc',
              family: 'rp-tnc',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Cisco Meraki', 'MR76');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              gender: 'female',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Install guide: four external N-type female dual-band antenna connectors.'
    }));
  }

  // --- Extreme ---
  {
    const ap = findAp(aps, 'Extreme', 'AP5022FX');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'breakout',
              attachment: 'breakout',
              family: 'vendor-proprietary',
              variant: 'acc-cbl-brkout-12rpsma',
              connector_count: 1,
              rf_path_count: 12,
              path_groups: [
                pathGroup('dual-band', 4, ['2.4', '5']),
                pathGroup('six', 4, ['6']),
                pathGroup('mode-only', 4, [])
              ],
              included_accessory_ids: ['extreme:acc-cbl-brkout-12rpsma'],
              source_ids: defaultSourceIds(ap),
              restrictions: [
                {
                  code: 'included_breakout_required',
                  severity: 'warning',
                  value: 'Included ACC-CBL-BRKOUT-12RPSMA presents 12× RP-SMA endpoints',
                  source_id: defaultSourceIds(ap)[0]
                },
                {
                  code: 'mode_only_paths',
                  severity: 'info',
                  value: '4 paths used only in dual-5/dual-6 GHz modes',
                  source_id: defaultSourceIds(ap)[0]
                }
              ]
            }),
            iface({
              interface_id: 'iot',
              purpose: 'iot',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'vendor-proprietary',
              variant: 'iot-antenna-port',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('iot', 1, [])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Breakout topology; matching must use included accessory endpoints, not the chassis breakout alone.'
    }));
  }
  {
    const ap = findAp(aps, 'Extreme', 'AP4020X');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'simultaneous',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          integrated_antenna_groups: [
            {
              group_id: 'permanent-6ghz',
              count: 2,
              bands: ['6'],
              removable: false
            }
          ],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [
                pathGroup('dual-band', 2, ['2.4', '5']),
                pathGroup('iot-or-five', 1, ['2.4', '5']),
                pathGroup('five', 1, ['5'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'External ports operate with permanently attached 6 GHz antennas simultaneously; IoT/5 GHz role on one path needs review.'
    }));
  }
  {
    const ap = findAp(aps, 'Extreme', 'AP4020FX');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [
                pathGroup('six', 2, ['6']),
                pathGroup('dual-band', 2, ['2.4', '5']),
                pathGroup('iot-or-five', 1, ['2.4', '5']),
                pathGroup('five', 1, ['5'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Extreme', 'AP3000X');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'simultaneous',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          integrated_antenna_groups: [
            {
              group_id: 'permanent-6ghz',
              count: 2,
              bands: ['6'],
              removable: false
            }
          ],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 2,
              rf_path_count: 2,
              path_groups: [pathGroup('dual-band', 2, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Extreme', 'AP410e');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'ble-rpsma',
              purpose: 'iot',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'rp-sma',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('ble', 1, ['2.4'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Datasheet: 6 RP-SMA connectors for 4x4 5 GHz + 2x2 2.4 GHz radios. The per-connector ' +
        'band map is not published, and Extreme lists both dual-band dipoles and quad-feed antennas ' +
        'for this AP, so the 6 ports are likely not one uniform group. Left without path groups.'
    }));
  }
  {
    const ap = findAp(aps, 'Extreme', 'AP4060X');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [
                pathGroup('dual-band', 2, ['2.4', '5']),
                pathGroup('five-six', 2, ['5', '6'])
              ],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'ble-n',
              purpose: 'iot',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'n',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('ble', 1, ['2.4'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }

  // --- Fortinet ---
  {
    const ap = findAp(aps, 'Fortinet', 'FAP-222KL');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              connector_count: 2,
              rf_path_count: 2,
              path_groups: [pathGroup('dual-band', 2, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'lorawan-n',
              purpose: 'lorawan',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'n',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('lorawan', 1, [])],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'lte-n',
              purpose: 'lte',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'n',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('lte', 1, [])],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'gnss-n',
              purpose: 'gnss',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'n',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('gnss', 1, [])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Fortinet', 'FAP-243K');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [
                pathGroup('dual-band', 2, ['2.4', '5']),
                pathGroup('six', 2, ['6'])
              ],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'scan-rpsma',
              purpose: 'scan_radio',
              family: 'rp-sma',
              connector_count: 2,
              rf_path_count: 2,
              path_groups: [pathGroup('tri-band-scan', 2, ['2.4', '5', '6'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Fortinet', 'FAP-432G');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'wifi-scan-n',
              purpose: 'client_radio',
              family: 'n',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('tri-band-plus-scan', 4, ['2.4', '5', '6'])],
              source_ids: defaultSourceIds(ap),
              restrictions: [
                {
                  code: 'combined_client_and_scan',
                  severity: 'warning',
                  value: 'Paths described as tri-band Wi-Fi + scanning; role split needs review',
                  source_id: defaultSourceIds(ap)[0]
                }
              ]
            }),
            iface({
              interface_id: 'iot-n',
              purpose: 'iot',
              requirement: 'not_part_of_wifi_antenna_solution',
              family: 'n',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('ble-zigbee', 1, ['2.4'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Fortinet', 'FAP-433G');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'simultaneous',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          integrated_antenna_groups: [
            {
              group_id: 'permanent-tri-band',
              count: 4,
              bands: ['2.4', '5', '6'],
              removable: false
            }
          ],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Fortinet', 'FAP-443K');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 8,
              rf_path_count: 8,
              path_groups: [
                pathGroup('dual-band', 4, ['2.4', '5']),
                pathGroup('six', 4, ['6'])
              ],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'scan-rpsma',
              purpose: 'scan_radio',
              family: 'rp-sma',
              connector_count: 2,
              rf_path_count: 2,
              path_groups: [pathGroup('tri-band-scan', 2, ['2.4', '5', '6'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }

  // --- Juniper ---
  {
    const ap = findAp(aps, 'Juniper', 'AP27E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [
                pathGroup('dual-band', 2, ['2.4', '5']),
                pathGroup('six', 2, ['6'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Juniper', 'AP36M');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'selectable',
      antenna_configurations: [
        config({
          configuration_id: 'integrated-directional',
          label: 'Internal directional antennas (default)',
          is_default: true,
          active_bands: ['2.4', '5', '6'],
          integrated_antenna_groups: [
            {
              group_id: 'internal-directional',
              count: null,
              bands: ['2.4', '5', '6'],
              removable: false
            }
          ],
          external_interfaces: []
        }),
        config({
          configuration_id: 'pluggable-blocks',
          label: 'Optional pluggable external antenna blocks',
          is_default: false,
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'dual-band-4pin',
              attachment: 'proprietary_multiport',
              family: 'juniper-pin-block',
              variant: '4-pin-2.4-5',
              connector_count: 1,
              rf_path_count: 4,
              path_groups: [],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'six-6pin',
              attachment: 'proprietary_multiport',
              family: 'juniper-pin-block',
              variant: '6-pin-6',
              connector_count: 1,
              rf_path_count: 6,
              path_groups: [],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Pin-block path counts are approximate from pin naming; path groups left empty until vendor topology is confirmed.'
    }));
  }
  {
    const ap = findAp(aps, 'Juniper', 'AP45E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'dual-band-4pin',
              attachment: 'proprietary_multiport',
              family: 'juniper-pin-block',
              variant: '4-pin-2.4-5',
              connector_count: 1,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'six-scan-6pin',
              attachment: 'proprietary_multiport',
              family: 'juniper-pin-block',
              variant: '6-pin-6-scan',
              connector_count: 1,
              rf_path_count: 6,
              path_groups: [],
              source_ids: defaultSourceIds(ap),
              restrictions: [
                {
                  code: 'combined_client_and_scan',
                  severity: 'warning',
                  value: '6-pin block described as 6 GHz + Scan',
                  source_id: defaultSourceIds(ap)[0]
                }
              ]
            })
          ]
        })
      ],
      notes: 'Proprietary pin blocks cannot be reduced to N× standard coax; exact RF-path topology incomplete.'
    }));
  }
  {
    const ap = findAp(aps, 'Juniper', 'AP47E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'tri-band-6pin',
              attachment: 'proprietary_multiport',
              family: 'juniper-pin-block',
              variant: '6-pin-2.4-5-6',
              connector_count: 1,
              rf_path_count: 6,
              path_groups: [],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'six-scan-6pin',
              attachment: 'proprietary_multiport',
              family: 'juniper-pin-block',
              variant: '6-pin-6-scan',
              connector_count: 1,
              rf_path_count: 6,
              path_groups: [],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'five-4pin',
              attachment: 'proprietary_multiport',
              family: 'juniper-pin-block',
              variant: '4-pin-5',
              connector_count: 1,
              rf_path_count: 4,
              path_groups: [pathGroup('five', 4, ['5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Three proprietary pin blocks; path-band maps incomplete where not stated.'
    }));
  }
  {
    const ap = findAp(aps, 'Juniper', 'AP32E');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rpsma',
              family: 'rp-sma',
              gender: 'male',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            }),
            iface({
              interface_id: 'scan-rpsma',
              purpose: 'scan_radio',
              family: 'rp-sma',
              gender: 'male',
              connector_count: 1,
              rf_path_count: 1,
              path_groups: [pathGroup('scan', 1, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Datasheet: Five RP-SMA male connectors (four Wi-Fi data, one sensor).'
    }));
  }

  // --- Linksys ---
  {
    const ap = findAp(aps, 'Linksys', 'WRT54G');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-rptnc',
              family: 'rp-tnc',
              connector_count: 2,
              rf_path_count: 2,
              path_groups: [pathGroup('two-four', 2, ['2.4'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Legacy 802.11g dual RP-TNC; connector gender not stated in the linked datasheet.'
    }));
  }

  // --- Alcatel-Lucent ---
  {
    const ap = findAp(aps, 'Alcatel-Lucent', 'AP1572');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5', '6'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              family: 'n',
              gender: 'female',
              connector_count: 6,
              rf_path_count: 6,
              path_groups: [
                pathGroup('two-four', 2, ['2.4']),
                pathGroup('five', 2, ['5']),
                pathGroup('six-or-five', 2, ['6'])
              ],
              source_ids: defaultSourceIds(ap),
              restrictions: [
                {
                  code: 'mode_dependent_bands',
                  severity: 'warning',
                  value: 'Two paths may carry 6 GHz or 5 GHz depending on mode',
                  source_id: defaultSourceIds(ap)[0]
                }
              ]
            })
          ]
        })
      ]
    }));
  }

  // --- Ruckus ---
  {
    const ap = findAp(aps, 'Ruckus', 'T350se');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'selectable',
      antenna_configurations: [
        config({
          configuration_id: 'internal-sector',
          label: 'Internal 120° sector',
          is_default: true,
          active_bands: ['2.4', '5'],
          integrated_antenna_groups: [
            {
              group_id: 'internal-sector',
              count: null,
              bands: ['2.4', '5'],
              removable: false
            }
          ],
          external_interfaces: []
        }),
        config({
          configuration_id: 'external',
          label: 'Optional external antennas',
          is_default: false,
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              requirement: 'optional',
              family: 'n',
              gender: 'female',
              connector_count: 2,
              rf_path_count: 2,
              path_groups: [pathGroup('dual-band', 2, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }
  {
    const ap = findAp(aps, 'Ruckus', 'T750SE');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'selectable',
      antenna_configurations: [
        config({
          configuration_id: 'internal-sector',
          label: 'Internal 120° sector',
          is_default: true,
          active_bands: ['2.4', '5'],
          integrated_antenna_groups: [
            {
              group_id: 'internal-sector',
              count: null,
              bands: ['2.4', '5'],
              removable: false
            }
          ],
          external_interfaces: []
        }),
        config({
          configuration_id: 'external',
          label: 'Optional external antennas',
          is_default: false,
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-n',
              requirement: 'optional',
              family: 'n',
              gender: 'female',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [pathGroup('dual-band', 4, ['2.4', '5'])],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ]
    }));
  }

  // --- Meter ---
  {
    const ap = findAp(aps, 'Meter', 'MW09');
    profiles.push(baseProfile(ap, {
      antenna_architecture: 'external_only',
      antenna_configurations: [
        config({
          active_bands: ['2.4', '5'],
          external_interfaces: [
            iface({
              interface_id: 'wifi-unknown',
              family: 'vendor-proprietary',
              variant: 'unpublished',
              connector_count: 4,
              rf_path_count: 4,
              path_groups: [
                pathGroup('two-four', 2, ['2.4']),
                pathGroup('five', 2, ['5'])
              ],
              source_ids: defaultSourceIds(ap)
            })
          ]
        })
      ],
      notes: 'Connector family unpublished; consumers must return review_required.'
    }));
  }

  // Sort deterministically by ap_id
  profiles.sort((a, b) => a.ap_id.localeCompare(b.ap_id));
  return profiles;
}

function main() {
  const aps = loadJson(AP_DATA_PATH);
  if (!Array.isArray(aps)) throw new Error('ap_data.json must be an array');

  const external = aps.filter(isExternalCapable);
  const profiles = buildProfiles(aps);

  if (profiles.length !== external.length) {
    const covered = new Set(profiles.map(p => `${p.vendor}|${p.model}`));
    const missing = external
      .filter(ap => !covered.has(`${ap.vendor}|${ap.model}`))
      .map(ap => `${ap.vendor} ${ap.model}`);
    throw new Error(
      `Expected ${external.length} external profiles, built ${profiles.length}. Missing: ${missing.join(', ')}`
    );
  }

  const sourceDoc = {
    schema_name: 'apcomparison.external-antenna-profiles-source',
    schema_version: '1.0.0',
    description:
      'Maintainer-authored RF interface profiles for external-capable APs. Generate the public export with generate-ap-rf-export.js. Do not parse antenna_connectors at runtime.',
    profile_count: profiles.length,
    profiles
  };

  writeJson(SOURCE_PATH, sourceDoc);
  console.log(`Wrote ${profiles.length} profiles to ${SOURCE_PATH}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

module.exports = { buildProfiles };
