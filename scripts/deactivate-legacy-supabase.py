#!/usr/bin/env python3
"""
Deactivate Supabase restaurant rows that fail AfriTable dine-in curation rules.

Tier 1 (automatic): slugs documented in curation removal scripts but absent from
data/restaurants.json — set is_active=false.

Tier 2 (report only): DB-only slugs with no documented reason → written to
data/legacy-supabase-review.json for manual dine-in review.

Usage:
  python3 scripts/deactivate-legacy-supabase.py --dry-run
  python3 scripts/deactivate-legacy-supabase.py
"""
from __future__ import annotations

import argparse
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
ENV_PATH = ROOT / ".env.local"
REPORT_PATH = ROOT / "data" / "legacy-supabase-deactivate-report.json"
REVIEW_PATH = ROOT / "data" / "legacy-supabase-review.json"

REASON_SOURCES = [
    ("scripts/remove-non-dine-in-restaurants.mjs", r"const REMOVE = \{([^}]+)\}"),
    ("scripts/curation-remove-non-dine-in.py", r"NON_DINE_IN_REMOVE: dict\[str, str\] = \{([^}]+)\}"),
    ("scripts/curation-remove-flagged.py", r"CURATION_REMOVE: dict\[str, str\] = \{([^}]+)\}"),
]

# Stale Supabase slugs superseded by canonical catalog ids, or clear non-dine-in retail.
STALE_OR_DUPLICATE: dict[str, str] = {
    "fabaceae-african-cuisine": "Legacy duplicate — canonical slug is fabaceae-african-cuisine-houston",
    "katy-002": "Duplicate — catalog has amala-joint-houston",
    "sf-001": "Duplicate — catalog has teranga-nyc",
    "teranga-4-embarcadero-ctr": "Duplicate — catalog has sf-teranga-village",
    "hou-reggae-hut-veterans": "Duplicate — Reggae Hut covered in catalog",
    "sarabell-calabar-restaurant-buffet-houston": "Duplicate — Sarabell Calabar in catalog",
    "tailat-kitchen-austin": "Duplicate — catalog has tailat-kitchen-nigerian-cuisine-austin",
    "olas-foods-specialty-market-africa-on-the-bay-tampa": "Specialty market / retail — not sit-down dine-in",
    "african-cuisine-san-diego": "Legacy SerpAPI slug — not in curated catalog",
    "guinea-conakry-austin": "Legacy import slug — not in curated catalog",
    "hou-sta-013": "Legacy Houston scrape slug — superseded by catalog",
    "hou-sta-018": "Legacy Houston scrape slug — Caribbean Hotpot in catalog",
    "lucy-houston": "Legacy slug — not in catalog (Lucy in catalog is Denver)",
}


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def load_documented_removals() -> dict[str, str]:
    reasons: dict[str, str] = {}
    for script, pattern in REASON_SOURCES:
        path = ROOT / script
        text = path.read_text(encoding="utf-8")
        match = re.search(pattern, text, re.S)
        if not match:
            continue
        for m in re.finditer(r'"([^"]+)":\s*"([^"]+)"', match.group(1)):
            reasons[m.group(1)] = m.group(2)
    return reasons


def supabase_get(url: str, key: str, path: str) -> list[dict]:
    req = urllib.request.Request(
        f"{url.rstrip('/')}{path}",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data if isinstance(data, list) else []


def supabase_patch(url: str, key: str, slug: str, body: dict) -> tuple[int, str]:
    endpoint = f"{url.rstrip('/')}/rest/v1/restaurants?slug=eq.{urllib.parse.quote(slug, safe='')}"
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(body).encode("utf-8"),
        method="PATCH",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, ""
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")[:300]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    env = load_env(ENV_PATH)
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL") or ""
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not supabase_url or not service_key:
        print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
        return 1

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    catalog_ids = {row["id"] for row in catalog}
    curated_removals = load_documented_removals()
    documented = {**curated_removals, **STALE_OR_DUPLICATE}

    rows = supabase_get(
        supabase_url,
        service_key,
        "/rest/v1/restaurants?select=slug,name,is_active&limit=2000",
    )

    db_only = [r for r in rows if r["slug"] not in catalog_ids]
    to_deactivate = [
        r for r in db_only if r["slug"] in documented and r.get("is_active") is not False
    ]
    already_inactive = [r for r in db_only if r["slug"] in documented and r.get("is_active") is False]
    needs_review = [
        {
            "slug": r["slug"],
            "name": r["name"],
            "is_active": r.get("is_active"),
            "note": documented.get(r["slug"])
            or "Not in restaurants.json; verify dine-in before reactivating",
        }
        for r in db_only
        if r["slug"] not in documented
    ]

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dryRun": args.dry_run,
        "catalogTotal": len(catalog_ids),
        "supabaseTotal": len(rows),
        "dbOnlyTotal": len(db_only),
        "documentedOutOfScope": len([r for r in db_only if r["slug"] in documented]),
        "deactivated": [],
        "alreadyInactive": [{"slug": r["slug"], "name": r["name"]} for r in already_inactive],
        "errors": [],
        "needsReviewCount": len(needs_review),
    }

    print("Deactivate legacy Supabase rows (documented out-of-scope)\n")
    print(f"  DB-only (not in JSON):     {len(db_only)}")
    print(f"  Documented removals:       {len([r for r in db_only if r['slug'] in documented])}")
    print(f"  To deactivate (active):    {len(to_deactivate)}")
    print(f"  Needs manual review:       {len(needs_review)}")
    print(f"  Dry run:                   {'yes' if args.dry_run else 'no'}\n")

    for row in sorted(to_deactivate, key=lambda r: r["slug"]):
        slug = row["slug"]
        reason = documented[slug]
        if args.dry_run:
            print(f"  [dry-run] would deactivate {slug}")
            print(f"            {reason[:90]}")
            report["deactivated"].append({"slug": slug, "name": row["name"], "reason": reason, "dry_run": True})
            continue

        status, detail = supabase_patch(supabase_url, service_key, slug, {"is_active": False})
        if status in (200, 204):
            print(f"  ✓ deactivated {slug}")
            report["deactivated"].append({"slug": slug, "name": row["name"], "reason": reason})
        else:
            print(f"  ✗ {slug} — HTTP {status} {detail}")
            report["errors"].append({"slug": slug, "status": status, "detail": detail})

    REVIEW_PATH.write_text(json.dumps({"count": len(needs_review), "listings": needs_review}, indent=2) + "\n", encoding="utf-8")
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    print(f"\nReview queue: {REVIEW_PATH}")
    print(f"Report:       {REPORT_PATH}")
    if needs_review:
        print("\nManual review (not auto-deactivated):")
        for item in sorted(needs_review, key=lambda x: x["slug"]):
            flag = "ACTIVE" if item["is_active"] else "inactive"
            print(f"  [{flag}] {item['slug']} — {item['name']}")

    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
