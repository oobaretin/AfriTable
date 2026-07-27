#!/usr/bin/env python3
"""
Backfill restaurant photos in data/restaurants.json via SerpAPI.

Picks diverse photos per listing: storefront, menu, interior vibe.
Skips duplicate URLs, food tabs with empty plates, and wrong-place matches.

Usage:
  python3 scripts/backfill-catalog-images-serpapi.py --mode search --limit 40 --photos 3
  python3 scripts/backfill-catalog-images-serpapi.py --refresh-duplicates --limit 10
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.catalog_photo_selection import (  # noqa: E402
    category_id_for_title,
    normalize_photo_url,
    pick_photos_from_place,
    place_title_matches,
    place_title_score,
)

CATALOG_PATH = ROOT / "data" / "restaurants.json"
REPORT_PATH = ROOT / "data" / "backfill-images-report.json"
LOG_PATH = ROOT / ".cursor" / "debug-3435b4.log"
ENV_PATH = ROOT / ".env.local"
SESSION_ID = "3435b4"

BRAND_PLACEHOLDER = "/restaurant-card-placeholder.svg"
LEGACY_PLACEHOLDER = "/og-image.svg"
STOCK_PREFIX = "https://images.unsplash.com/"

FALLBACK_CATEGORY_IDS = {
    "By owner": "CgIgARICEAE",
    "Menu": "CgIYIQ",
    "Vibe": "CgIYIg",
    "Street View & 360°": "CgIgARICCAI",
}

SLOT_FETCH_ORDER = [
    ("By owner", "Street View & 360°", "Exterior"),
    ("Menu",),
    ("Vibe", "Inside", "Interior"),
]


def audit_log(message: str, data: dict, hypothesis_id: str = "photos") -> None:
    line = json.dumps(
        {
            "sessionId": SESSION_ID,
            "runId": "photo-backfill",
            "hypothesisId": hypothesis_id,
            "location": "backfill-catalog-images-serpapi.py",
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


def has_duplicate_images(images: list | None) -> bool:
    norms = [
        normalize_photo_url(u)
        for u in (images or [])
        if u and "placeholder" not in str(u) and not str(u).startswith(STOCK_PREFIX)
    ]
    norms = [n for n in norms if n]
    return len(norms) >= 2 and len(set(norms)) < len(norms)


def count_real_images(images: list | None) -> int:
    norms = {
        normalize_photo_url(str(u or "").strip())
        for u in (images or [])
        if u and "placeholder" not in str(u) and not str(u).startswith(STOCK_PREFIX)
    }
    return len({n for n in norms if n})


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


def fetch_maps_photos(
    api_key: str,
    data_id: str,
    *,
    category_id: str | None = None,
) -> dict | None:
    params: dict[str, str] = {
        "engine": "google_maps_photos",
        "data_id": data_id,
        "hl": "en",
    }
    if category_id:
        params["category_id"] = category_id
    return fetch_serpapi(api_key, params)


def fetch_category_photo(
    api_key: str,
    data_id: str,
    category_titles: tuple[str, ...],
    category_ids: dict[str, str],
) -> str | None:
    category_id = category_id_for_title(
        [{"title": t, "id": category_ids[t]} for t in category_ids],
        *category_titles,
    )
    if not category_id:
        for title in category_titles:
            category_id = FALLBACK_CATEGORY_IDS.get(title)
            if category_id:
                break
    if not category_id:
        return None

    payload = fetch_maps_photos(api_key, data_id, category_id=category_id)
    if not payload:
        return None

    for cat in payload.get("categories") or []:
        if isinstance(cat, dict) and cat.get("title") and cat.get("id"):
            category_ids[str(cat["title"])] = str(cat["id"])

    for photo in payload.get("photos") or []:
        if not isinstance(photo, dict):
            continue
        url = str(photo.get("image") or photo.get("thumbnail") or "").strip()
        if url and "gstatic.com/images" not in url:
            return url
    return None


def pick_restaurant_photos(
    api_key: str,
    place: dict[str, Any],
    *,
    max_photos: int,
    quality: bool,
    searches_used: list[int],
) -> list[str]:
    selected = pick_photos_from_place(place, max_photos=max_photos)
    if len(selected) >= max_photos or not quality:
        return selected

    data_id = str(place.get("data_id") or "").strip()
    if not data_id:
        return selected

    category_ids = dict(FALLBACK_CATEGORY_IDS)
    seen = {normalize_photo_url(u) for u in selected}

    for slot_titles in SLOT_FETCH_ORDER:
        if len(selected) >= max_photos:
            break
        url = fetch_category_photo(api_key, data_id, slot_titles, category_ids)
        searches_used[0] += 1
        if not url:
            continue
        norm = normalize_photo_url(url)
        if not norm or norm in seen:
            continue
        seen.add(norm)
        selected.append(url)

    return selected[:max_photos]


def build_search_query(entry: dict) -> str:
    name = str(entry.get("name") or "").strip()
    address = str(entry.get("address") or "").strip()
    return f"{name} {address}".strip()


def resolve_search_match(data: dict | None, catalog_name: str = "") -> tuple[str | None, dict | None]:
    if not data:
        return None, None

    candidates: list[dict[str, Any]] = []
    place = data.get("place_results")
    if isinstance(place, dict) and place.get("place_id"):
        candidates.append(place)
    for item in data.get("local_results") or []:
        if isinstance(item, dict) and item.get("place_id"):
            candidates.append(item)

    best: dict[str, Any] | None = None
    best_score = -1
    for item in candidates:
        score = place_title_score(catalog_name, str(item.get("title") or ""))
        if score > best_score:
            best_score = score
            best = item

    if best and best_score >= 0:
        return str(best["place_id"]), best
    return None, None


def select_candidates(
    catalog: list[dict],
    mode: str,
    *,
    refresh: bool,
    refresh_duplicates: bool,
    refresh_partial: bool,
    min_photos: int,
) -> list[dict]:
    out: list[dict] = []
    for r in catalog:
        if refresh_duplicates:
            if has_duplicate_images(r.get("images")):
                out.append(r)
            continue
        if refresh_partial:
            if not has_real_images(r.get("images")):
                continue
            if count_real_images(r.get("images")) >= min_photos:
                continue
            if mode == "search":
                if str(r.get("name") or "").strip() and str(r.get("address") or "").strip():
                    out.append(r)
            elif r.get("google_place_id"):
                out.append(r)
            continue
        if refresh:
            if mode == "search":
                if not r.get("google_place_id") and r.get("name") and r.get("address"):
                    out.append(r)
            elif r.get("google_place_id"):
                out.append(r)
            continue
        if has_real_images(r.get("images")):
            continue
        if mode == "search":
            if r.get("google_place_id"):
                continue
            if str(r.get("name") or "").strip() and str(r.get("address") or "").strip():
                out.append(r)
        elif r.get("google_place_id"):
            out.append(r)
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--photos", type=int, default=3)
    parser.add_argument(
        "--mode",
        choices=("place-id", "search"),
        default="search",
        help="search: placeholder listings without google_place_id",
    )
    parser.add_argument(
        "--no-quality",
        action="store_true",
        help="Only use category thumbnails bundled in the place response",
    )
    parser.add_argument("--refresh", action="store_true", help="Re-fetch even when photos exist")
    parser.add_argument(
        "--refresh-duplicates",
        action="store_true",
        help="Re-fetch listings repeating the same image",
    )
    parser.add_argument(
        "--refresh-partial",
        action="store_true",
        help="Re-fetch listings with fewer than --photos real images",
    )
    args = parser.parse_args()
    quality = not args.no_quality

    env = load_env(ENV_PATH)
    api_key = env.get("SERPAPI_KEY") or os.environ.get("SERPAPI_KEY", "")

    if not api_key:
        print("ERROR: SERPAPI_KEY is not set in .env.local")
        return 1

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    candidates = select_candidates(
        catalog,
        args.mode,
        refresh=args.refresh,
        refresh_duplicates=args.refresh_duplicates,
        refresh_partial=args.refresh_partial,
        min_photos=args.photos,
    )
    batch = candidates[: max(1, args.limit)]

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dryRun": args.dry_run,
        "mode": args.mode,
        "quality": quality,
        "limit": args.limit,
        "photosPerRestaurant": args.photos,
        "catalogTotal": len(catalog),
        "eligible": len(candidates),
        "processed": 0,
        "updated": 0,
        "noPhotos": 0,
        "failed": 0,
        "skippedWrongPlace": 0,
        "serpSearchesUsed": 0,
        "details": [],
    }

    audit_log("backfill start", {"eligible": len(candidates), "batch": len(batch), "quality": quality})

    print("SerpAPI image backfill (python)\n")
    print(f"  Mode:     {args.mode}")
    print(f"  Quality:  {'on (storefront + menu + vibe)' if quality else 'off'}")
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
        local_searches = [0]

        try:
            place: dict[str, Any] | None = None

            if args.mode == "search":
                search_data = fetch_maps_search(api_key, build_search_query(entry))
                local_searches[0] += 1
                resolved_place_id, match = resolve_search_match(search_data, str(entry.get("name") or ""))
                if not resolved_place_id or not match:
                    report["noPhotos"] += 1
                    report["details"].append(
                        {"id": entry.get("id"), "name": entry.get("name"), "status": "no_match", "imageCount": 0}
                    )
                    print("  → no Google Maps match")
                    report["serpSearchesUsed"] += local_searches[0]
                    if i < len(batch) - 1:
                        time.sleep(1.5)
                    continue

                place_title = str(match.get("title") or "")
                if not place_title_matches(str(entry.get("name") or ""), place_title):
                    report["skippedWrongPlace"] += 1
                    report["details"].append(
                        {
                            "id": entry.get("id"),
                            "name": entry.get("name"),
                            "status": "wrong_place",
                            "placeTitle": place_title,
                            "imageCount": 0,
                        }
                    )
                    audit_log("wrong place skipped", {"id": entry.get("id"), "placeTitle": place_title}, "wrong-place")
                    print(f"  → skipped wrong place: {place_title}")
                    report["serpSearchesUsed"] += local_searches[0]
                    if i < len(batch) - 1:
                        time.sleep(1.5)
                    continue

                place_id = resolved_place_id
                if isinstance(search_data.get("place_results"), dict) and (
                    search_data["place_results"].get("images") or search_data["place_results"].get("data_id")
                ):
                    place = search_data["place_results"]
                else:
                    details = fetch_place_details(api_key, place_id)
                    local_searches[0] += 1
                    place = (details or {}).get("place_results") if details else match
            else:
                place_id = entry["google_place_id"]
                details = fetch_place_details(api_key, place_id)
                local_searches[0] += 1
                place = (details or {}).get("place_results") if details else None
                if place and not place_title_matches(str(entry.get("name") or ""), str(place.get("title") or "")):
                    report["skippedWrongPlace"] += 1
                    report["details"].append(
                        {
                            "id": entry.get("id"),
                            "name": entry.get("name"),
                            "status": "wrong_place",
                            "placeTitle": place.get("title"),
                            "imageCount": 0,
                        }
                    )
                    print(f"  → skipped wrong place: {place.get('title')}")
                    report["serpSearchesUsed"] += local_searches[0]
                    if i < len(batch) - 1:
                        time.sleep(1.5)
                    continue

            urls = pick_restaurant_photos(
                api_key,
                place or {},
                max_photos=args.photos,
                quality=quality,
                searches_used=local_searches,
            )
            report["serpSearchesUsed"] += local_searches[0]

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
                print("  → no suitable photos")
            else:
                entry["images"] = urls
                if place_id:
                    entry["google_place_id"] = place_id
                report["updated"] += 1
                report["details"].append(
                    {
                        "id": entry.get("id"),
                        "name": entry.get("name"),
                        "google_place_id": place_id,
                        "status": "updated",
                        "imageCount": len(urls),
                        "searchesUsed": local_searches[0],
                    }
                )
                audit_log("photos updated", {"id": entry.get("id"), "count": len(urls)}, "success")
                print(f"  → saved {len(urls)} photo(s) ({local_searches[0]} searches)")

        except Exception as exc:  # noqa: BLE001
            report["failed"] += 1
            report["serpSearchesUsed"] += local_searches[0]
            report["details"].append(
                {
                    "id": entry.get("id"),
                    "name": entry.get("name"),
                    "google_place_id": place_id,
                    "status": "failed",
                    "imageCount": 0,
                }
            )
            audit_log("failed", {"id": entry.get("id"), "error": str(exc)}, "error")
            print(f"  → failed: {exc}")

        if i < len(batch) - 1:
            time.sleep(1.5)

    if not args.dry_run and report["updated"] > 0:
        CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
        print(f"\nWrote {CATALOG_PATH}")
    elif args.dry_run:
        print("\nDry run — catalog not written")

    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    audit_log("backfill complete", report, "summary")

    print("\nSummary")
    print(f"  Updated:        {report['updated']}")
    print(f"  Wrong place:    {report['skippedWrongPlace']}")
    print(f"  No photos:      {report['noPhotos']}")
    print(f"  Failed:         {report['failed']}")
    print(f"  SerpAPI used:   {report['serpSearchesUsed']}")
    print(f"  Remaining: {max(0, len(candidates) - len(batch))} eligible")
    print(f"  Report:    {REPORT_PATH}")
    return 0 if report["failed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
