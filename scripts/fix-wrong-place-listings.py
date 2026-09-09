#!/usr/bin/env python3
"""Fix wrong-place catalog entries and backfill photos for specific IDs."""
from __future__ import annotations

import importlib.util
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from lib.catalog_photo_selection import place_title_matches  # noqa: E402

CATALOG_PATH = ROOT / "data" / "restaurants.json"
ENV_PATH = ROOT / ".env.local"

_backfill_path = ROOT / "scripts" / "backfill-catalog-images-serpapi.py"
_spec = importlib.util.spec_from_file_location("backfill_serpapi", _backfill_path)
_backfill = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_backfill)

fetch_place_details = _backfill.fetch_place_details
fetch_maps_search = _backfill.fetch_maps_search
load_env = _backfill.load_env
pick_restaurant_photos = _backfill.pick_restaurant_photos

CATALOG_PATCHES: list[dict[str, Any]] = [
    {
        "id": "blaqhaus-atlanta",
        "name": "BlaqHaus ATL",
        "address": "16 Atlanta St SE, Marietta, GA 30060",
        "phone": "(678) 540-6039",
        "google_place_id": "ChIJRzAMqnIV9YgRJeovUF7M0Yk",
        "search_aliases": ["Blaqhaus", "BlaqHaus ATL"],
    },
    {
        "id": "afrik-che-houston",
        "name": "Afrikiko Restaurant",
        "address": "9625 Bissonnet St, Houston, TX 77036",
        "phone": "(713) 773-1400",
        "website": "https://afrikikohouston.com",
        "google_place_id": "ChIJV5B8ranCQIYRW34aZ_L02J8",
        "search_aliases": ["Afrik-CHe Kitchen", "Afrikiko"],
    },
    {
        "id": "ponti-ivorian-houston",
        "clear_place_id": True,
        "search_aliases": ["Ponti's Ivorian Kitchen", "Ponti's Kitchen"],
    },
    {
        "id": "amaweles-san-francisco",
        "name": "Amawele's South African Kitchen",
        "search_aliases": ["Amawele's", "Amawele's South African Kitchen"],
        "search_query": "Amawele's South African Kitchen San Francisco",
    },
    {
        "id": "oak-lala-eritrean",
        "search_aliases": ["Cafe Eritrea D'Afrique", "Lala's Restaurant"],
        "google_place_id": "ChIJ_RtOt-J9hYARrro9RaXE7DY",
        "accept_place_titles": ["Cafe Eritrea D'Afrique", "Lala's Eritrean"],
    },
]


def resolve_search_place_id(api_key: str, query: str) -> str | None:
    data = fetch_maps_search(api_key, query)
    if not data:
        return None
    candidates: list[dict[str, Any]] = []
    pr = data.get("place_results")
    if isinstance(pr, dict) and pr.get("place_id"):
        candidates.append(pr)
    for item in data.get("local_results") or []:
        if isinstance(item, dict) and item.get("place_id"):
            candidates.append(item)
    for item in candidates:
        title = str(item.get("title") or "").lower()
        if "amawele" in title:
            return str(item["place_id"])
    return None


def title_ok(entry: dict[str, Any], place: dict[str, Any]) -> bool:
    accept = entry.get("accept_place_titles") or []
    title = str(place.get("title") or "")
    if title in accept:
        return True
    names = [str(entry.get("name") or "")]
    names.extend(entry.get("search_aliases") or [])
    return any(place_title_matches(n, title) for n in names if n)


def apply_patch(entry: dict[str, Any], patch: dict[str, Any]) -> None:
    for key, value in patch.items():
        if key in ("clear_place_id", "search_query", "accept_place_titles"):
            continue
        if value is not None:
            entry[key] = value
    if patch.get("clear_place_id"):
        entry.pop("google_place_id", None)


def main() -> int:
    env = load_env(ENV_PATH)
    api_key = env.get("SERPAPI_KEY") or os.environ.get("SERPAPI_KEY", "")
    if not api_key:
        print("ERROR: SERPAPI_KEY missing")
        return 1

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    patches = {p["id"]: p for p in CATALOG_PATCHES}

    amawele_query = patches["amaweles-san-francisco"].get("search_query")
    if amawele_query:
        amawele_id = resolve_search_place_id(api_key, amawele_query)
        if amawele_id:
            patches["amaweles-san-francisco"]["google_place_id"] = amawele_id
            print(f"Amawele's resolved place_id: {amawele_id}")
        else:
            patches["amaweles-san-francisco"]["clear_place_id"] = True
            print("Amawele's: no Google listing — cleared stale place_id")

    photos_updated = 0
    for entry in catalog:
        patch = patches.get(entry.get("id", ""))
        if not patch:
            continue

        apply_patch(entry, patch)
        place_id = entry.get("google_place_id")
        if not place_id:
            print(f"{entry['id']}: catalog patched, no photos")
            continue

        searches = [0]
        details = fetch_place_details(api_key, place_id)
        searches[0] += 1
        place = (details or {}).get("place_results") if details else None
        if not place:
            print(f"{entry['id']}: place lookup failed")
            continue

        if not title_ok(entry, place):
            print(f"{entry['id']}: wrong place — {place.get('title')} ({place_id})")
            entry.pop("google_place_id", None)
            continue

        urls = pick_restaurant_photos(
            api_key,
            place,
            max_photos=3,
            quality=True,
            searches_used=searches,
        )
        if urls:
            entry["images"] = urls
            photos_updated += 1
            print(f"{entry['id']}: {len(urls)} photo(s) ({searches[0]} searches)")
        else:
            print(f"{entry['id']}: no photos")

        time.sleep(1.5)

    CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote {CATALOG_PATH} — {photos_updated} with new photos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
