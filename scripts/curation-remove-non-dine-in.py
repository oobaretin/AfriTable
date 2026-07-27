#!/usr/bin/env python3
"""
Remove listings outside AfriTable's sit-down dine-in scope.

AfriTable is a reservation platform — pickup/delivery-only operators, food trucks,
home kitchens, retail stores, and virtual brands without a bookable dining room
do not belong in data/restaurants.json.

Usage:
  python3 scripts/curation-remove-non-dine-in.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
REPORT_PATH = ROOT / "data" / "curation-remove-non-dine-in-report.json"
REMAINING_PATH = ROOT / "data" / "website-research-remaining.json"

# Verified Jul 2026 — service-model review (not website-research pass).
NON_DINE_IN_REMOVE: dict[str, str] = {
    "spicy-fame-pickup-delivery-only-raleigh": "Pickup and delivery only — no dine-in (operator name + directories)",
    "saaraloges-kitchen-riverside": "Home-kitchen operator; call-ahead pickup, not a public dine-in venue",
    "bee-s-island-kitchen-tampa": "Carryout-only; no dine-in seating",
    "selam-houston": "Selam Ethio-Eritrea Specialty Store — retail market, not a restaurant (selamspecialty.com)",
    "k-y-d-restaurant-mirage-brooklyn": "Pickup/delivery-focused; no public dine-in room open yet",
    "blackstar-kebab-seattle": "Mobile food truck — no sit-down restaurant (blackstarkebab.com)",
}


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
    remove_ids = set(NON_DINE_IN_REMOVE)

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
                    "reason": NON_DINE_IN_REMOVE[rid],
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

    print("Non-dine-in curation removals\n")
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
    missing = regenerate_remaining_queue(kept)

    print(f"\nWrote {CATALOG_PATH}")
    print(f"Report: {REPORT_PATH}")
    print(f"Website queue: {missing} remaining")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
