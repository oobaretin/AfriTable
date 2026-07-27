#!/usr/bin/env python3
"""
Apply metro + nationwide copy enrichments to data/restaurants.json.

Usage:
  python3 scripts/apply-copy-enrichments.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "restaurants.json"
METRO = ROOT / "data" / "catalog-metro-copy-enrichments.json"
NATIONWIDE = ROOT / "data" / "catalog-nationwide-copy-enrichments.json"
FLAGSHIP = ROOT / "data" / "catalog-flagship-copy-enrichments.json"
BATCH2 = ROOT / "data" / "catalog-batch2-metro-copy-enrichments.json"
BATCH3 = ROOT / "data" / "catalog-batch3-copy-enrichments.json"
SPECIAL = ROOT / "data" / "catalog-special-features-enrichments.json"
REPORT = ROOT / "data" / "copy-enrichments-report.json"
LOG = ROOT / ".cursor" / "debug-3435b4.log"
SESSION = "3435b4"

TEMPLATED_RE = re.compile(
    r"^Authentic .+ restaurant in .+\. Experience traditional .+ flavors and hospitality at",
    re.I,
)


def audit_log(message: str, data: dict) -> None:
    line = json.dumps(
        {
            "sessionId": SESSION,
            "runId": "copy-enrich",
            "hypothesisId": "copy",
            "location": "apply-copy-enrichments.py",
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
    )
    try:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with LOG.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else {}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    enrichments = {
        **load_json(METRO),
        **load_json(NATIONWIDE),
        **load_json(FLAGSHIP),
        **load_json(BATCH2),
        **load_json(BATCH3),
        **load_json(SPECIAL),
    }

    updated = 0
    updated_ids: list[str] = []
    for row in catalog:
        patch = enrichments.get(row.get("id", ""))
        if not patch:
            continue
        before = {k: row.get(k) for k in patch}
        row.update(patch)
        if any(before.get(k) != row.get(k) for k in patch):
            updated += 1
            updated_ids.append(row["id"])

    templated_remaining = sum(
        1 for r in catalog if TEMPLATED_RE.match(str(r.get("about") or "").strip())
    )

    report = {
        "updated": updated,
        "templatedRemaining": templated_remaining,
        "enrichmentKeys": len(enrichments),
    }
    audit_log("apply complete", report)

    print("Apply copy enrichments\n")
    print(f"  Enrichment entries loaded: {len(enrichments)}")
    print(f"  Catalog rows updated:      {updated}")
    print(f"  Templated remaining:       {templated_remaining}")

    if not args.dry_run:
        CATALOG.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
        REPORT.write_text(json.dumps({**report, "updatedIds": updated_ids}, indent=2) + "\n", encoding="utf-8")
        print(f"\nWrote {CATALOG}")
    else:
        print("\nDry run — no files written")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
