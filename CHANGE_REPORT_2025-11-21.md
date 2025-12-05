# Change Report: Since Fri Nov 21, 2025, 05:18:10 PM EST

## Summary Statistics

- **Total APs in database (before)**: 90
- **Total APs in database (now)**: 154
- **New APs added**: 64
- **APs modified**: 20+
- **Net growth**: +64 APs (+71.1%)
- **Manufacturers (before)**: 12
- **Manufacturers (now)**: 14
- **New manufacturers added**: 2 (Alcatel-Lucent, TP-Link Omada)

---

## New APs Added (64 total)

### Alcatel-Lucent (5 APs)
- AP1511
- AP1521
- AP1561
- AP1571
- AP1572

### Aruba (24 APs)
- AP-518
- AP-565
- AP-567
- AP-574
- AP-575
- AP-577
- AP-584
- AP-585
- AP-587
- AP-675
- AP-675EX
- AP-677
- AP-677EX
- AP-679
- AP-679EX
- AP-763
- AP-764
- AP-765
- AP-765EX

### Cisco (9 APs)
- 9105AXI
- 9105AXW
- 9115AXE
- 9115AXI
- 9120AXE
- 9120AXI
- 9130AXE
- 9130AXI
- 9178I

**Note:** Additional Cisco 917X series APs (CW9172H, CW9172I, CW9174I, CW9176D1, CW9176I, CW9179F) were added and updated during this period, with comprehensive PoE behavior documentation and formatting improvements.

### Extreme Networks (6 APs)
- AP3000
- AP3000X
- AP302W
- AP305C
- AP4000
- AP410e
- AP410i

### Juniper (2 APs)
- AP32
- AP32E

### Ruckus (17 APs)
- H350
- H550
- H670
- R350
- R350e
- R370
- R550
- R560
- R650
- R670
- R750
- R760
- R770
- T350c
- T350d
- T350se
- T670
- T670sn
- T750
- T750SE

### TP-Link (1 AP)
- Omada EAP610

### Ubiquiti (1 AP)
- E7 Audience

---

## Modified APs (20+ total)

### Aruba (7 APs)
**AP-615, AP-635, AP-655, AP-725, AP-735, AP-745, AP-755**
- Added `antenna_gain_dbi` field with per-band values (2.4, 5, 6 GHz)

### Cisco (4 APs)
**Catalyst 9166D1**
- Added `beamwidth` field: 2.4 GHz: 70° x 70°, 5 GHz: 70° x 70°, 6 GHz: 60° x 60°

**CW9172I**
- Updated formatting for `recommended_poe`, `behavior_min_power`, `radios_iot_features`, `operating_temp_range`

**Meraki MR46E**
- Updated `antenna_connectors`: 4x RP-TNC → 6x RP-TNC female connectors

**Meraki MR56**
- Added comprehensive end-of-sale information:
  - `end_of_sale_announcement_date`: February 7, 2025
  - `end_of_sale_date`: August 7, 2025
  - `end_of_support_date`: August 7, 2030
  - `end_of_sale_url`: Added official notice URL
- Updated formatting for `recommended_poe`, `min_poe_class`, `behavior_min_power`
- Added `antenna_gain_dbi` field
- Standardized field formatting (dimensions, operating_temp_range, antenna_connectors)

### Fortinet (2 APs)
**FAP-432G**
- Added `recommended_poe`: "802.3bt (Class 5) PoE++ for full performance"

**FAP-441K**
- Updated `antenna_type`: External → Internal (omnidirectional)
- Updated `antenna_connectors`: 10× RP-SMA → None (internal antennas)

### Juniper (2 APs)
**AP47D**
- Added `beamwidth` field: 2.4/5/6 GHz: 60° x 60°

**AP66D**
- Added `beamwidth` field: 2.4/5/6 GHz: 90° x 90°, 90° x 30°, 30° x 30° (multiple patterns)

### Ruckus (6 APs)
**R350, R350e**
- Updated `min_poe_class` and `behavior_min_power` for accurate PoE behavior documentation

**R370**
- Updated `min_poe_class`: 802.3af (Class 3)
- Updated `behavior_min_power`: Detailed power mode descriptions
- Added `datasheet_url`

**R760**
- Updated `min_poe_class`: 802.3at (Class 4)
- Updated `recommended_poe`: "802.3bt (Class 5) PoE++ for full performance"
- Updated `behavior_min_power`: Comprehensive power mode descriptions

**R850**
- Updated `min_poe_class`: 802.3at (Class 4) → 802.3af (Class 3)
- Updated `behavior_min_power`: Comprehensive description of power modes
- Updated `recommended_poe`: Standardized formatting
- Added `image_url`: images/ruckus/ruckus-r850.png
- Updated `datasheet_url`: New Commscope URL
- Standardized formatting for dimensions, weight, ethernet_ports_speed, spatial_streams
- Updated `radios_iot_features`: Simplified and standardized
- Updated `operating_temp_range`: Fixed temperature range formatting

**T670, T670sn**
- Updated `min_poe_class`: 802.3bt (Class 5)
- Updated `recommended_poe`: "802.3bt (Class 5) PoE++ for full performance"
- Updated `behavior_min_power`: Detailed power mode descriptions
- Added `datasheet_url`

---

## Site Updates & New Features

### 1. Beamwidth Field Support
- Added `beamwidth` field to display antenna beamwidth patterns for directional APs
- Currently populated for: Cisco Catalyst 9166D1, Juniper AP47D, Juniper AP66D
- Supports per-band values (2.4, 5, 6 GHz) with multiple pattern support

### 2. Section-Based Layout
- Reorganized AP details page with logical sections:
  - Basic Information
  - Power Requirements
  - Connectivity
  - Antenna Specifications
  - Physical Specifications
  - End of Life Information
  - Documentation
- Improved visual hierarchy and readability

### 3. Enhanced Beamwidth Display
- Beamwidth values displayed with styled bands
- Shows GHz labels (2.4 GHz, 5 GHz, 6 GHz)
- Subtle gray background highlighting for better visibility

### 4. End of Sale (EOS) Features
- Comprehensive EOS tracking system with:
  - `end_of_sale_announcement_date`
  - `end_of_sale_date`
  - `end_of_support_date`
  - `end_of_sale_url`
  - `manufacturer_suggested_replacement`
- Currently populated for: Cisco Meraki MR56, Extreme AP305C

### 5. EOS Visual Alert Banner
- Prominent alert banner displayed for APs that have reached end of sale
- Shows key dates and links to official notices
- Displays manufacturer suggested replacement when available

### 6. EOS Field Highlighting
- EOS-related fields highlighted with special orange/yellow styling
- Makes end-of-life information easily identifiable

### 7. Clickable URL Fields
- All URL fields are now clickable links:
  - `datasheet_url`
  - `install_guide_url`
  - `end_of_sale_url`
- Opens in new tab with proper security attributes

### 8. Compare Page Beamwidth Support
- Added beamwidth to comparison view
- Each beamwidth band displayed on its own line
- Includes GHz labels for clarity

### 9. CSV Export Enhancement
- Updated CSV export to properly format:
  - `beamwidth` objects (per-band values)
  - `antenna_gain_dbi` objects (per-band values with dBi units)

### 10. Preview Files System
- Created `ap-preview.html` and `compare-preview.html` for testing
- Allows feature testing before production deployment
- Uses `style-preview.css` for isolated styling

### 11. Image Management
- Added images for all new APs:
  - Cisco 9100AX series (7 images)
  - Cisco 917X series (6 images)
  - Juniper AP32 (1 image)
  - Extreme AP410 (1 image)
  - Ruckus series (19 images)
- Total: 34+ new images added

### 12. Template Guide Updates
- Updated `AP_TEMPLATE_GUIDE.md` with:
  - Beamwidth field documentation and examples
  - End-of-sale fields documentation
  - Updated JSON template examples

### 13. Inline Action Buttons
- Moved datasheet and install guide buttons to prominent inline position
- Positioned below AP image, above specifications
- Improved accessibility and user experience
- Clean, modern button design with icons

### 14. Optimized Section Spacing
- Refined section divider spacing to match table row spacing (0.875rem)
- Balanced spacing between sections and dividing lines
- Improved visual consistency across the site
- Better readability and visual hierarchy

---

## Technical Improvements

### Code Quality
- Standardized field formatting across all entries
- Improved data consistency (e.g., antenna_connectors, operating_temp_range)
- Enhanced error handling and validation

### User Experience
- Better visual organization with section-based layout
- Improved readability with enhanced styling
- More informative displays (beamwidth bands, EOS alerts)

### Data Completeness
- Added missing `antenna_gain_dbi` values for 7 Aruba APs
- Added datasheet URLs for all Ruckus APs
- Standardized PoE class formatting
- Enhanced behavior descriptions for power modes

---

## Files Changed

### Core Application Files
- `ap.html` - Major updates for sections, beamwidth, EOS features, inline action buttons
- `compare.html` - Added beamwidth support
- `style.css` - New styling for sections, beamwidth, EOS, inline actions, optimized spacing
- `ap_data.json` - 70 new entries, 20+ modified entries

### Documentation
- `AP_TEMPLATE_GUIDE.md` - Updated with new field documentation

### Preview/Testing
- `ap-preview.html` - New preview file
- `compare-preview.html` - New preview file
- `style-preview.css` - Preview styling

### Images
- 34+ new AP images added across multiple vendor folders

---

## Commit History Summary

**Total commits since baseline**: 50+ commits
**Key feature commits**:
- Beamwidth field support and data
- End-of-sale features and MR56 EOL information
- Section-based layout and enhanced display
- Inline action buttons for better UX
- Optimized section spacing for visual consistency
- Multiple AP additions (Alcatel-Lucent, Aruba, Cisco, Extreme, Juniper, Ruckus, TP-Link, Ubiquiti)
- Cisco 917X series Wi-Fi 7 APs (6 models)
- Image additions and management
- Data quality improvements and corrections
- PoE behavior documentation enhancements

---

*Report generated: December 2025*
*Baseline: Fri Nov 21, 2025, 05:18:10 PM EST*
*Last updated: December 2025*

