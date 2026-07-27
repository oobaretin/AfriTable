#!/usr/bin/env python3
"""
Remove non-dine-in listings from the Tampa / Orlando / Denver SerpAPI scrape batch.

Usage:
  python3 scripts/cleanup-scrape-batch.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
REPORT_PATH = ROOT / "data" / "cleanup-scrape-batch-report.json"
LOG_PATH = ROOT / ".cursor" / "debug-3435b4.log"
SESSION_ID = "3435b4"
BASE_COMMIT = "b2d1b12"  # catalog before Tampa/Orlando/Denver merge

REMOVE: dict[str, str] = {
    "jollof-jollof-halal-food-truck-and-mobile-caterer-denver": "Food truck / mobile caterer",
    "yene-romay-ethiopian-kitchen-food-truck-orlando": "Food truck",
    "habibi-halal-food-truck-orlando-orlando": "Food truck",
    "mays-alreem-halal-food-truck-tampa": "Food truck",
    "konjo-catering-and-events-denver": "Catering-only operator",
    "makola-african-market-aurora": "Grocery market, not dine-in restaurant",
    "tracey-africa-market-orlando": "Flea market stall",
    "african-choice-food-market-orlando": "Grocery market",
    "ethiopian-market-in-tampa-bb-mart-tampa": "Grocery market",
    "african-place-market-inc-tampa": "Grocery market",
    "olas-foods-specialty-market-africa-on-the-bay-tampa": "Specialty market",
}

ADDRESS_FIXES: dict[str, dict[str, str]] = {
    "falidelicious-restaurant-5-stars-fl-32773": {
        "address": "Sanford, FL 32773",
        "state": "FL",
    },
}


def audit_log(message: str, data: dict, hypothesis_id: str = "cleanup") -> None:
    line = json.dumps(
        {
            "sessionId": SESSION_ID,
            "runId": "scrape-cleanup",
            "hypothesisId": hypothesis_id,
            "location": "cleanup-scrape-batch.py",
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
    )
    try:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass


def batch_ids() -> set[str]:
    try:
        before = json.loads(
            subprocess.check_output(
                ["git", "show", f"{BASE_COMMIT}:data/restaurants.json"],
                text=True,
                cwd=ROOT,
            )
        )
    except subprocess.CalledProcessError:
        before = []
    before_ids = {r["id"] for r in before if r.get("id")}
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    return {r["id"] for r in catalog if r.get("id") and r["id"] not in before_ids}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    scrape_batch = batch_ids()
    remove_ids = set(REMOVE)

    removed: list[dict] = []
    fixed: list[dict] = []
    kept: list[dict] = []

    for row in catalog:
        rid = row.get("id")
        if rid in remove_ids:
            removed.append(
                {
                    "id": rid,
                    "name": row.get("name"),
                    "reason": REMOVE[rid],
                    "inScrapeBatch": rid in scrape_batch,
                }
            )
            continue

        patch = ADDRESS_FIXES.get(rid or "")
        if patch:
            before = row.get("address")
            row = {**row, **patch}
            fixed.append({"id": rid, "name": row.get("name"), "before": before, "after": row.get("address")})

        kept.append(row)

    report = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dryRun": args.dry_run,
        "scrapeBatchSize": len(scrape_batch),
        "removed": removed,
        "fixed": fixed,
        "beforeCount": len(catalog),
        "afterCount": len(kept),
    }

    audit_log("cleanup complete", report, "summary")

    print("Scrape batch cleanup\n")
    print(f"  Scrape batch IDs: {len(scrape_batch)}")
    print(f"  Removed:          {len(removed)}")
    for r in removed:
        print(f"    - {r['name']} ({r['id']})")
        print(f"      {r['reason']}")
    print(f"  Fixed:            {len(fixed)}")
    for f in fixed:
        print(f"    - {f['id']}: {f['before']} → {f['after']}")
    print(f"  Catalog:          {len(catalog)} → {len(kept)}")

    if not args.dry_run:
        CATALOG_PATH.write_text(json.dumps(kept, indent=2) + "\n", encoding="utf-8")
        REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"\nWrote {CATALOG_PATH}")
        print(f"Report: {REPORT_PATH}")
    else:
        print("\nDry run — no files written")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
