# Pull Request Review - 5 New AP Entries

## Summary
Reviewing 5 PRs for new Alcatel-Lucent Enterprise AP entries:
- PR #88: AP1511
- PR #90: AP1521  
- PR #92: AP1561
- PR #94: AP1572
- PR #96: AP1571

## Issues Found

### 1. **PoE Class Formatting** (All 5 entries)
**Issue**: `min_poe_class` and `recommended_poe` don't include the class number in parentheses.

**Current format**: `"802.3at"` or `"802.3bt"`
**Expected format**: `"802.3at (Class 4)"` or `"802.3bt (Class 6)"`

**Examples from existing data**:
- `"min_poe_class": "802.3at (Class 4)"`
- `"recommended_poe": "802.3at (Class 4) PoE+ for full performance"`

**Fix needed**: Add class numbers to all PoE fields.

### 2. **Recommended PoE Descriptions** (All 5 entries)
**Issue**: `recommended_poe` is too brief and doesn't match the template format.

**Current examples**:
- `"802.3at"` (AP1511, AP1561)
- `"802.3bt"` (AP1521, AP1571, AP1572)

**Expected format**: Should include "PoE+" or "PoE++" and "for full performance" or similar descriptive text.

**Examples from existing data**:
- `"802.3at (Class 4) PoE+ for full performance"`
- `"802.3bt (Class 6) PoE++ for full performance"`

### 3. **Behavior at Min Power** (All 5 entries)
**Issue**: Descriptions are inconsistent and some contain newlines that may not render properly.

**AP1511 & AP1561**: `"802.3at is stated as the minimum"` - Too brief, doesn't describe actual behavior.

**AP1521, AP1571, AP1572**: Contains `\n` newline characters which may not display correctly in JSON/HTML.

**Expected format**: Single-line descriptive text explaining what features are disabled/reduced.

**Example from existing data**:
- `"On 802.3at (Class 4) PoE+, USB is disabled, LAN2 is disabled, the 2.4 GHz radio is limited to 2x2 operation, and the multi-function radio EIRP is reduced by 3 dB."`

### 4. **Ethernet Port Speed Formatting** (All 5 entries)
**Issue**: Inconsistent formatting with spacing and port descriptions.

**Current examples**:
- `"1× 5 GbE (RJ45, PoE)"` - Missing space after "1×"
- `"1× 10 GbE (RJ45, PoE), 1x 1 GbE Uplink/Downlink"` - Inconsistent "1x" vs "1×", inconsistent spacing
- `"1× 10 GbE (RJ45, PoE) or SFP/SFP+ Combo, 1x 1 GbE Uplink/Downlink"` - Same issues

**Expected format**: Consistent use of `×` (multiplication sign), consistent spacing, clear port descriptions.

**Examples from existing data**:
- `"1× 100/1000/2500BASE-T SmartRate (RJ45) + 1× 10/100/1000BASE-T (RJ45)"`
- `"2× 100M/1G/2.5G/5G/10G (RJ45, PoE++)"`

### 5. **Datasheet URLs** (2 entries)
**Issue**: Wrong datasheet URLs pointing to different models.

**AP1572**: Points to AP1561 datasheet
- Current: `"https://www.al-enterprise.com/-/media/assets/internet/documents/omniaccess-stellar-oaw-ap1561-datasheet-en.pdf"`
- Should be: AP1572 datasheet URL

**AP1571**: Points to AP1570 datasheet  
- Current: `"https://www.al-enterprise.com/-/media/assets/internet/documents/omniaccess-stellar-oaw-ap1570-datasheet-en.pdf"`
- Should be: AP1571 datasheet URL

### 6. **Image URLs** (2 entries)
**Issue**: Empty image URLs instead of proper paths.

**AP1561**: `"image_url": ""`
**AP1571**: `"image_url": ""`

**Expected**: Should have proper image paths like `"images/alcatel-lucent-enterprise/alcatel-lucent-enterprise-ap1561.png"` or be set to a placeholder if images aren't available yet.

### 7. **Antenna Connectors** (1 entry)
**Issue**: AP1572 has a very long, detailed description that may need formatting.

**Current**: `"6 N-Type female antenna connectors, integrated 6KA lightning protection"`

**Note**: This is acceptable but could be simplified to match other entries. Most entries use shorter descriptions like `"6× N-type connectors"` or `"8× RP-SMA connectors"`.

## Recommendations

### High Priority Fixes (Before Merge)
1. ✅ Add class numbers to all PoE fields
2. ✅ Expand `recommended_poe` descriptions to match template
3. ✅ Fix datasheet URLs for AP1571 and AP1572
4. ✅ Fix or clarify image URLs for AP1561 and AP1571
5. ✅ Remove newlines from `behavior_min_power` and expand descriptions
6. ✅ Standardize ethernet port speed formatting

### Medium Priority (Nice to Have)
1. Simplify antenna connector description for AP1572
2. Ensure consistent spacing in all fields

## Corrected Examples

### AP1511 (Corrected)
```json
{
  "vendor": "Alcatel-Lucent Enterprise",
  "model": "AP1511",
  "wifi_gen_radios": "Wi-Fi 7 (2.4/5/6)",
  "spatial_streams": "2x2 / 2x2 / 2x2",
  "min_poe_class": "802.3at (Class 4)",
  "recommended_poe": "802.3at (Class 4) PoE+ for full performance",
  "behavior_min_power": "On 802.3at (Class 4) PoE+, the AP operates at full functionality with all radios enabled.",
  "ethernet_ports_speed": "1× 5 GbE (RJ45, PoE)",
  ...
}
```

### AP1521 (Corrected)
```json
{
  "min_poe_class": "802.3at (Class 4)",
  "recommended_poe": "802.3bt (Class 6) PoE++ for full performance",
  "behavior_min_power": "On 802.3at (Class 4) PoE+, Wi-Fi operates at 2.4GHz 2x2, 5GHz 4x4, 6GHz 2x2 with wired uplink at 2.5 GbE. Scanning Radio, IoT Radio, Eth1, and USB port are disabled.",
  "ethernet_ports_speed": "1× 10 GbE (RJ45, PoE) + 1× 1 GbE (RJ45, uplink/downlink)",
  ...
}
```

## Conclusion

All 5 entries need formatting adjustments to match the template and existing data format. The data appears accurate but needs standardization. Once these formatting issues are addressed, the PRs should be ready to merge.

