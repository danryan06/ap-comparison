# Enterprise AP Comparison Database

A comprehensive, open-source database for comparing enterprise Wi-Fi access points. Explore, filter, and compare access points from major vendors including Juniper, Cisco, Aruba, Ruckus, Extreme, and more.

🌐 **Live Site:** [apcomparison.com](https://apcomparison.com) | [GitHub Pages](https://danryan06.github.io/ap-comparison)

## Features

- **Comprehensive Comparison Table**: View all access points in a sortable, filterable table
- **Advanced Filtering**: Filter by vendor, antenna type (Internal/External/Directional), and form factor (Indoor/Outdoor/Wallplate)
- **Full-Text Search**: Search across all fields including vendor, model, features, and PoE requirements
- **Side-by-Side Comparison**: Select multiple APs and compare them side-by-side
- **Detailed AP Pages**: Click any AP to view complete specifications and images
- **Customizable Columns**: Show/hide columns to focus on what matters to you
- **Column Management**: Resize and reorder columns to your preference
- **Data Export**: Export individual AP details or comparison tables to CSV
- **Data Quality Dashboard**: View missing information and data quality issues
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Theme**: Easy on the eyes with a modern dark interface

## Data Fields

Each access point entry includes:

- **Basic Info**: Vendor, Model
- **Wi-Fi Specifications**: Wi-Fi generation, radios, spatial streams
- **Power Requirements**: Minimum PoE class, recommended PoE, behavior at minimum power
- **Connectivity**: Ethernet ports and speeds
- **Physical**: Antenna type, form factor, dimensions, weight, antenna connectors
- **Environmental**: Operating temperature range
- **Additional Features**: Radios & IoT features (Zigbee, Bluetooth, etc.)
- **Pricing**: MSRP
- **Documentation**: Datasheet URL
- **Visual**: Product images

## How to Use

### Browsing and Filtering

1. **Search**: Use the search box to find APs by vendor, model, or features
2. **Filter**: Use the dropdown filters to narrow by vendor, antenna type, or form factor
3. **Sort**: Click any column header to sort by that field
4. **Customize Columns**: Click "Choose Columns" to show/hide specific fields
5. **View Details**: Click any row to see the full AP details page

### Comparing APs

1. Select APs using the radio buttons in the table
2. Click the "Compare" button that appears (shows count of selected APs)
3. On the comparison page, use "Choose Columns" to customize which fields to compare
4. Export the comparison to CSV if needed

### Exporting Data

- **Single AP**: On any AP details page, click "Export CSV"
- **Comparison**: On the comparison page, click "Export CSV"
- **Data Quality**: On the data quality page, click "Export Issues CSV"

## Contributing

We welcome contributions! You can add new access points or update existing entries.

### Submitting a New AP

1. Visit the [Submit New AP](https://apcomparison.com/submit.html) page
2. Fill out the form with all available information
3. Optionally provide an image URL (or attach an image file in the GitHub issue)
4. Click "Generate JSON Snippet"
5. Click "Open GitHub Issue with This Entry"
6. Review the pre-filled GitHub issue and submit it

The submission will be automatically processed via GitHub Actions, which will:
- Validate the data
- Download and store any images
- Create a pull request with the new entry

### Editing an Existing AP

1. Visit the [Edit Existing AP](https://apcomparison.com/edit.html) page
2. Select the AP you want to edit from the dropdown
3. The form will pre-populate with current data
4. Update only the fields that need changes
5. Click "Generate Updated JSON Snippet"
6. Click "Open GitHub Issue with This Update"
7. Review and submit the GitHub issue

The edit will be automatically processed and a pull request will be created.

### Image Guidelines

- Images should be clear product photos of the access point
- Supported formats: PNG, JPG, GIF, WebP
- **Option 1**: Provide an image URL in the form's "Image URL" field
- **Option 2**: After opening the GitHub issue, you can drag-and-drop an image file directly into the GitHub issue body (GitHub will host it and our automation will detect and download it)
- Images are automatically downloaded and stored in the `images/` directory
- Filenames are automatically generated from vendor and model (e.g., `juniper-ap45.jpg`)

## Technical Details

### Architecture

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Data Storage**: JSON file (`ap_data.json`)
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions for automated processing of submissions
- **Data Validation**: Automated validation on pull requests

### Project Structure

```
├── index.html          # Main comparison table
├── ap.html            # Individual AP details page
├── compare.html       # Side-by-side comparison page
├── submit.html        # New AP submission form
├── edit.html          # Edit existing AP form
├── data_issues.html  # Data quality dashboard
├── style.css          # All styling
├── ap_data.json       # Main data file
├── images/            # AP product images
├── .github/
│   ├── workflows/     # GitHub Actions workflows
│   ├── scripts/       # Automation scripts
│   └── ISSUE_TEMPLATE/ # Issue templates
└── README.md          # This file
```

### Data Format

The `ap_data.json` file contains an array of AP objects. Each object follows this structure:

```json
{
  "vendor": "Juniper",
  "model": "AP45",
  "wifi_gen_radios": "Wi-Fi 6E (2.4/5/6)",
  "spatial_streams": "4x4 / 4x4 / 4x4",
  "min_poe_class": "802.3at (Class 4)",
  "recommended_poe": "802.3bt (Class 6)",
  "behavior_min_power": "All radios active, USB disabled",
  "ethernet_ports_speed": "1x 2.5GbE",
  "antenna_type": "Internal",
  "form_factor": "Indoor",
  "dimensions": "220 x 220 x 51 mm",
  "weight": "850g",
  "antenna_connectors": "N/A",
  "operating_temp_range": "0°C to 50°C",
  "radios_iot_features": "Zigbee, Bluetooth 5.0",
  "msrp": "$1,195",
  "datasheet_url": "https://example.com/datasheet.pdf",
  "image_url": "images/juniper-ap45.jpg"
}
```

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript required
- Responsive design works on mobile devices

## Data Quality

The project includes automated data quality checks:
- Missing required fields
- Duplicate vendor/model combinations
- Invalid URLs
- Data format validation

View the [Data Quality Dashboard](https://apcomparison.com/data_issues.html) to see current issues.

## License

This project is open source. The data is maintained by the community.

## Maintainer

Maintained by [Dan Ryan](https://github.com/danryan06).

## Acknowledgments

Thanks to all contributors who submit and update access point information to keep this database comprehensive and accurate.

---

**Note**: This is a community-maintained project. While we strive for accuracy, always verify specifications with official vendor documentation before making purchasing decisions.
