#!/usr/bin/env python3
"""Generate listing-specific chef_quote for The Chef's Choice section."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "restaurants.json"
OUT = ROOT / "data" / "catalog-chef-quote-enrichments.json"

CURATED: dict[str, str] = {
    "tatiana-by-kwame-onwuachi-new-york": "This is the plate I'm most proud of—Wagyu short rib treated like pastrami, with the smoke, spice, and swagger of the Bronx and Lagos on one fork.",
    "d-gon-washington": "We built this menu around the Potomac—Chesapeake catch, West Indian spice, and the elegance a Wharf dinner deserves.",
    "atx-fine-001": "Canje is named for Guyana's national bird, and every plate is meant to taste like the Caribbean forest—bright, lush, and unforgettable.",
    "chopnblok-downtown-houston": "Suya and jollof belong in a design-forward room—this is the bowl I want Houston to remember us for.",
    "demera-ethiopian-chicago": "When the injera lands on the table, you're family—our wats are slow-cooked the way my mother taught me in Addis Ababa.",
    "mia-red-rooster-overtown": "Overtown raised me as a chef—this kitchen honors that history in every yardbird, every gumbo pot, every song night.",
    "sa-jerk-shack": "Forty-eight hours of seasoning, pimento wood smoke—jerk isn't fast food, it's a love letter to Kingston.",
    "nola-dakar": "One seating, one story—from thieboudienne memory to Louisiana gumbo logic on a single progression of plates.",
    "phi-fine-001": "Eight courses in a rowhouse kitchen—each bite carries a spice memory from the diaspora communities that raised us.",
    "kann-portland": "The wood fire is the heart of this kitchen—Haitian flavor doesn't happen without flame, patience, and pride.",
    "chs-fine-001": "Lowcountry seafood meets West African spice lines here—this is Charleston through a diaspora lens.",
    "communion-r-b-seattle": "Hood Sushi started as a question—what if soul food and Japanese technique shared the same plate? This is the answer.",
    "atx-fine-002": "French discipline, West African soul—that tension on the plate is exactly what we're chasing in Austin.",
    "atl-fine-001": "Seasonal Atlanta produce, diaspora seasoning—we let the South talk through every course.",
    "lucia-los-angeles": "California ingredients, Caribbean memory—this is the flavor of my table at home, scaled for Los Angeles.",
    "hou-reggae-hut": "Brown stew fish the way Third Ward taught me—patience in the pot, reggae in the air, love in the portion.",
    "meals-by-genet-los-angeles": "Doro wat is the dish that built our reputation—berbere from scratch, injera made fresh, no shortcuts on Sunday night.",
    "baobab-fare-detroit": "Kuku Na Mali is home on a plate—spinach, chicken, and the Burundian warmth we brought to New Center.",
    "nola-dooky-chase": "Leah Chase taught us that gumbo feeds more than hunger—it feeds a neighborhood's history.",
    "afrikiko-houston": "Waakye is the dish people drive across Houston for—rice, beans, and pepper that taste like Accra.",
    "sea-fine-002": "Two days in the rub, pimento wood smoke—this jerk chicken is Seattle Central District pride.",
    "cool-runnings-jamaican-grill-houston": "Brown stew snapper is the dish Guy Fieri came for—and the one our regulars order every Friday.",
}


def dish_name(row: dict) -> str:
    if row.get("specialty"):
        return str(row["specialty"])
    highlights = row.get("menu_highlights") or []
    if highlights:
        return str(highlights[0])
    cuisine = row.get("cuisine") or "African"
    return f"Signature {cuisine} Plate"


def infer_kind(cuisine: str, region: str) -> str:
    blob = f"{cuisine} {region}".lower()
    if "ethiopian" in blob or "eritrean" in blob or "habesha" in blob:
        return "ethiopian"
    if "jamaican" in blob or "jerk" in blob:
        return "jamaican"
    if "haitian" in blob:
        return "haitian"
    if "nigerian" in blob or "ghanaian" in blob or "senegalese" in blob or "west african" in blob:
        return "west_african"
    if "caribbean" in blob or "trinidadian" in blob:
        return "caribbean"
    if "soul" in blob or "southern" in blob or "gullah" in blob:
        return "soul"
    if "kenyan" in blob or "somali" in blob or "east african" in blob or "burundian" in blob:
        return "east_african"
    return "general"


def generate(row: dict) -> str:
    slug = row["id"]
    if slug in CURATED:
        return CURATED[slug]

    dish = dish_name(row)
    name = row.get("name") or "Our kitchen"
    kind = infer_kind(row.get("cuisine") or "", row.get("region") or "")

    templates = {
        "ethiopian": f"{dish} is why people gather here—berbere, butter, and injera made to share from one platter.",
        "jamaican": f"{dish} carries the smoke and heat we grew up on—scotch bonnet, allspice, and time in the pot.",
        "haitian": f"{dish} is pure Port-au-Prince memory—citrus, epis, and the crunch that makes griot unforgettable.",
        "west_african": f"{dish} is the plate regulars order first—pepper, depth, and the chop-bar spirit of home.",
        "caribbean": f"{dish} tastes like the islands we left and the city we live in now—bold spice, generous portions.",
        "soul": f"{dish} is Sunday dinner at {name}—slow-cooked, seasoned deep, and meant to be shared.",
        "east_african": f"{dish} honors the hearth—spice, stew, and the hospitality of our community table.",
        "general": f"{dish} defines what we do at {name}—traditional flavor, fresh ingredients, and pride in every plate.",
    }
    return templates.get(kind, templates["general"])


def main() -> int:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    out = {row["id"]: {"chef_quote": generate(row)} for row in catalog}
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} chef_quote entries to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
