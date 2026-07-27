#!/usr/bin/env python3
"""
Remove misclassified, closed, or unverifiable listings flagged during website research.

Usage:
  python3 scripts/curation-remove-flagged.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
REPORT_PATH = ROOT / "data" / "curation-remove-flagged-report.json"
REMAINING_PATH = ROOT / "data" / "website-research-remaining.json"
COPY_PATHS = [
    ROOT / "data" / "catalog-nationwide-copy-enrichments.json",
    ROOT / "data" / "catalog-metro-copy-enrichments.json",
]

# Verified Jul 2026 during website-research batch review.
CURATION_REMOVE: dict[str, str] = {
    "primo-african-quisine-cleveland": "Permanently closed (MapQuest / directory status)",
    "nazareth-cafe-houston": "Permanently closed (MapQuest)",
    "taste-cleveland-heights": "Contemporary American wine bar — outside African/Caribbean scope",
    "moroccan-breeze-restaurant-orlando": "Morocco tour company, not a restaurant",
    "worlds-magic-restaurant-orlando": "Unverifiable operator; associated domain hijacked",
    "sudan-cafe-denver": "No working operator website; listing unverifiable",
    "tfk-african-food-tampa": "No working operator website (404)",
    "nini-kitchen-houston": "Website candidate matched wrong business (Marietta, GA)",
    "the-social-room-cleveland-heights": "Neighborhood dive bar — outside African/Caribbean scope",
    "niimatallaah-tampa": "Listing address is BayCare medical campus; restaurant unverifiable",
    "siphokazi-tampa": "No verifiable operator at Florida State Fairgrounds address",
    "global-cuisine-denver": "Address is Global Grocery Mart — retail market, not a dine-in restaurant",
}


def prune_copy_enrichments(remove_ids: set[str]) -> list[str]:
    pruned: list[str] = []
    for path in COPY_PATHS:
        if not path.exists():
            continue
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
        before = len(data)
        for rid in remove_ids:
            if rid in data:
                del data[rid]
                pruned.append(f"{path.name}:{rid}")
        if len(data) != before:
            # Re-serialize; compact single-line arrays preserved where possible via separators.
            path.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
    return pruned


def regenerate_remaining_queue(catalog: list[dict]) -> int:
    remaining = [
        {
            "id": r["id"],
            "name": r["name"],
            "state": r.get("state"),
            "address": r.get("address"),
        }
        for r in catalog
        if not str(r.get("website") or "").strip()
    ]
    REMAINING_PATH.write_text(
        json.dumps({"count": len(remaining), "listings": remaining}, indent=2) + "\n",
        encoding="utf-8",
    )
    return len(remaining)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    remove_ids = set(CURATION_REMOVE)

    removed: list[dict] = []
    kept: list[dict] = []

    for row in catalog:
        rid = row.get("id")
        if rid in remove_ids:
            removed.append(
                {
                    "id": rid,
                    "name": row.get("name"),
                    "state": row.get("state"),
                    "address": row.get("address"),
                    "reason": CURATION_REMOVE[rid],
                }
            )
            continue
        kept.append(row)

    report = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dryRun": args.dry_run,
        "removed": removed,
        "beforeCount": len(catalog),
        "afterCount": len(kept),
    }

    print("Curation removals\n")
    print(f"  Removed: {len(removed)}")
    for r in removed:
        print(f"    - {r['name']} ({r['id']})")
        print(f"      {r['reason']}")
    print(f"  Catalog: {len(catalog)} → {len(kept)}")

    if args.dry_run:
        print("\nDry run — no files written")
        return 0

    CATALOG_PATH.write_text(json.dumps(kept, indent=2) + "\n", encoding="utf-8")
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    pruned = prune_copy_enrichments(remove_ids)
    missing = regenerate_remaining_queue(kept)

    print(f"\nWrote {CATALOG_PATH}")
    print(f"Report: {REPORT_PATH}")
    print(f"Website queue: {missing} remaining")
    if pruned:
        print(f"Pruned copy enrichments: {len(pruned)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
