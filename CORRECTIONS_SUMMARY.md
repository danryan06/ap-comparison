# Corrections Summary - 5 AP Entries

## Changes Applied to All Entries

### 1. PoE Class Formatting
- **Before**: `"802.3at"` or `"802.3bt"`
- **After**: `"802.3at (Class 4)"` or `"802.3bt (Class 6)"`
- Applied to both `min_poe_class` and `recommended_poe` fields

### 2. Recommended PoE Descriptions
- **Before**: Brief like `"802.3at"` or `"802.3bt"`
- **After**: Full descriptions like:
  - `"802.3at (Class 4) PoE+ for full performance"`
  - `"802.3bt (Class 6) PoE++ for full performance"`

### 3. Behavior at Min Power
- **Before**: Brief descriptions or contained newlines (`\n`)
- **After**: Single-line descriptive text starting with "On [PoE class], ..." explaining what happens

### 4. Ethernet Port Speed Formatting
- **Before**: Inconsistent spacing, mixed use of `1x` vs `1×`
- **After**: Consistent use of `×` (multiplication sign), proper spacing, clear port descriptions

### 5. Image URLs
- **Before**: Empty strings `""` for AP1561 and AP1571
- **After**: Proper paths following the pattern `"images/alcatel-lucent-enterprise/alcatel-lucent-enterprise-[model].png"`

### 6. Datasheet URLs
- **AP1571**: Changed from AP1570 datasheet to AP1571 datasheet
- **AP1572**: Changed from AP1561 datasheet to AP1572 datasheet
- **Note**: Please verify these URLs are correct as I don't have access to verify them

### 7. Antenna Connectors
- **AP1572**: Simplified from long description to `"6× N-type connectors"` to match format of other entries

## Entry-Specific Changes

### AP1511 (PR #88)
- ✅ Added `(Class 4)` to PoE fields
- ✅ Expanded `recommended_poe` description
- ✅ Expanded `behavior_min_power` to match template style
- ✅ Standardized ethernet port formatting

### AP1521 (PR #90)
- ✅ Added `(Class 4)` and `(Class 6)` to PoE fields
- ✅ Expanded `recommended_poe` description
- ✅ Removed newline from `behavior_min_power`, expanded description
- ✅ Standardized ethernet port formatting (changed `1x` to `1×`, added spacing)

### AP1561 (PR #92)
- ✅ Added `(Class 4)` to PoE fields
- ✅ Expanded `recommended_poe` description
- ✅ Expanded `behavior_min_power` to match template style
- ✅ Added proper image URL path

### AP1572 (PR #94)
- ✅ Added `(Class 4)` and `(Class 6)` to PoE fields
- ✅ Expanded `recommended_poe` description
- ✅ Removed newline from `behavior_min_power`, expanded description
- ✅ Standardized ethernet port formatting
- ✅ Fixed datasheet URL (was pointing to AP1561)
- ✅ Simplified antenna connector description

### AP1571 (PR #96)
- ✅ Added `(Class 4)` and `(Class 6)` to PoE fields
- ✅ Expanded `recommended_poe` description
- ✅ Removed newline from `behavior_min_power`, expanded description
- ✅ Standardized ethernet port formatting
- ✅ Fixed datasheet URL (was pointing to AP1570)
- ✅ Added proper image URL path

## Verification Needed

Please verify these datasheet URLs are correct:
- AP1571: `https://www.al-enterprise.com/-/media/assets/internet/documents/omniaccess-stellar-oaw-ap1571-datasheet-en.pdf`
- AP1572: `https://www.al-enterprise.com/-/media/assets/internet/documents/omniaccess-stellar-oaw-ap1572-datasheet-en.pdf`

If these URLs don't exist, you may need to find the correct ones or use the closest available datasheet.

## Ready to Merge

All entries now match the formatting and style of the existing `ap_data.json` entries. The corrected entries are in `CORRECTED_AP_ENTRIES.json` and can be used to update the PRs.

