#!/usr/bin/env python3
"""
Migrate opaque catalog IDs to name-city slugs and remove verified duplicates.

Reads data/slug-consistency-audit.json, applies safe migrations to:
  - data/restaurants.json
  - enrichment JSON keys
  - script hour/integrity maps
  - Supabase restaurant slugs

Usage:
  python3 scripts/migrate-catalog-slugs.py --dry-run
  python3 scripts/migrate-catalog-slugs.py
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
AUDIT_PATH = ROOT / "data" / "slug-consistency-audit.json"
REPORT_PATH = ROOT / "data" / "slug-migration-report.json"
ENV_PATH = ROOT / ".env.local"
LOG_PATH = ROOT / ".cursor" / "debug-3435b4.log"

# Manual overrides where auto slugify is awkward or wrong.
SLUG_OVERRIDES: dict[str, str] = {
    "hou-001": "chopnblok-downtown-houston",
}

# Catalog rows to remove (bad scrape duplicates).
REMOVE_IDS: dict[str, str] = {
    "blue-nile-ethiopian-restaurant": "Duplicate of hou-sta-011 — wrong address, shared place_id/images",
    "blue-nile-houston": "Duplicate of hou-sta-011 — wrong address, shared place_id/images",
}

SCRIPT_FILES = [
    ROOT / "scripts" / "apply-restaurant-hours.mjs",
    ROOT / "scripts" / "fix-catalog-integrity.mjs",
]

ENRICHMENT_FILES = [
    ROOT / "data" / "catalog-metro-copy-enrichments.json",
    ROOT / "data" / "catalog-nationwide-copy-enrichments.json",
]


def debug_log(message: str, data: dict, hypothesis_id: str = "slug") -> None:
    payload = {
        "sessionId": "3435b4",
        "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
        "location": "migrate-catalog-slugs.py",
        "message": message,
        "data": data,
        "hypothesisId": hypothesis_id,
    }
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(payload) + "\n")


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


def build_migration_map(audit: dict) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for item in audit.get("safe_migrations", []):
        old = item["id"]
        if old in REMOVE_IDS:
            continue
        mapping[old] = SLUG_OVERRIDES.get(old, item["expected"])
    return mapping


def replace_in_text(text: str, old: str, new: str) -> tuple[str, int]:
    patterns = [
        (f'"{old}"', f'"{new}"'),
        (f"'{old}'", f"'{new}'"),
    ]
    count = 0
    for o, n in patterns:
        c = text.count(o)
        if c:
            text = text.replace(o, n)
            count += c
    return text, count


def migrate_catalog(catalog: list[dict], mapping: dict[str, str]) -> tuple[list[dict], list[dict]]:
    removed: list[dict] = []
    kept: list[dict] = []
    for row in catalog:
        rid = row.get("id")
        if rid in REMOVE_IDS:
            removed.append({"id": rid, "name": row.get("name"), "reason": REMOVE_IDS[rid]})
            continue
        if rid in mapping:
            row = dict(row)
            row["id"] = mapping[rid]
        kept.append(row)
    return kept, removed


def migrate_enrichment_keys(path: Path, mapping: dict[str, str], dry_run: bool) -> int:
    if not path.exists():
        return 0
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    for old, new in mapping.items():
        if old in data and new not in data:
            data[new] = data.pop(old)
            changed += 1
        elif old in data:
            data.pop(old, None)
            changed += 1
    for old in REMOVE_IDS:
        if old in data:
            data.pop(old)
            changed += 1
    if changed and not dry_run:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return changed


def migrate_script_file(path: Path, mapping: dict[str, str], dry_run: bool) -> int:
    if not path.exists():
        return 0
    text = path.read_text(encoding="utf-8")
    total = 0
    for old, new in mapping.items():
        text, count = replace_in_text(text, old, new)
        total += count
    if total and not dry_run:
        path.write_text(text, encoding="utf-8")
    return total


class SupabaseClient:
    def __init__(self, url: str, key: str) -> None:
        self.url = url.rstrip("/")
        self.key = key

    def _req(self, method: str, path: str, body=None, prefer=None):
        headers = {"apikey": self.key, "Authorization": f"Bearer {self.key}", "Content-Type": "application/json"}
        if prefer:
            headers["Prefer"] = prefer
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(f"{self.url}{path}", data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode()
                return resp.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            return exc.code, exc.read().decode("utf-8", errors="replace")[:400]

    def fetch_slug(self, slug: str) -> dict | None:
        q = urllib.parse.quote(slug, safe="")
        _, data = self._req("GET", f"/rest/v1/restaurants?select=id,slug,is_active,sources&slug=eq.{q}")
        return data[0] if data else None

    def delete_cascade(self, restaurant_id: str) -> int:
        q = urllib.parse.quote(restaurant_id, safe="")
        for table, col in (
            ("restaurant_tables", "restaurant_id"),
            ("availability_settings", "restaurant_id"),
            ("reservations", "restaurant_id"),
            ("reviews", "restaurant_id"),
        ):
            self._req("DELETE", f"/rest/v1/{table}?{col}=eq.{q}", prefer="return=minimal")
        status, _ = self._req("DELETE", f"/rest/v1/restaurants?id=eq.{q}", prefer="return=minimal")
        return status

    def rename_slug(self, old_slug: str, new_slug: str) -> tuple[int, str]:
        row = self.fetch_slug(old_slug)
        if not row:
            return 404, "not found"
        dup = self.fetch_slug(new_slug)
        if dup and dup["id"] != row["id"]:
            self.delete_cascade(dup["id"])
        sources = row.get("sources") or {}
        sources["catalog_id"] = new_slug
        sources["catalog"] = True
        q = urllib.parse.quote(old_slug, safe="")
        status, detail = self._req(
            "PATCH",
            f"/rest/v1/restaurants?slug=eq.{q}",
            {"slug": new_slug, "is_active": True, "sources": sources},
            prefer="return=minimal",
        )
        return status, str(detail)

    def deactivate(self, slug: str) -> tuple[int, str]:
        q = urllib.parse.quote(slug, safe="")
        return self._req("PATCH", f"/rest/v1/restaurants?slug=eq.{q}", {"is_active": False}, prefer="return=minimal")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    mapping = build_migration_map(audit)
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    debug_log("migration_map_built", {"count": len(mapping), "remove": list(REMOVE_IDS.keys())}, "H1")

    new_catalog, removed = migrate_catalog(catalog, mapping)

    # Collision check
    ids = [r["id"] for r in new_catalog]
    dup_ids = [i for i in set(ids) if ids.count(i) > 1]
    if dup_ids:
        debug_log("id_collision", {"dup_ids": dup_ids}, "H2")
        print(f"ERROR: ID collision after migration: {dup_ids}")
        return 1

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dryRun": args.dry_run,
        "migrated": [{"from": k, "to": v} for k, v in sorted(mapping.items())],
        "removed": removed,
        "supabase": {"renamed": [], "deactivated": [], "errors": []},
        "scriptReplacements": {},
        "enrichmentKeyChanges": {},
    }

    print(f"Catalog slug migration {'(dry run)' if args.dry_run else ''}\n")
    print(f"  Rename:  {len(mapping)}")
    print(f"  Remove:  {len(removed)}")
    print(f"  After:   {len(new_catalog)} listings\n")

    if not args.dry_run:
        CATALOG_PATH.write_text(json.dumps(new_catalog, indent=2) + "\n", encoding="utf-8")
        for path in ENRICHMENT_FILES:
            n = migrate_enrichment_keys(path, mapping, args.dry_run)
            if n:
                report["enrichmentKeyChanges"][path.name] = n
        for path in SCRIPT_FILES:
            n = migrate_script_file(path, mapping, args.dry_run)
            if n:
                report["scriptReplacements"][path.name] = n

        env = load_env(ENV_PATH)
        url = env.get("NEXT_PUBLIC_SUPABASE_URL") or ""
        key = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""
        if url and key:
            sb = SupabaseClient(url, key)
            for old, new in mapping.items():
                status, detail = sb.rename_slug(old, new)
                entry = {"from": old, "to": new, "status": status}
                if status in (200, 204):
                    report["supabase"]["renamed"].append(entry)
                    print(f"  ✓ supabase {old} -> {new}")
                else:
                    entry["detail"] = detail
                    report["supabase"]["errors"].append(entry)
                    print(f"  ✗ supabase {old}: {status} {detail}")
            for rid in REMOVE_IDS:
                row = sb.fetch_slug(rid)
                if row:
                    if row.get("is_active"):
                        sb.deactivate(rid)
                    status = sb.delete_cascade(row["id"])
                    report["supabase"]["deactivated"].append({"slug": rid, "delete_status": status})
                    print(f"  ✓ removed duplicate supabase {rid}")
    else:
        for old, new in sorted(mapping.items())[:10]:
            print(f"  [dry-run] {old} -> {new}")
        if len(mapping) > 10:
            print(f"  ... and {len(mapping) - 10} more")
        for rid, reason in REMOVE_IDS.items():
            print(f"  [dry-run] remove {rid}: {reason[:60]}")

    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    debug_log("migration_complete", {"renamed": len(mapping), "removed": len(removed), "dry_run": args.dry_run}, "H1")
    print(f"\nReport: {REPORT_PATH}")
    return 0 if not report["supabase"]["errors"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
