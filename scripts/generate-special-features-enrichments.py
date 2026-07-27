#!/usr/bin/env python3
"""Generate listing-specific special_features for the full catalog."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "restaurants.json"
OUT = ROOT / "data" / "catalog-special-features-enrichments.json"

CURATED: dict[str, str] = {
    "tatiana-by-kwame-onwuachi-new-york": "Lincoln Center fine-dining room; signature Wagyu Short Rib Pastrami; chef Kwame Onwuachi's Afro-Caribbean tasting menu; reservation prestige spot.",
    "d-gon-washington": "Potomac waterfront fine dining; Michelin-recognized Afro-Caribbean plates; elegant Wharf setting with Chesapeake ingredients.",
    "atx-fine-001": "East Austin tasting-room energy; Guyana-inspired menu named for the national bird; Michelin Guide recognition.",
    "chopnblok-downtown-houston": "POST Houston fast-fine bowls; suya, jollof, and cocktails; design-forward West African dining by Chef Kehinde Ogunsanya.",
    "demera-ethiopian-chicago": "Uptown injera platters; honey wine and shared wats; Chicago benchmark for Ethiopian hospitality.",
    "mia-red-rooster-overtown": "Historic Overtown dining room; live music and art; Marcus Samuelsson's yardbird, gumbo, and coconut-smoked oxtails.",
    "sa-jerk-shack": "San Antonio jerk pit elevated; Michelin-recognized smoke and spice; patty-shop soul with fine-dining polish.",
    "nola-dakar": "One-seating tasting menu; Senegalese-to-Creole narrative; Magazine Street destination dinner.",
    "phi-fine-001": "Rittenhouse rowhouse eight-course journey; Jonah and Chad Williams' modern American menu with diaspora spice memory.",
    "kann-portland": "Wood-fired open kitchen; James Beard-winning Haitian hearth cooking; cane sugar glaze and Portland destination status.",
    "chs-fine-001": "Charleston seafood tasting menus; Lowcountry ingredients with West African spice lines.",
    "communion-r-b-seattle": "Central District soul innovation; Hood Sushi and catfish; Kristi Brown's creative Seattle room.",
    "atx-fine-002": "Austin fine-dining counter; French technique with West African seasoning.",
    "atl-fine-001": "Atlanta tasting-menu room; seasonal Southern and diaspora crossover plates.",
    "lucia-los-angeles": "Los Angeles chef-driven dining; Latin and Caribbean crossover flavors.",
    "hou-reggae-hut": "Third Ward institution for decades; brown stew fish, jerk chicken, and Jamaican patties; easy neighborhood warmth.",
    "nola-dooky-chase": "Treme institution since 1941; Leah Chase legacy; gumbo, fried chicken, and civil-rights history on every plate.",
    "meals-by-genet-los-angeles": "Little Ethiopia reservation-only room; legendary doro wat Fri–Sun; women-owned institution.",
    "baobab-fare-detroit": "James Beard-honored Burundian cooking; New Center neighborhood anchor; Kuku Na Mali and family hospitality.",
}


def infer_kind(cuisine: str, region: str, vibe_category: str | None) -> str:
    blob = f"{cuisine} {region}".lower()
    if vibe_category == "Fine Dining" or "fine" in blob or "michelin" in blob:
        return "fine"
    if any(k in blob for k in ("ethiopian", "eritrean", "habesha")):
        return "ethiopian"
    if any(k in blob for k in ("jamaican", "jerk", "caribbean", "haitian", "trinidadian")):
        return "caribbean"
    if any(k in blob for k in ("nigerian", "ghanaian", "senegalese", "west african")):
        return "west_african"
    if "soul" in blob:
        return "soul"
    return "general"


def dish_phrase(row: dict) -> str | None:
    if row.get("specialty"):
        return str(row["specialty"])
    highlights = row.get("menu_highlights") or []
    if highlights:
        items = [str(h) for h in highlights[:3]]
        if len(items) == 1:
            return items[0]
        return f"{', '.join(items[:-1])}, and {items[-1]}"
    return None


def generate(row: dict) -> str:
    slug = row["id"]
    if slug in CURATED:
        return CURATED[slug]

    name = row.get("name") or slug
    cuisine = row.get("cuisine") or "African"
    neighborhood = row.get("neighborhood")
    vibe = row.get("vibe") or row.get("vibe_category") or ""
    dish = dish_phrase(row)
    quality = row.get("quality_factor")
    featured = row.get("featured")
    kind = infer_kind(cuisine, row.get("region") or "", row.get("vibe_category"))

    loc = f" in {neighborhood}" if neighborhood else ""
    bits: list[str] = []

    if featured:
        bits.append("AfriTable featured pick")
    if quality:
        bits.append(str(quality).rstrip("."))
    elif row.get("awards"):
        bits.append("Highly rated by diners")

    if dish:
        bits.append(f"signature {dish}" if kind == "fine" else f"known for {dish}")

    if kind == "fine":
        bits.append(f"{cuisine} chef-driven dining{loc}")
        bits.append("destination reservation spot" if featured else "elevated dining room")
    elif kind == "ethiopian":
        bits.append(f"communal injera platters{loc}")
        bits.append("vegetarian fasting options and coffee ceremony" if row.get("rating", 0) >= 4.7 else "traditional wats and tibs")
    elif kind == "caribbean":
        bits.append(f"island spice and homestyle plates{loc}")
        if "jerk" in (dish or "").lower() or "jerk" in cuisine.lower():
            bits.append("jerk pit smoke and bold pepper")
        else:
            bits.append("Caribbean comfort cooking")
    elif kind == "west_african":
        bits.append(f"pepper-forward stews and rice plates{loc}")
        bits.append("suya, jollof, and chop-bar hospitality")
    elif kind == "soul":
        bits.append(f"Soul food and Southern comfort{loc}")
        bits.append("slow-cooked plates and generous portions")
    else:
        bits.append(f"{cuisine} flavors{loc}")
        if vibe:
            bits.append(str(vibe).split("/")[0].strip())
        bits.append("warm diaspora hospitality")

    # Dedupe while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for b in bits:
        key = b.lower()
        if key not in seen and b.strip():
            seen.add(key)
            unique.append(b.strip())

    text = "; ".join(unique[:4])
    if not text.endswith("."):
        text += "."
    return text


def main() -> int:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    out = {row["id"]: {"special_features": generate(row)} for row in catalog}
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} special_features entries to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
