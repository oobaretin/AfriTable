#!/usr/bin/env python3
"""
Sync restaurant images from data/restaurants.json → Supabase restaurants table.
Matches catalog `id` to Supabase `slug` (same as website sync).

Usage:
  python3 scripts/sync-catalog-images-to-supabase.py --dry-run
  python3 scripts/sync-catalog-images-to-supabase.py
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
ENV_PATH = ROOT / ".env.local"

BRAND_PLACEHOLDER = "/restaurant-card-placeholder.svg"
STOCK_PREFIX = "https://images.unsplash.com/"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def has_real_images(images: list | None) -> bool:
    if not images:
        return False
    for raw in images:
        url = str(raw or "").strip()
        if not url:
            continue
        if url == BRAND_PLACEHOLDER or url.endswith("/restaurant-card-placeholder.svg"):
            continue
        if url.startswith(STOCK_PREFIX):
            continue
        return True
    return False


def supabase_patch(url: str, key: str, slug: str, images: list[str]) -> tuple[int, str]:
    endpoint = f"{url.rstrip('/')}/rest/v1/restaurants?slug=eq.{urllib.parse.quote(slug, safe='')}"
    body = json.dumps({"images": images}).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=body,
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
        detail = exc.read().decode("utf-8", errors="replace")[:300]
        return exc.code, detail


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    env = load_env(ENV_PATH)
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url or not service_key:
        print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
        return 1

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    to_sync = [r for r in catalog if has_real_images(r.get("images"))]

    print("Sync catalog images → Supabase\n")
    print(f"  Catalog entries with real images: {len(to_sync)}")
    print(f"  Dry run: {'yes' if args.dry_run else 'no'}\n")

    updated = 0
    skipped = 0
    failed = 0

    for entry in to_sync:
        slug = entry.get("id")
        images = entry.get("images") or []
        if not slug:
            skipped += 1
            continue

        if args.dry_run:
            print(f"  [dry-run] would sync {slug} ({len(images)} images)")
            updated += 1
            continue

        status, detail = supabase_patch(supabase_url, service_key, slug, images)
        if status in (200, 204):
            updated += 1
            print(f"  ✓ {slug} ({len(images)} images)")
        else:
            failed += 1
            print(f"  ✗ {slug} — HTTP {status} {detail}")

    print("\nSummary")
    print(f"  Synced:  {updated}")
    print(f"  Skipped: {skipped}")
    print(f"  Failed:  {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
