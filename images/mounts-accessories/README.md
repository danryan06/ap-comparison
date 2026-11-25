# Mount & accessory product photos

Product photos for entries in `mounts.json`, stored by vendor slug and mount `id`.

## Layout

```
images/mounts-accessories/<vendor>/<mount-id>.{jpg,png,webp}
```

Example: `images/mounts-accessories/cisco/cisco-air-ap-bracket-1.jpg`

## Inventory

See `manifest.json` for the full list of mounts with photos, missing IDs, and source notes.

These files are assets only — they are **not** wired into the UI or `mounts.json` in this change.

## Format

- Prefer JPEG product photos, typically max ~1200px on the long edge
- Ubiquiti Store assets retained as official PNG product renders
- Sources include vendor stores, CDW, distributor listings, and official accessory datasheet PDFs
