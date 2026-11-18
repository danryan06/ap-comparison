# AP Data Template Guide

Use this template when submitting new AP entries. The canonical JSON template is `ap_template.json`. Copy it and replace the sample values. Every factual value must come from vendor documentation.

## Template JSON

```json
{
  "vendor": "Vendor Name",
  "model": "Model Number",
  "wifi_gen_radios": "Wi-Fi 7 (2.4/5/6)",
  "spatial_streams": "2x2 / 4x4 / 4x4",
  "min_poe_class": "802.3at (Class 4)",
  "recommended_poe": "802.3bt (Class 5) PoE++ for full performance",
  "behavior_min_power": "On 802.3at (Class 4), USB and the second Ethernet port are disabled, the 5 GHz and 6 GHz radios are limited to 2x2, and maximum transmit power is reduced by 3 dB on all radios. On 802.3af (Class 3), the AP boots for staging only with all radios disabled.",
  "ethernet_ports_speed": "1× 100M/1/2.5/5 GbE (RJ45, PoE in) + 1× 1 GbE (RJ45, PoE out)",
  "antenna_type": ["Internal"],
  "antenna_gain_dbi": {
    "2.4": 4.5,
    "5": 5.0,
    "6": 5.5
  },
  "beamwidth": {
    "2.4": "70° x 70° (optional)",
    "5": "70° x 70° (optional)",
    "6": "60° x 60° (optional)"
  },
  "antenna_modes": [
    {
      "mode": "Dual 5 GHz (optional)",
      "antenna_gain_dbi": {
        "2.4": 4.5,
        "5-lower": 5.0,
        "5-upper": 5.2
      },
      "beamwidth": {
        "5-upper": "70° x 70°"
      }
    }
  ],
  "form_factor": "Indoor",
  "radios_iot_features": [
    "BLE",
    "802.15.4 IoT radio",
    "GPS/GNSS",
    "Scanning radio"
  ],
  "datasheet_url": "https://example.com/datasheet.pdf",
  "image_url": "images/vendor/vendor-model.png",
  "dimensions": "200 x 200 x 45 mm (7.9 x 7.9 x 1.8 in)",
  "weight": "1.0 kg (2.2 lb)",
  "antenna_connectors": "None (internal antennas)",
  "operating_temp_range": "0°C to 50°C operating",
  "operating_humidity": "5% to 95% RH non-condensing (optional)",
  "ingress_protection": "IP67 (optional)",
  "hazloc_certification": "Class I, Division 2, Groups A, B, C, D (optional)",
  "msrp": "unknown",
  "end_of_sale_announcement_date": "February 7, 2025 (optional)",
  "end_of_sale_date": "August 7, 2025 (optional)",
  "end_of_support_date": "August 7, 2030 (optional)",
  "end_of_sale_url": "https://vendor.com/eol-notice (optional)",
  "manufacturer_suggested_replacement": "AP-655, AP-675 (optional)",
  "in_box": [
    {
      "item": "Mounting bracket",
      "part_number": "AIR-AP-BRACKET-1",
      "qty": 1
    }
  ],
  "in_box_source": "https://vendor.com/quick-start-guide",
  "in_box_condition": "Ready to Go option (optional)"
}
```

## Field Descriptions

### Required Fields

- **vendor**: Manufacturer name (e.g., "Cisco", "Aruba", "Juniper")
- **model**: Model number/name (e.g., "AP-615", "9178I", "AP45")

### Wi-Fi Specifications

- **wifi_gen_radios**: Wi-Fi generation and supported bands
  - Format: `"Wi-Fi 6 (2.4/5)"` for dual-band Wi-Fi 6
  - Format: `"Wi-Fi 6E (2.4/5/6)"` for tri-band Wi-Fi 6E
  - Format: `"Wi-Fi 7 (2.4/5/6)"` for tri-band Wi-Fi 7
  - Format: `"Wi-Fi 6/7 (2.4/5/6)"` for mixed generations

- **spatial_streams**: MIMO configuration per band
  - Format: `"2x2 / 2x2"` for dual-band (2.4 / 5 GHz)
  - Format: `"4x4 / 4x4 / 4x4"` for tri-band (2.4 / 5 / 6 GHz)
  - Format: `"4x4 / 4x4+4x4 (dual 5 GHz) / 4x4"` for quad-radio with dual 5 GHz
  - Keep `x` in stream counts. The multiplication sign `×` is for Ethernet port counts only.

### Power over Ethernet (PoE)

- **min_poe_class**: A single value, `"802.3xx (Class N)"`. This is the lowest class that serves clients. Staging-only power is noted in `behavior_min_power`, not here.
  - Examples: `"802.3af (Class 3)"`, `"802.3at (Class 4)"`, `"802.3bt (Class 5)"`

- **recommended_poe**: `"802.3xx (Class N)"` plus a qualifier.
  - Example: `"802.3bt (Class 5) PoE++ for full performance"`

- **behavior_min_power**: Must open with `"On 802.3xx (Class N)"` for the `min_poe_class` level, then lower (staging) or higher classes after that. State specifics: streams per radio, ports disabled, uplink speed, USB, PoE-out, Tx/EIRP figures, and IoT or scanning radios. No hedges (`may`, `could`, `some features`). No cross-references to other models. Use PD-side wattage when the vendor documents it; otherwise use the vendor's figure.
  - Example: `"On 802.3at (Class 4), USB and the second Ethernet port are disabled, the 5 GHz and 6 GHz radios are limited to 2x2, and maximum transmit power is reduced by 3 dB on all radios. On 802.3af (Class 3), the AP boots for staging only with all radios disabled."`

- **Aruba IPM**: Describe IPM disabled first, then: `"With IPM enabled, the AP starts unrestricted and applies [documented reductions] in the configured priority order to stay within the [class] budget."`

### Network Interfaces

- **ethernet_ports_speed**: Ethernet port specifications
  - Use `×` for counts, with a space after it: `"1× 1 GbE"`, not `"1x"` or `"1×1GbE"`.
  - Express speeds in GbE with a space before the unit: `"1× 100M/1/2.5/5 GbE (RJ45, PoE in) + 1× 1 GbE (RJ45)"`.
  - In a multi-speed list, write megabit rates as `10M` or `100M` and gigabit rates as bare numbers, with one `GbE` at the end of the list.
  - Convert BASE-T names when the mapping is unambiguous: `100/1000/2500BASE-T` becomes `100M/1/2.5 GbE`. `10/100/1000BASE-T` becomes `10M/100M/1 GbE`.
  - Leave a speed string unchanged when the unit is ambiguous, and flag it for review.
  - Include PoE role, connector, and SFP when the datasheet states them.

### Antenna Information

- **antenna_type**: An array. Allowed values:
  - `"Internal"`: integrated omnidirectional antenna
  - `"Directional"`: integrated directional or sector antenna
  - `"External"`: connectorized antenna
  - One value is the normal case: `["Internal"]`.
  - A model that ships as one type or the other gets both values, for example `["Directional", "External"]`.
  - Hybrids whose antennas are used simultaneously take their predominant type, not both.
  - Keep descriptive detail (dynamic, 60°, HazLoc, connector family) in `antenna_connectors`, not in `antenna_type`.
  - A plain string is accepted only for a not-yet-normalized submission. New entries use an array.

- **antenna_gain_dbi**: Gain for the AP's default radio and antenna mode. Optional. Omit the field when the datasheet does not state it.
  - Shape: `{"2.4": 4.5, "5": 5.0, "6": 5.5}`
  - Keys in this order: `"2.4"`, `"5"`, `"6"`. Include only bands the default mode uses.
  - Values are numbers. dBi is implied.

- **beamwidth**: Beamwidth for the same default mode. Optional.
  - Normally flat per band: `{"2.4": "70° x 70°", "5": "70° x 70°", "6": "60° x 60°"}`.
  - Format: `"azimuth° x elevation°"`.
  - Same band-key order as gain: `"2.4"`, `"5"`, `"5-lower"`, `"5-upper"`, `"6"`.
  - It may be nested by mode name when the vendor presents beamwidth per antenna mode and no single default mode is documented. Keep every mode. Do not move those modes into `antenna_modes`, and do not pick a default mode.
  - Nested example: `{ "wide": { "2.4": "70° x 70°", "5-lower": "35° x 35°", "5-upper": "35° x 35°", "6": "70° x 35°" }, "narrow_boresight": { "...": "..." }, "front_and_back": { "...": "..." } }`.
  - Use `"5-lower"` and `"5-upper"` for a split 5 GHz band. `"5_low"` and `"5_high"` are not keys.
  - The detail and compare views show a nested beamwidth as one row per mode, labeled by mode name: Wide, Narrow boresight, Front and back.

- **antenna_modes**: Optional array for any alternate radio or antenna mode whose gain or beamwidth differs from the default. Never drop an alternate mode.
  - Use this for dual 5 GHz, selectable beamwidth, and switchable gain.
  - Every sub-field except `"mode"` is optional.
  - Band keys allowed in any gain or beamwidth object: `"2.4"`, `"5"`, `"5-lower"`, `"5-upper"`, `"6"`.
  - Use `"5"` for a full-band 5 GHz radio. Use `"5-lower"` and `"5-upper"` when the vendor splits the band.
  - Example: `{ "mode": "Dual 5 GHz", "antenna_gain_dbi": { "2.4": 5.0, "5": 5.8, "5-upper": 10.5 } }`
  - Filters and sorting use the default `antenna_gain_dbi` only. The detail and compare views show each mode under the gain and beamwidth rows, labeled by mode name.

- **antenna_connectors**: Connector types and count.
  - Integrated antennas: `"None (internal antennas)"`. Keep a more specific parenthetical when the datasheet distinguishes them, such as `"None (internal directional antennas)"`.
  - Do not use `"N/A"` or `"none"`.
  - External examples: `"4× RP-SMA"`, `"8× N-type"`.

### Physical Specifications

- **form_factor**: `"Indoor"`, `"Outdoor"`, or `"Wallplate"`. Do not put hardened, ruggedized, or HazLoc in this field.

- **hardened**: Optional boolean. Set `true` only when the vendor calls that model hardened, including "indoor hardened" or "connectorized hardened", as the model's own description. A series title that says hardened is not enough. Omit the field otherwise. Do not set `false`. The table, detail, and compare views show it as hardened only when it is `true`.

- **dimensions**: Metric first. Imperial, when the vendor states it, goes in parentheses.
  - `"200 x 200 x 45 mm (7.9 x 7.9 x 1.8 in)"`
  - Use ` x ` between dimensions and a space before the unit (`45 mm`, not `45mm`).
  - If only imperial is documented, leave it and flag the entry for review. Do not invent a metric conversion.
  - Keep axis labels such as `(L)`, `(W)`, and `(H)` when dropping them would hide which dimension is which.

- **weight**: Metric first, imperial in parentheses. A space before the unit. `lb`, not `lbs`.
  - `"1.0 kg (2.2 lb)"` or `"500 g"`
  - If only imperial is documented, leave it and flag the entry. Do not invent a metric conversion.

- **operating_temp_range**: Temperature only. Humidity, IP, and NEMA text belong in the fields below.
  - Celsius first when both units are documented: `"0°C to 50°C (32°F to 122°F) operating"`.
  - Keep storage ranges and solar-load qualifiers.
  - Use an ASCII hyphen for negative temperatures, not the Unicode minus sign.
  - Do not add the word `"operating"` when the source string does not use it.
  - Example: `"0°C to 50°C operating"` or `"-40°C to +65°C operating; -40°C to +70°C storage"`.

- **operating_humidity**: Optional. The vendor's stated humidity string. Omit the field when the vendor does not document humidity. The detail and compare views show it as **Operating Humidity** only when it is present.
  - Format: `"X% to Y% RH non-condensing"`, with the word `"to"` and a percent sign on both numbers.
  - Example: `"5% to 95% RH non-condensing"`.

- **ingress_protection**: Optional. The vendor's stated enclosure rating. Keep a NEMA rating in this same string when the vendor states it together with the IP rating, for example `"IP66/67"` or `"IP67 / NEMA 4 enclosure"`. Omit the field when the vendor does not document an enclosure rating. The detail and compare views show it as **Ingress Protection** only when it is present.

- **hazloc_certification**: Optional. The vendor's stated certification string, for example `"Class I, Division 2, Groups A, B, C, D"`. Omit the field when the AP has no hazardous-location certification. The detail and compare views show it only when it is present.

### Features

- **radios_iot_features**: Array of IoT and additional radio features
  - Common values: `"BLE"`, `"Zigbee"`, `"GPS/GNSS"`, `"802.15.4 IoT radio"`, `"Scanning radio"`, `"UWB"`
  - Use an empty array `[]` if none

### References

- **datasheet_url**: Link to the official datasheet or product page

- **image_url**: Path to the product image
  - Format: `"images/vendor/vendor-model.png"`
  - Use a lowercase vendor name and model
  - Supported formats: `.png`, `.jpg`, `.jpeg`

- **msrp**: Stored, not shown. The table, finder, compare view, and detail page do not display it.
  - Format: `"$1,000"` or `"unknown"` if not available
  - Use `"~$1,000"` for approximate prices

### End of Sale Information (Optional)

- **end_of_sale_announcement_date**: Date the end of sale was announced
  - Format: `"February 7, 2025"` or `"2025-02-07"`
- **end_of_sale_date**: Date the product reached end of sale
  - Format: `"August 7, 2025"` or `"2025-08-07"`
- **end_of_support_date**: Date vendor support ends
  - Format: `"August 7, 2030"` or `"2030-08-07"`
- **end_of_sale_url**: URL of the official end-of-sale notice
- **manufacturer_suggested_replacement**: Replacement model or models
  - `"AP-655"` or `"AP-655, AP-675"`
  - `"None"` when the manufacturer explicitly states there is no replacement
  - Omit the field when replacement information is not available

## In the box and mounting

These fields cover two things: what ships with an AP, and the mounting parts you can order for it. Every value must trace to a vendor document (install guide, quick start guide, or ordering guide). If a document does not say it, it does not go in.

### `in_box` (on the AP entry in ap_data.json)

| State | Meaning |
|---|---|
| `in_box` absent | Not checked yet. The AP belongs on the to-check list. |
| `in_box: []` | The vendor document lists nothing that ships unconditionally beyond the AP. This includes guides where every package line is "orderable" or "if selected when you order". |
| `in_box: [ ... ]` | Everything the document lists as in the box. |

Rules:

- `in_box_source` is required whenever `in_box` is present, including the empty array. A confirmed empty box still needs a document behind it.
- List everything the document says ships, not only mounts: brackets, clips, screws, cable glands, grounding lugs, and so on.
- Paperwork the document lists (quick start guide, regulatory flyer, warranty statement, pointer card) is listed too.
- A line written as one kit with its contents (for example "Grounding lug kit (including a grounding lug and an M4 x 8 screw)" or "wall-mount anchor kit, including two screws and wall-mount anchors") stays one item. This differs from a heading that groups separate lines, which is dropped.
- `item` is the document's wording, verbatim.
- `part_number` is always present. Use `null` when the document publishes no number. Never use an empty string.
- `qty` is omitted when the document gives no count. Do not default a missing count to 1.
- When a document groups parts under a heading ("Default mounting brackets:", "Mount Kit", "Gift Box"), list the parts and drop the heading. Name each part from the same document's Brackets and Clips table when it has one.
- `in_box_condition` (optional, on the AP entry) is one string naming a condition the document attaches to the whole list, e.g. `"Ready to Go option"`. Omit it when the list is unconditional. Configure-to-order guides use `[]` instead, not a condition.

See `templates/in_box_template.json`.

### mounts.json (one record per orderable mounting part)

| Field | Required | Notes |
|---|---|---|
| `id` | Yes | Stable slug, lowercase with hyphens. Derived once from the first published part number (or vendor plus name when none is published) and never renamed, even if a part number changes later. |
| `part_numbers` | Yes | Every published number, each as `{ "vendor", "part_number" }`, verbatim. Include Cisco spare SKUs with the trailing `=` alongside the base number when both are published. Use `[]` when no number is published. A part number belongs to one record only. |
| `name` | Yes | Short descriptive name. |
| `mount_type` | Yes | Array. A part that does more than one job lists each, e.g. `["wall", "pole", "articulating"]`. |
| `environment` | No | `indoor`, `outdoor`, or `both`, from the mount's own document. Never copied from the AP. Omit when the document is silent. |
| `rail_width` | No | T-bar mounts only. Number as printed, unit written as `in` or `mm`: `"9/16 in"`, `"1 ½ in"`, `"24 mm"`. Never convert between units. Omit when not stated. |
| `rail_style` | No | T-bar mounts only. `flush`, `recessed`, or both. Omit when not stated. |
| `compatible_aps` | Yes | Site slugs (e.g. `cisco-cw9176i`). Only models a document names. |
| `sources` | Yes | Array of `{ "url", "doc", "aps" }`. `aps` lists which compatible APs that document supports. Every slug in `compatible_aps` must appear in at least one source. |
| `part_number_aliases` | No | Misprinted forms of a part number seen in vendor documents (e.g. Meraki printing `AIR-AP-TRAIL-R` for `AIR-AP-T-RAIL-R`), same shape as `part_numbers`. The in-box cross-check matches them; the site should not show them as orderable. Say in `notes` where the alias is printed. |
| `notes` | No | Omit when there is nothing to say. |

#### `mount_type` values

Surface: `ceiling_tbar`, `hard_ceiling`, `wall`, `pole`, `desk`, `strand`, `din_rail`, `beam`, `threaded_rod`
Form: `articulating`, `enclosure`, `adapter`

`adapter` covers a part that cannot mount the AP by itself: it joins the AP or its bracket to another bracket, or to a surface the bracket alone cannot reach. When it joins to a surface, an adapter also lists that surface, for example `["beam", "adapter"]` or `["threaded_rod", "adapter"]`. Flush and recessed are `rail_style` values, not mount types. `beam` is a clip or bracket that fastens the AP to a structural beam. `threaded_rod` is a bracket or adapter that hangs the AP from a threaded rod. Add a new type only when a real part does not fit any of these.

#### Compatibility rules

- A mount record is created only when a document names at least one AP model. When a document says a mount fits an entire family, list every in-scope model in that family. Add that document as a source with those models in `aps`, and quote the family wording in `notes`. "All C-series APs" and a compatibility list that prints "T350" are family statements.
- When two places in one document disagree about whether a model fits a mount, leave that model off and quote both places in the to-check list. A summary table that says yes does not override a procedure or table that says no. When two documents disagree, keep the model only on a mount that no document contradicts for it.
- Cisco and Cisco Meraki listings are separate records for the same hardware. A bracket that fits the hardware is listed on both slugs. The validator warns when only one twin is listed.
- When a second document adds compatibility for another AP, add a new entry to `sources` with that AP in its `aps` list.

#### Out of scope

Color, finish, and price.

See `templates/mount_template.json`. The example values there are illustrative only.

## Notes

- Strings are the default. Arrays: `antenna_type`, `radios_iot_features`, `antenna_modes`, `in_box`. Objects: `antenna_gain_dbi`, `beamwidth`, and the gain or beamwidth object inside a mode.
- `hardened`, `operating_humidity`, `ingress_protection`, `hazloc_certification`, `antenna_modes`, `in_box`, `in_box_source`, and `in_box_condition` are omitted when they do not apply. `hardened` is omitted rather than set to `false`. `in_box: []` means the document lists nothing that ships unconditionally. Do not set the other optional fields to empty strings or empty arrays just to hold a place.
- Use `"unknown"` for a missing `msrp`. The site does not display that field.
- Do not infer a number, temperature, certification class, or antenna type that the vendor documentation does not state.
