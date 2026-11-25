# Mount & accessory images

Images for entries in `mounts.json`, stored by vendor slug and mount `id`.

## Layout

```
images/mounts-accessories/<vendor>/<mount-id>.{jpg,png}
```

## Sourcing rule

Every image comes from the **vendor's own site**: a product page, datasheet, install guide, or ordering guide on the vendor domain (including official docs/CDN subdomains). Distributor, reseller, marketplace, and image-search sources are not used.

## Manifest

See `manifest.json` for one entry per image:

- `mount_id`, `vendor`, `file`
- `image_type`: `photo` or `drawing`
- `source_page_url`: vendor-hosted page or PDF
- `source_detail`: figure/page notes
- `retrieved`: ISO date

## Format

- Photos: JPEG, ~1200px max edge (Ubiquiti official PNGs kept as PNG)
- Drawings: PNG, ~1200px max edge (crop/resize only)

These assets are optional in the AP detail UI. Line drawings show a Drawing caption under the image.
