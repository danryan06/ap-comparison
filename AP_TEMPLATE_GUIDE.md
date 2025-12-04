# AP Data Template Guide

Use this template when submitting new AP entries. Copy the JSON structure below and fill in the values.

## Template JSON

```json
{
  "vendor": "Vendor Name",
  "model": "Model Number",
  "wifi_gen_radios": "Wi-Fi 6 (2.4/5) or Wi-Fi 6E (2.4/5/6) or Wi-Fi 7 (2.4/5/6)",
  "spatial_streams": "2x2 / 2x2 or 4x4 / 4x4 / 4x4",
  "min_poe_class": "802.3af (Class 3) or 802.3at (Class 4) or 802.3bt (Class 5/6)",
  "recommended_poe": "802.3at (Class 4) PoE+ for full performance",
  "behavior_min_power": "Description of what happens when AP runs on minimum PoE class",
  "ethernet_ports_speed": "1× 1/2.5 GbE mGig (RJ45) or 2× 10 GbE (RJ45)",
  "antenna_type": "Internal or External or Directional",
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
  "form_factor": "Indoor or Outdoor or Wallplate",
  "radios_iot_features": [
    "BLE",
    "Zigbee",
    "GPS/GNSS"
  ],
  "datasheet_url": "https://example.com/datasheet.pdf",
  "image_url": "images/vendor/vendor-model.png",
  "dimensions": "200 x 200 x 45 mm",
  "weight": "1.0 kg (2.2 lb)",
  "antenna_connectors": "None (internal antennas) or 4× RP-SMA",
  "operating_temp_range": "0°C to 50°C operating",
  "msrp": "$1,000 or unknown",
  "end_of_sale_announcement_date": "February 7, 2025 (optional)",
  "end_of_sale_date": "August 7, 2025 (optional)",
  "end_of_support_date": "August 7, 2025 (optional)",
  "end_of_sale_url": "https://vendor.com/eol-notice (optional)",
  "manufacturer_suggested_replacement": "AP-655, AP-675 (optional)"
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

### Power over Ethernet (PoE)

- **min_poe_class**: Minimum PoE class required for operation
  - Examples: `"802.3af (Class 3)"`, `"802.3at (Class 4)"`, `"802.3bt (Class 5)"`

- **recommended_poe**: Recommended PoE class for full performance
  - Example: `"802.3at (Class 4) PoE+ for full performance"`

- **behavior_min_power**: What happens when running on minimum PoE
  - Describe feature reductions, disabled ports, reduced power, etc.
  - Example: `"On 802.3af, USB is disabled and radios operate at reduced power"`

### Network Interfaces

- **ethernet_ports_speed**: Ethernet port specifications
  - Format: `"1× 1/2.5 GbE mGig (RJ45)"`
  - Format: `"2× 100M/1G/2.5G/5G/10G mGig (RJ45)"`
  - Include PoE capabilities if applicable

### Antenna Information

- **antenna_type**: `"Internal"`, `"External"`, or `"Directional"`

- **antenna_gain_dbi**: Antenna gain per band (optional, only if specified in datasheet)
  - Object format: `{"2.4": 4.5, "5": 5.0, "6": 5.5}`
  - Values are numeric (dBi units implied)
  - Omit this field if not available

- **beamwidth**: Antenna beamwidth per band (optional, typically for directional antennas)
  - Object format: `{"2.4": "70° x 70°", "5": "70° x 70°", "6": "60° x 60°"}`
  - Format: `"azimuth° x elevation°"` (e.g., `"70° x 70°"`)
  - For multiple selectable patterns: `"90° x 90°, 90° x 30°, 30° x 30°"`
  - Omit this field if not specified by manufacturer
  - Typically only applicable to directional/external antenna models

- **antenna_connectors**: Connector types and count
  - Examples: `"None (internal antennas)"`, `"4× RP-SMA"`, `"8× N-type"`

### Physical Specifications

- **form_factor**: `"Indoor"`, `"Outdoor"`, or `"Wallplate"`

- **dimensions**: Physical dimensions
  - Format: `"200 x 200 x 45 mm"` or `"7.9 x 7.9 x 1.8 in"` or both

- **weight**: Weight specification
  - Format: `"1.0 kg (2.2 lb)"` or `"500 g"`

- **operating_temp_range**: Operating temperature range
  - Format: `"0°C to 50°C operating"` or `"32°F to 122°F (0°C to 50°C)"`
  - Include storage temp if significantly different

### Features

- **radios_iot_features**: Array of IoT and additional radio features
  - Common values: `"BLE"`, `"Zigbee"`, `"GPS/GNSS"`, `"802.15.4 IoT radio"`, `"Scanning radio"`, `"UWB"`
  - Use empty array `[]` if none

### References

- **datasheet_url**: Link to official datasheet or product page

- **image_url**: Path to product image
  - Format: `"images/vendor/vendor-model.png"`
  - Use lowercase vendor name and model
  - Supported formats: `.png`, `.jpg`, `.jpeg`

- **msrp**: Manufacturer's Suggested Retail Price
  - Format: `"$1,000"` or `"unknown"` if not available
  - Use `"~$1,000"` for approximate prices

### End of Sale Information (Optional)

- **end_of_sale_announcement_date**: Date when the end of sale was announced
  - Format: `"February 7, 2025"` or `"2025-02-07"`
  - Only include if the product has been announced as end-of-sale

- **end_of_sale_date**: Date when the product reached end of sale
  - Format: `"August 7, 2025"` or `"2025-08-07"`
  - Only include if the product has been discontinued/end-of-saled

- **end_of_support_date**: Date when vendor support ends
  - Format: `"August 7, 2025"` or `"2025-08-07"`
  - Only include if vendor has specified an end of support date

- **end_of_sale_url**: URL to official end of sale/end of life notice
  - Format: `"https://vendor.com/eol-notice/ap-model"`
  - Link to vendor's official announcement or support page

- **manufacturer_suggested_replacement**: Model number(s) recommended as replacement
  - Format: `"AP-655"` for single replacement
  - Format: `"AP-655, AP-675"` for multiple replacement options
  - Use `"None"` if manufacturer explicitly states no replacement
  - Omit this field if replacement information is not available

## Notes

- All fields are strings except `antenna_gain_dbi` (object) and `radios_iot_features` (array)
- Use `"unknown"` for missing optional information
- Keep descriptions concise but informative
- Follow existing formatting conventions in `ap_data.json`

