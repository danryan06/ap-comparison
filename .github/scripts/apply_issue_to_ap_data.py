#!/usr/bin/env python3
import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


def extract_json(body: str) -> dict:
    """
    Extract a JSON object from the issue body, preferring fenced code blocks.

    Priority order:
      1. A ```json ... ``` fenced block
      2. Any ``` ... ``` fenced block
      3. A bare {...} JSON object
    """
    # 1) ```json ... ```
    match = re.search(r"```json\s*([\s\S]*?)```", body, re.MULTILINE)
    if match:
        json_text = match.group(1).strip()
        try:
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            raise SystemExit(f"ERROR: Failed to parse JSON from ```json``` block: {e}")

    # 2) any fenced block
    match = re.search(r"```[\w]*\s*([\s\S]*?)```", body, re.MULTILINE)
    if match:
        json_text = match.group(1).strip()
        try:
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            raise SystemExit(f"ERROR: Failed to parse JSON from fenced code block: {e}")

    # 3) bare {...}
    match = re.search(r"\{\s*[\s\S]*\}", body)
    if match:
        json_text = match.group(0)
        try:
            return json.loads(json_text)
        except json.JSONDecodeError as e:
            raise SystemExit(f"ERROR: Failed to parse JSON from bare object: {e}")

    raise SystemExit("ERROR: No JSON object found in issue body.")


def slugify(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', (value or '').strip().lower()).strip('-')


def find_image_url(body: str) -> str:
    """
    Look for the first image-like URL in the issue body (e.g., GitHub-hosted uploads).
    """
    match = re.search(r'https?://\S+\.(?:png|jpe?g|gif|webp)', body, re.IGNORECASE)
    if match:
        return match.group(0)
    # GitHub user-images links sometimes lack an extension
    match = re.search(r'https?://user-images\.githubusercontent\.com/\S+', body, re.IGNORECASE)
    if match:
        return match.group(0)
    return ''


def download_image(image_url: str, vendor: str, model: str) -> str:
    if not image_url:
        return ''
    try:
        # Create manufacturer subfolder
        vendor_slug = slugify(vendor)
        images_dir = Path('images') / vendor_slug
        images_dir.mkdir(parents=True, exist_ok=True)
        parsed = urlparse(image_url)
        ext = Path(parsed.path).suffix.lower()
        if ext not in {'.png', '.jpg', '.jpeg', '.gif', '.webp'}:
            ext = '.jpg'
        filename = f"{vendor_slug}-{slugify(model)}{ext}"
        dest = images_dir / filename
        with urllib.request.urlopen(image_url) as resp:
            if resp.status >= 400:
                raise RuntimeError(f'HTTP {resp.status}')
            dest.write_bytes(resp.read())
        return f"images/{vendor_slug}/{filename}"
    except Exception as e:
        print(f"WARNING: Failed to download image {image_url}: {e}")
        return ''


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["new", "edit"], required=True)
    parser.add_argument("--issue-number", required=True)
    parser.add_argument("--input", required=True, help="Path to file with issue body")
    parser.add_argument("--data", required=True, help="Path to ap_data.json")
    args = parser.parse_args()

    body_path = Path(args.input)
    data_path = Path(args.data)

    if not body_path.is_file():
        raise SystemExit(f"ERROR: Issue body file not found: {body_path}")

    if not data_path.is_file():
        raise SystemExit(f"ERROR: Data file not found: {data_path}")

    body = body_path.read_text(encoding="utf-8")
    new_entry = extract_json(body)

    # Basic required fields
    vendor = (new_entry.get("vendor") or "").strip()
    model = (new_entry.get("model") or "").strip()

    if not vendor or not model:
        raise SystemExit("ERROR: JSON must include non-empty 'vendor' and 'model' fields.")

    key = (vendor, model)

    # Load existing data
    try:
        ap_list = json.loads(data_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise SystemExit(f"ERROR: Failed to parse existing data file: {e}")

    if not isinstance(ap_list, list):
        raise SystemExit("ERROR: Expected ap_data.json to contain a JSON array (list).")

    # Look for existing AP (vendor + model match)
    existing_idx = next(
        (i for i, x in enumerate(ap_list)
         if (x.get("vendor") or "").strip() == key[0]
         and (x.get("model") or "").strip() == key[1]),
        None
    )

    image_url = (new_entry.get("image_url") or "").strip()
    if not image_url:
        image_url = find_image_url(body)
    local_image_path = download_image(image_url, vendor, model)
    if local_image_path:
        new_entry["image_url"] = local_image_path
    elif image_url:
        new_entry["image_url"] = image_url

    if args.mode == "new":
        if existing_idx is not None:
            raise SystemExit(f"ERROR: AP {vendor} {model} already exists; cannot add as new.")
        ap_list.append(new_entry)

    elif args.mode == "edit":
        if existing_idx is None:
            raise SystemExit(f"ERROR: AP {vendor} {model} not found; cannot edit.")
        ap_list[existing_idx] = new_entry

    # Optional: sort by vendor then model for nicer diffs
    ap_list.sort(key=lambda x: ((x.get("vendor") or ""), (x.get("model") or "")))

    # Write back
    data_path.write_text(
        json.dumps(ap_list, indent=2, sort_keys=False) + "\n",
        encoding="utf-8"
    )

    print(f"SUCCESS: Mode={args.mode}, vendor={vendor}, model={model}")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        # Re-raise to get the non-zero exit in Actions, but also print nicely
        print(str(e), file=sys.stderr)
        raise
