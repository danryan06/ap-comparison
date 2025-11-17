#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path


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
