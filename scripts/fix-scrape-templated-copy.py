#!/usr/bin/env python3
"""
Fix templated SerpAPI scrape copy: use the listing's actual city in descriptions.

Usage:
  python3 scripts/fix-scrape-templated-copy.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
REPORT_PATH = ROOT / "data" / "scrape-copy-fix-report.json"
LOG_PATH = ROOT / ".cursor" / "debug-3435b4.log"
SESSION_ID = "3435b4"
BASE_COMMIT = "b2d1b12"

TEMPLATE_RE = re.compile(
    r"^Authentic (.+?) restaurant in (.+?)\. Experience traditional (.+?) flavors and hospitality at (.+?)\.$"
)


def audit_log(message: str, data: dict) -> None:
    line = json.dumps(
        {
            "sessionId": SESSION_ID,
            "runId": "copy-fix",
            "hypothesisId": "copy",
            "location": "fix-scrape-templated-copy.py",
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


def city_from_address(address: str) -> str:
    parts = [p.strip() for p in str(address or "").split(",") if p.strip()]
    if len(parts) >= 3:
        return parts[-2]
    if len(parts) == 2:
        return parts[0]
    return ""


def region_blurb(region: str, cuisine: str) -> str:
    r = str(region or "").strip()
    c = str(cuisine or "").strip()
    if r and c and c.lower() not in r.lower():
        return f"{c} cooking rooted in {r} traditions"
    if r:
        return f"{r} flavors"
    if c:
        return f"{c} cuisine"
    return "African and diaspora flavors"


def improved_about(row: dict) -> str | None:
    about = str(row.get("about") or "").strip()
    m = TEMPLATE_RE.match(about)
    if not m:
        return None

    cuisine_label, _old_city, cuisine2, name = m.groups()
    city = city_from_address(str(row.get("address") or "")) or _old_city
    region = str(row.get("region") or "")
    cuisine = str(row.get("cuisine") or cuisine_label)
    blurb = region_blurb(region, cuisine)

    return (
        f"{name} serves {blurb} in {city}. "
        f"A neighborhood spot for {cuisine2.lower()} plates, warm hospitality, and familiar diaspora comfort food."
    )[:500]


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
        return set()
    before_ids = {r["id"] for r in before if r.get("id")}
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    return {r["id"] for r in catalog if r.get("id") and r["id"] not in before_ids}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--all-templated", action="store_true", help="Fix all templated rows, not only scrape batch")
    args = parser.parse_args()

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    target_ids = None if args.all_templated else batch_ids()

    updated: list[dict] = []
    for row in catalog:
        if target_ids is not None and row.get("id") not in target_ids:
            continue
        new_about = improved_about(row)
        if not new_about:
            continue
        updated.append({"id": row["id"], "name": row.get("name"), "before": row.get("about"), "after": new_about})
        row["about"] = new_about
        if str(row.get("our_story") or "").startswith("Listing sourced from public maps data"):
            city = city_from_address(str(row.get("address") or ""))
            row["our_story"] = (
                f"AfriTable listing for {row.get('name')} in {city or 'the metro area'}. "
                "Hours and menu details should be confirmed with the restaurant directly."
            )[:500]

    report = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dryRun": args.dry_run,
        "updatedCount": len(updated),
        "sample": updated[:5],
    }
    audit_log("copy fix complete", report)

    print("Scrape templated copy fix\n")
    print(f"  Updated: {len(updated)}")
    for u in updated[:8]:
        print(f"    - {u['name']}")
    if len(updated) > 8:
        print(f"    … +{len(updated) - 8} more")

    if not args.dry_run:
        CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
        REPORT_PATH.write_text(json.dumps({**report, "updated": updated}, indent=2) + "\n", encoding="utf-8")
        print(f"\nWrote {CATALOG_PATH}")
    else:
        print("\nDry run — no files written")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
