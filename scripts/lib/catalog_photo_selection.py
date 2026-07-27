"""Pick high-quality, diverse Google Maps photos for restaurant catalog entries."""

from __future__ import annotations

import re
from typing import Any

# Prefer one photo per slot: storefront → menu → interior
PHOTO_SLOT_PREFERENCES: list[list[str]] = [
    ["By owner", "Street View & 360°", "Exterior", "Outside"],
    ["Menu"],
    ["Vibe", "Inside", "Interior"],
]

# Skip noisy / low-signal Google Maps tabs
SKIP_IMAGE_TITLES = frozenset(
    {
        "All",
        "Videos",
        "Latest",
        "Food & drink",
    }
)

GENERIC_NAME_TOKENS = frozenset(
    {
        "the",
        "and",
        "bar",
        "grill",
        "cafe",
        "kitchen",
        "restaurant",
        "house",
        "food",
        "african",
        "caribbean",
        "ethiopian",
        "nigerian",
        "jamaican",
        "international",
        "cuisine",
        "lounge",
        "inc",
        "llc",
    }
)

# Wrong-place signals when absent from the catalog name
MISMATCH_PLACE_KEYWORDS = (
    "dental",
    "dentist",
    "orthodont",
    "periodont",
    "clinic",
    "hospital",
    "pharmacy",
    "gas station",
    "church",
    "mosque",
    "bank",
    "atm",
    "school",
    "university",
    "hotel",
    "motel",
)

# Known Google category titles (dish-specific tabs are skipped unless filling gaps)
KNOWN_CATEGORY_TITLES = frozenset(
    {
        "All",
        "Latest",
        "Menu",
        "Food & drink",
        "Vibe",
        "By owner",
        "Street View & 360°",
        "Videos",
        "Inside",
        "Exterior",
        "Outside",
        "Rooms",
        "Amenities",
    }
)


def normalize_photo_url(url: str | None) -> str:
    raw = str(url or "").strip()
    if not raw:
        return ""
    base = raw.split("?", 1)[0]
    base = re.sub(r"=w\d+-h\d+.*$", "", base)
    base = re.sub(r"=s\d+-.*$", "", base)
    return base


def _name_tokens(name: str) -> set[str]:
    cleaned = re.sub(r"['']", "", name.lower())
    cleaned = re.sub(r"[^a-z0-9]+", " ", cleaned)
    return {t for t in cleaned.split() if len(t) > 2 and t not in GENERIC_NAME_TOKENS}


def place_title_matches(catalog_name: str, place_title: str | None) -> bool:
    title = str(place_title or "").strip()
    if not title:
        return True

    catalog_lower = catalog_name.lower()
    title_lower = title.lower()

    for keyword in MISMATCH_PLACE_KEYWORDS:
        if keyword in title_lower and keyword not in catalog_lower:
            return False

    catalog_tokens = _name_tokens(catalog_name)
    place_tokens = _name_tokens(title)
    if not catalog_tokens or not place_tokens:
        return True

    overlap = catalog_tokens & place_tokens
    if len(overlap) >= 2:
        return True
    if len(overlap) == 1 and len(catalog_tokens) <= 2:
        return True

    catalog_compact = re.sub(r"[^a-z0-9]", "", catalog_name.lower())
    place_compact = re.sub(r"[^a-z0-9]", "", title_lower)
    if len(catalog_compact) >= 5 and catalog_compact[:6] in place_compact:
        return True

    return False


def place_title_score(catalog_name: str, place_title: str | None) -> int:
    title = str(place_title or "").strip()
    if not title or not place_title_matches(catalog_name, title):
        return -1

    catalog_tokens = _name_tokens(catalog_name)
    place_tokens = _name_tokens(title)
    score = len(catalog_tokens & place_tokens)

    catalog_compact = re.sub(r"[^a-z0-9]", "", catalog_name.lower())
    place_compact = re.sub(r"[^a-z0-9]", "", title.lower())
    if len(catalog_compact) >= 5 and catalog_compact[:6] in place_compact:
        score += 2

    return score


def _photo_url_from_item(item: dict[str, Any]) -> str | None:
    url = str(item.get("image") or item.get("thumbnail") or "").strip()
    return url or None


def index_place_category_images(place: dict[str, Any] | None) -> dict[str, str]:
    indexed: dict[str, str] = {}
    if not place:
        return indexed
    for item in place.get("images") or []:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        url = _photo_url_from_item(item)
        if title and url:
            indexed[title] = url
    thumb = str(place.get("thumbnail") or "").strip()
    if thumb and "Exterior" not in indexed and "By owner" not in indexed:
        indexed.setdefault("_place_thumbnail", thumb)
    return indexed


def pick_photos_from_category_map(
    by_title: dict[str, str],
    *,
    max_photos: int = 3,
) -> list[str]:
    selected: list[str] = []
    seen: set[str] = set()

    def add(url: str | None) -> None:
        if not url or len(selected) >= max_photos:
            return
        norm = normalize_photo_url(url)
        if not norm or norm in seen:
            return
        seen.add(norm)
        selected.append(url)

    for slot_prefs in PHOTO_SLOT_PREFERENCES:
        for pref in slot_prefs:
            if pref in by_title:
                add(by_title[pref])
                break

    if "_place_thumbnail" in by_title:
        add(by_title["_place_thumbnail"])

    for title, url in by_title.items():
        if title.startswith("_"):
            continue
        if title in SKIP_IMAGE_TITLES:
            continue
        if title not in KNOWN_CATEGORY_TITLES:
            continue
        add(url)

    return selected[:max_photos]


def pick_photos_from_place(
    place: dict[str, Any] | None,
    *,
    max_photos: int = 3,
) -> list[str]:
    return pick_photos_from_category_map(index_place_category_images(place), max_photos=max_photos)


def category_id_for_title(categories: list[dict[str, Any]], *titles: str) -> str | None:
    title_set = {t.lower() for t in titles}
    for cat in categories:
        if str(cat.get("title") or "").lower() in title_set:
            cid = str(cat.get("id") or "").strip()
            if cid:
                return cid
    return None


def pick_photos_from_photo_results(
    photos: list[dict[str, Any]],
    *,
    max_photos: int,
    already_selected: list[str],
) -> list[str]:
    selected = list(already_selected)
    seen = {normalize_photo_url(u) for u in selected}

    for photo in photos:
        if len(selected) >= max_photos:
            break
        if not isinstance(photo, dict):
            continue
        url = _photo_url_from_item(photo)
        if not url:
            continue
        norm = normalize_photo_url(url)
        if not norm or norm in seen:
            continue
        if "gstatic.com/images" in url:
            continue
        seen.add(norm)
        selected.append(url)

    return selected[:max_photos]
