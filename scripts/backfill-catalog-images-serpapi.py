#!/usr/bin/env python3
"""
Backfill restaurant photos in data/restaurants.json via SerpAPI.

Modes:
  place-id (default) — entries with google_place_id, 1 search each
  search             — entries without google_place_id; map search by name+address
                       (also saves google_place_id when found)

Stdlib only — no npm/node required.

Usage:
  python3 scripts/backfill-catalog-images-serpapi.py --dry-run --limit 3
  python3 scripts/backfill-catalog-images-serpapi.py --limit 25 --photos 3
  python3 scripts/backfill-catalog-images-serpapi.py --mode search --limit 30 --photos 3
"""
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "restaurants.json"
REPORT_PATH = ROOT / "data" / "backfill-images-report.json"
ENV_PATH = ROOT / ".env.local"

BRAND_PLACEHOLDER = "/restaurant-card-placeholder.svg"
LEGACY_PLACEHOLDER = "/og-image.svg"
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
        if url in (BRAND_PLACEHOLDER, LEGACY_PLACEHOLDER):
            continue
        if url.endswith("/restaurant-card-placeholder.svg") or url.endswith("/og-image.svg"):
            continue
        if url.startswith(STOCK_PREFIX):
            continue
        return True
    return False


def extract_photo_urls(details: dict | None, max_photos: int) -> list[str]:
    if not details:
        return []
    urls: list[str] = []

    def push(raw: str | None) -> None:
        url = str(raw or "").strip()
        if not url or url in urls:
            return
        urls.append(url)

    place = details.get("place_results") or {}
    if place.get("thumbnail"):
        push(place.get("thumbnail"))

    for img in place.get("images") or []:
        if isinstance(img, dict) and img.get("title") == "All":
            continue
        if isinstance(img, dict):
            push(img.get("thumbnail") or img.get("image"))
        if len(urls) >= max_photos:
            return urls[:max_photos]

    for photo in details.get("photos") or []:
        if isinstance(photo, dict):
            push(photo.get("thumbnail") or photo.get("image"))
        if len(urls) >= max_photos:
            return urls[:max_photos]

    return urls[:max_photos]


def fetch_serpapi(api_key: str, params: dict[str, str]) -> dict | None:
    query = urllib.parse.urlencode({**params, "api_key": api_key})
    url = f"https://serpapi.com/search.json?{query}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_place_details(api_key: str, place_id: str) -> dict | None:
    return fetch_serpapi(
        api_key,
        {
            "engine": "google_maps",
            "type": "place",
            "place_id": place_id,
        },
    )


def fetch_maps_search(api_key: str, query: str) -> dict | None:
    return fetch_serpapi(
        api_key,
        {
            "engine": "google_maps",
            "type": "search",
            "q": query,
        },
    )


def build_search_query(entry: dict) -> str:
    name = str(entry.get("name") or "").strip()
    address = str(entry.get("address") or "").strip()
    return f"{name} {address}".strip()


def resolve_search_match(data: dict | None) -> tuple[str | None, dict | None]:
    if not data:
        return None, None

    place = data.get("place_results")
    if isinstance(place, dict) and place.get("place_id"):
        return str(place["place_id"]), place

    local_results = data.get("local_results") or []
    for item in local_results:
        if not isinstance(item, dict):
            continue
        place_id = str(item.get("place_id") or "").strip()
        if place_id:
            return place_id, item

    return None, None


def select_candidates(catalog: list[dict], mode: str) -> list[dict]:
    if mode == "search":
        return [
            r
            for r in catalog
            if not r.get("google_place_id")
            and not has_real_images(r.get("images"))
            and str(r.get("name") or "").strip()
            and str(r.get("address") or "").strip()
        ]
    return [
        r for r in catalog if r.get("google_place_id") and not has_real_images(r.get("images"))
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--photos", type=int, default=3)
    parser.add_argument(
        "--mode",
        choices=("place-id", "search"),
        default="place-id",
        help="place-id: use stored google_place_id; search: look up by name+address",
    )
    args = parser.parse_args()

    env = load_env(ENV_PATH)
    api_key = env.get("SERPAPI_KEY") or os.environ.get("SERPAPI_KEY", "")

    if not api_key:
        print("ERROR: SERPAPI_KEY is not set in .env.local")
        return 1

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    candidates = select_candidates(catalog, args.mode)
    batch = candidates[: max(1, args.limit)]

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dryRun": args.dry_run,
        "mode": args.mode,
        "limit": args.limit,
        "photosPerRestaurant": args.photos,
        "catalogTotal": len(catalog),
        "eligible": len(candidates),
        "processed": 0,
        "updated": 0,
        "noPhotos": 0,
        "failed": 0,
        "serpSearchesUsed": 0,
        "details": [],
    }

    print("SerpAPI image backfill (python)\n")
    print(f"  Mode:     {args.mode}")
    print(f"  Eligible: {len(candidates)}")
    print(f"  This run: {len(batch)}")
    print(f"  Dry run:  {'yes' if args.dry_run else 'no'}\n")

    if not batch:
        REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print("Nothing to backfill.")
        return 0

    for i, entry in enumerate(batch):
        print(f"{i + 1}/{len(batch)}: {entry.get('name')}")
        report["processed"] += 1
        place_id = str(entry.get("google_place_id") or "").strip() or None

        try:
            if args.mode == "search":
                search_query = build_search_query(entry)
                search_data = fetch_maps_search(api_key, search_query)
                report["serpSearchesUsed"] += 1
                resolved_place_id, match = resolve_search_match(search_data)
                if not resolved_place_id:
                    report["noPhotos"] += 1
                    report["details"].append(
                        {
                            "id": entry.get("id"),
                            "name": entry.get("name"),
                            "google_place_id": None,
                            "status": "no_match",
                            "imageCount": 0,
                        }
                    )
                    print("  → no Google Maps match")
                    if i < len(batch) - 1:
                        time.sleep(1.5)
                    continue

                place_id = resolved_place_id
                details = (
                    search_data
                    if isinstance(search_data.get("place_results"), dict)
                    else {"place_results": match}
                )
                urls = extract_photo_urls(details, args.photos)

                if not urls and place_id:
                    report["serpSearchesUsed"] += 1
                    details = fetch_place_details(api_key, place_id)
                    urls = extract_photo_urls(details, args.photos)
            else:
                place_id = entry["google_place_id"]
                report["serpSearchesUsed"] += 1
                details = fetch_place_details(api_key, place_id)
                urls = extract_photo_urls(details, args.photos)

            if not urls:
                report["noPhotos"] += 1
                report["details"].append(
                    {
                        "id": entry.get("id"),
                        "name": entry.get("name"),
                        "google_place_id": place_id,
                        "status": "no_photos",
                        "imageCount": 0,
                    }
                )
                print("  → no photos returned")
            else:
                entry["images"] = urls
                if args.mode == "search" and place_id:
                    entry["google_place_id"] = place_id
                report["updated"] += 1
                report["details"].append(
                    {
                        "id": entry.get("id"),
                        "name": entry.get("name"),
                        "google_place_id": place_id,
                        "status": "updated",
                        "imageCount": len(urls),
                    }
                )
                saved = f"saved {len(urls)} photo(s)"
                if args.mode == "search" and place_id:
                    saved += f", place_id {place_id[:12]}…"
                print(f"  → {saved}")

        except Exception as exc:  # noqa: BLE001
            report["failed"] += 1
            report["details"].append(
                {
                    "id": entry.get("id"),
                    "name": entry.get("name"),
                    "google_place_id": place_id,
                    "status": "failed",
                    "imageCount": 0,
                }
            )
            print(f"  → failed: {exc}")

        if i < len(batch) - 1:
            time.sleep(1.5)

    if not args.dry_run and report["updated"] > 0:
        CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
        print(f"\nWrote {CATALOG_PATH}")
    elif args.dry_run:
        print("\nDry run — catalog not written")

    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\nSummary")
    print(f"  Updated:   {report['updated']}")
    print(f"  No photos: {report['noPhotos']}")
    print(f"  Failed:    {report['failed']}")
    print(f"  Remaining: {max(0, len(candidates) - len(batch))} eligible")
    print(f"  Report:    {REPORT_PATH}")
    return 0 if report["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
