# Enterprise AP Comparison Database

A comprehensive, open-source database for comparing enterprise Wi-Fi access points. Explore, filter, and compare access points from major vendors including Juniper, Cisco, Aruba, Ruckus, Extreme, and more.

🌐 **Live Site:** [apcomparison.com](https://apcomparison.com) | [GitHub Pages](https://danryan06.github.io/ap-comparison)

## Features

- **Comprehensive Comparison Table**: View all access points in a sortable, filterable table
- **Advanced Filtering**: Filter by vendor, antenna type (Internal/External/Directional), and form factor (Indoor/Outdoor/Wallplate)
- **Feature Finder**: Interactive wizard styled after sizing tools that lets you pick Wi-Fi generations, preferred vendors, and antenna/form-factor requirements to instantly narrow the catalog
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
- **Antenna gain and beamwidth (where published)**
- **Environmental**: Operating temperature range
- **Mounting**: what ships in the box (in_box) and orderable mounting parts (mounts.json)
- **Lifecycle**: end-of-sale and end-of-support dates (where published)
- **Additional Features**: Radios & IoT features (Zigbee, Bluetooth, etc.)
- **Documentation**: Datasheet URL
- **Visual**: Product images

## How to Use

### Browsing and Filtering

1. **Search**: Use the search box to find APs by vendor, model, or features
2. **Filter**: Use the dropdown filters to narrow by vendor, antenna type, or form factor
3. **Feature Finder**: Open the [AP Feature Finder](https://apcomparison.com/finder.html) to filter by Wi-Fi generation, vendors, form factors, and internal vs. external antennas and view only matching APs
4. **Sort**: Click any column header to sort by that field
5. **Customize Columns**: Click "Choose Columns" to show/hide specific fields
6. **View Details**: Click any row to see the full AP details page

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

After a maintainer reviews the issue and adds the `ap-submission` label, GitHub Actions will:
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

After a maintainer reviews the issue and adds the `ap-submission` label, GitHub Actions will create a pull request.

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
├── finder.html        # Feature finder
├── submit.html        # New AP submission form
├── edit.html          # Edit existing AP form
├── data_issues.html  # Data quality dashboard
├── style.css          # All styling
├── ap-format.js       # Shared formatting helpers
├── ap_data.json       # Main data file
├── mounts.json        # Orderable mounting parts
├── ap_template.json   # AP entry template
├── AP_TEMPLATE_GUIDE.md # Field rules for new entries
├── data/antenna-compatibility/  # RF profile authoring source + taxonomy
├── exports/antenna-compatibility/v1/  # Public AP RF profile export + schema
├── templates/         # in_box and mount templates
│   ├── in_box_template.json
│   └── mount_template.json
├── images/            # AP product images
├── CNAME              # GitHub Pages custom domain
├── LICENSE            # MIT License
├── .github/
│   ├── workflows/     # GitHub Actions workflows
│   └── scripts/       # Automation scripts
└── README.md          # This file
```

### Data Format

The `ap_data.json` file contains an array of AP objects. The entry template is `ap_template.json`. Field rules are in `AP_TEMPLATE_GUIDE.md`. Orderable mounting parts are in `mounts.json`. What ships with an AP is `in_box` on that AP.

### Antenna compatibility export (v1)

Structured RF interface profiles for external/connectorized APs are published for AntennaComparison to pin:

- `exports/antenna-compatibility/v1/ap-profiles.json`
- `exports/antenna-compatibility/v1/ap-profiles.schema.json`

Authoring source lives under `data/antenna-compatibility/`. Regenerate and validate with:

```bash
node .github/scripts/generate-ap-rf-export.js
node .github/scripts/validate-ap-rf-export.js
```

Existing browse/detail/compare display fields are unchanged. Profiles mark unsourced mating facts (for example connector gender) under `completeness.missing` so consumers can require review instead of guessing.

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript required
- Responsive design works on mobile devices

## Data Quality

The project includes automated data quality checks:
- Missing required fields
- Duplicate vendor/model combinations
- Single-line URL format
- Data format validation

View the [Data Quality Dashboard](https://apcomparison.com/data_issues.html) to see current issues.

## License

Code is released under the MIT License (see LICENSE). Product images are the property of their respective vendors and are used for identification only. Specifications come from vendor documentation; always verify with the vendor before purchasing. Part numbers use JetBrains Mono, licensed under the SIL Open Font License (fonts/OFL.txt).

## Maintainer

Maintained by [Dan Ryan](https://github.com/danryan06).

## Acknowledgments

Thanks to all contributors who submit and update access point information to keep this database comprehensive and accurate.

---

**Note**: This is a community-maintained project. While we strive for accuracy, always verify specifications with official vendor documentation before making purchasing decisions.
