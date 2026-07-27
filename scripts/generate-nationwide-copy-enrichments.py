#!/usr/bin/env python3
"""Generate catalog copy enrichments for templated nationwide listings."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "restaurants.json"
OUT = ROOT / "data" / "catalog-nationwide-copy-enrichments.json"

TEMPLATED_RE = re.compile(
    r"^Authentic .+ restaurant in .+\. Experience traditional .+ flavors and hospitality at",
    re.I,
)

MENU_BY_CUISINE: dict[str, list[str]] = {
    "Nigerian": ["Jollof rice", "Suya skewers", "Egusi soup"],
    "Ethiopian": ["Vegetarian combo", "Beef tibs", "Doro wat"],
    "Ghanaian": ["Jollof rice", "Fufu with light soup", "Banku and tilapia"],
    "Somali": ["Chicken suqaar", "Goat rice platter", "Sambusa"],
    "Jamaican": ["Jerk chicken", "Oxtail stew", "Curry goat"],
    "Caribbean": ["Jerk chicken", "Curry goat", "Plantains"],
    "Senegalese": ["Thieboudienne", "Yassa chicken", "Mafe stew"],
    "Kenyan": ["Nyama choma", "Ugali with sukuma", "Pilau rice"],
    "Eritrean": ["Injera combo", "Zigni stew", "Ful medames"],
    "West African": ["Jollof rice", "Grilled fish", "Pepper soup"],
    "East African": ["Injera platters", "Tibs", "Lentil stews"],
    "African": ["Jollof rice", "Stewed meats", "Seasonal specials"],
}

CULTURAL_BY_REGION: dict[str, str] = {
    "West African": "Nigerian, Ghanaian, and Senegalese diaspora cooking — rice, stews, and grill culture.",
    "East African": "Ethiopian and Horn of Africa traditions — injera, berbere, and shared platters.",
    "Caribbean": "Island spice, jerk smoke, and Afro-Caribbean comfort plates.",
    "Southern African": "Southern African flavors adapted for American neighborhoods.",
    "African": "Pan-African diaspora flavors across the continent's many culinary regions.",
}

ABOUT_OPENERS: dict[str, str] = {
    "Nigerian": "{city} Nigerian kitchen",
    "Ethiopian": "{city} Ethiopian dining room",
    "Ghanaian": "{city} Ghanaian restaurant",
    "Somali": "{city} Somali restaurant",
    "Jamaican": "{city} Jamaican spot",
    "Caribbean": "{city} Caribbean restaurant",
    "West African": "{city} West African eatery",
    "East African": "{city} East African restaurant",
    "African": "{city} African restaurant",
}


def city_from_address(address: str) -> str:
    parts = [p.strip() for p in str(address or "").split(",") if p.strip()]
    if len(parts) >= 3:
        return parts[-2]
    if len(parts) == 2:
        return parts[0]
    return ""


def street_line(address: str) -> str:
    parts = [p.strip() for p in str(address or "").split(",") if p.strip()]
    return parts[0] if parts else ""


def menu_highlights(cuisine: str, region: str) -> list[str]:
    if cuisine in MENU_BY_CUISINE:
        return MENU_BY_CUISINE[cuisine]
    if region == "West African":
        return MENU_BY_CUISINE["West African"]
    if region == "East African":
        return MENU_BY_CUISINE["East African"]
    if region == "Caribbean":
        return MENU_BY_CUISINE["Caribbean"]
    return MENU_BY_CUISINE["African"]


def about_text(row: dict) -> str:
    city = city_from_address(row.get("address", "")) or row.get("state", "")
    street = street_line(row.get("address", ""))
    cuisine = str(row.get("cuisine") or "African")
    region = str(row.get("region") or "African")
    name = str(row.get("name") or "This restaurant")

    opener_tpl = ABOUT_OPENERS.get(cuisine) or ABOUT_OPENERS.get(region.replace(" African", " African")) or ABOUT_OPENERS["African"]
    opener = opener_tpl.format(city=city)
    highlights = menu_highlights(cuisine, region)
    dish_str = ", ".join(highlights[:2]).lower()
    extra = highlights[2].lower() if len(highlights) > 2 else "homestyle plates"

    loc = f" on {street}" if street and len(street) < 60 else ""
    return (
        f"{opener}{loc}, known for {dish_str}, and {extra}."
    )[:500]


def our_story_text(row: dict) -> str:
    name = str(row.get("name") or "This restaurant")
    city = city_from_address(row.get("address", "")) or "the metro"
    cuisine = str(row.get("cuisine") or "African")
    return (
        f"{name} serves {cuisine.lower()} flavors to diners in {city} and surrounding communities."
    )[:500]


def cultural_roots_text(row: dict) -> str:
    region = str(row.get("region") or "African")
    cuisine = str(row.get("cuisine") or "")
    base = CULTURAL_BY_REGION.get(region, CULTURAL_BY_REGION["African"])
    if cuisine and cuisine not in base and cuisine != "African":
        return f"{cuisine} heritage within the broader {region.lower()} diaspora."[:500]
    return base[:500]


def infer_cuisine_from_name(name: str, cuisine: str) -> str:
    n = name.lower()
    if cuisine and cuisine != "African":
        return cuisine
    for key in MENU_BY_CUISINE:
        if key.lower() in n:
            return key
    if "naija" in n or "jollof" in n or "suya" in n:
        return "Nigerian"
    if "ethiop" in n or "habesha" in n or "injera" in n:
        return "Ethiopian"
    if "ghana" in n or "accra" in n:
        return "Ghanaian"
    if "somali" in n:
        return "Somali"
    if "jamaica" in n or "jerk" in n:
        return "Jamaican"
    return cuisine or "African"


def enrich_row(row: dict) -> dict:
    cuisine = infer_cuisine_from_name(str(row.get("name") or ""), str(row.get("cuisine") or "African"))
    patched = {**row, "cuisine": cuisine}
    return {
        "about": about_text(patched),
        "our_story": our_story_text(patched),
        "cultural_roots": cultural_roots_text(patched),
        "menu_highlights": menu_highlights(cuisine, str(row.get("region") or "African")),
    }


def main() -> int:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    enrichments: dict[str, dict] = {}

    for row in catalog:
        about = str(row.get("about") or "").strip()
        if not TEMPLATED_RE.match(about):
            continue
        rid = row.get("id")
        if not rid:
            continue
        enrichments[rid] = enrich_row(row)

    OUT.write_text(json.dumps(enrichments, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(enrichments)} enrichments → {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
