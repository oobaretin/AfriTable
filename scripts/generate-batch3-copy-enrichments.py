#!/usr/bin/env python3
"""Generate Batch 3 copy enrichments for remaining catalog listings."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "restaurants.json"
OUT = ROOT / "data" / "catalog-batch3-copy-enrichments.json"

GENERIC_ABOUT = re.compile(
    r"(serves (African|Ethiopian|Eritrean|East African|Caribbean|Haitian|Nigerian|West African) (flavors|cooking)|neighborhood spot for)",
    re.I,
)
GENERIC_STORY = re.compile(r"^AfriTable listing for", re.I)

# Hand-curated copy for flagship-quality listings (story + roots; optional about override)
CURATED: dict[str, dict[str, str]] = {
    "afrotex-grill-bowls-burritos-suya-plates-san-antonio": {
        "our_story": "AfroTex Grill fuses West African suya and jollof with Tex-Mex bowls and burritos near UTSA—a San Antonio spot where Nigerian spice meets Lone Star casual dining.",
        "cultural_roots": "West African street food crossed with Texas: suya spice rubs, jollof rice, and the diaspora creativity of feeding college-town crowds bold flavor.",
    },
    "le-bon-go-t-chez-fa-las-vegas": {
        "our_story": "Le Bon Goût Chez Fa brings halal Senegalese cooking to Las Vegas—yassa, thiebou jeun, and jollof in a dining room that feels miles from the Strip but close to Dakar.",
        "cultural_roots": "Senegalese coastal cuisine: citrus-marinated yassa, fish-and-rice thieboudienne, and the halal kitchen traditions of West Africa's Atlantic ports.",
    },
    "african-small-pot-philadelphia": {
        "our_story": "African Small Pot keeps West Philadelphia fed around the clock—Mauritanian, Senegalese, and Nigerian plates with wood-grilled diby and the warmth of a true diaspora chop bar.",
        "cultural_roots": "Pan-West African cooking: wood-fire grilling, late-night chop-house hours, and the Mauritanian-Senegalese-Nigerian flavors of Philadelphia's African corridor.",
    },
    "cesaria-boston": {
        "our_story": "Cesaria has honored Cape Verdean culture in Boston since 2002—katchupa, live morna music, and a dining room named for the Barefoot Diva herself.",
        "cultural_roots": "Cape Verdean island cooking: slow-simmered katchupa stew, Atlantic seafood, and the morna music tradition that follows every great meal in Cabo Verde.",
    },
    "meals-by-genet-los-angeles": {
        "our_story": "Chef Genet Agazom's Meals by Genet is a Little Ethiopia institution—women-owned, reservation-only, and legendary for doro wat in a intimate Friday-through-Sunday dining room.",
        "cultural_roots": "Ethiopian feast cooking at its most refined: berbere-spiced doro wat, hand-made injera, and the slow, ceremonial pace of a proper Addis Ababa home kitchen.",
    },
    "baobab-fare-detroit": {
        "our_story": "Hamissi Mamba and Nadia Nijimbere's Baobab Fare turned New Center into Detroit's Burundian dining destination—Kuku Na Mali, heartfelt hospitality, and James Beard recognition.",
        "cultural_roots": "Burundian home cooking: spinach stews, plantains, and the East African table traditions the siblings brought from Bujumbura to Michigan.",
    },
    "dc-daily-002": {
        "our_story": "Chercher is widely considered the DC area's benchmark for Ethiopian dining—injera platters, vegetarian fasting options, and a Bethesda room that draws devotees from across the capital region.",
        "cultural_roots": "Ethiopian injera culture: shared platters, lentil wats for fasting seasons, and the unhurried hospitality of a proper Habesha tej house.",
    },
    "dc-st-james": {
        "our_story": "St. James brings modern Caribbean fine dining to U Street—callaloo and crab, rum cocktails, and an elevated room that matches DC's cosmopolitan Caribbean spirit.",
        "cultural_roots": "Modern Caribbean cuisine: callaloo greens, island seafood, and the fusion energy of Caribbean chefs reimagining tradition for a capital-city audience.",
    },
    "den-whittier-001": {
        "our_story": "Whittier Cafe is Denver's African espresso bar—Ethiopian and East African coffees, light bites, and a Sunday coffee ceremony that anchors the Whittier and Five Points community.",
        "cultural_roots": "East African coffee ceremony culture: roasting beans tableside, buna served with popcorn, and the social ritual that begins every Ethiopian gathering.",
    },
    "dfw-afro-002": {
        "our_story": "Cafe Nubia opened in 2024 as Dallas's African-Mediterranean fusion room—Rasta Pasta, suya, brunch, and live music in a Far North Dallas spot built for celebration.",
        "cultural_roots": "Pan-African and Mediterranean crossover: suya spice, seafood grills, and the diaspora fusion that blends North African, West African, and Caribbean flavors.",
    },
    "dfw-fine-001": {
        "our_story": "Aldeez Afribbean's creekside North Dallas lounge blends Gambian benachin with Caribbean classics—3,000 square feet of VIP energy and live Afribbean Fridays.",
        "cultural_roots": "West African and Caribbean fusion: one-pot benachin rice, island spice, and the party-kitchen culture that unites Gambian and Caribbean diaspora communities in Texas.",
    },
    "nile-ethiopian-orlando": {
        "our_story": "Nile Ethiopian serves one of Orlando's widest Ethiopian menus—fragrant wats, generous vegetarian options, and a traditional coffee ceremony in modest, welcoming quarters.",
        "cultural_roots": "Ethiopian Orthodox and everyday cooking: vegetable fasting platters, spice-layered stews, and buna ceremony to close the meal.",
    },
    "nola-dooky-chase": {
        "our_story": "Dooky Chase's has been a Treme institution since 1941—a Creole dining room where Leah Chase fed civil rights leaders and preserved New Orleans' gumbo-and-fried-chicken legacy.",
        "cultural_roots": "New Orleans Creole heritage: gumbo, fried chicken, and the soul of Treme—a neighborhood where food, faith, and civil rights history share the same table.",
    },
    "sea-fine-002": {
        "our_story": "Chef Trey Lamont's Jerk Shack elevates Seattle street food—jerk chicken seasoned for 48 hours and smoked over authentic pimento wood in the Central District.",
        "cultural_roots": "Jamaican jerk pit tradition: pimento wood smoke, scotch bonnet heat, and the street-food culture that Seattle's Caribbean community brings to the Pacific Northwest.",
    },
    "status-hollywood-los-angeles": {
        "our_story": "Status Hollywood is where LA glamour meets island heat—sweet chili lamb chops, oxtail egg rolls, and vibe dining in a room where the crowd dresses as well as the plates.",
        "cultural_roots": "Upscale Jamaican and Caribbean flavors: jerk spice refined for Hollywood, oxtail braised low and slow, and the party-dining culture of modern LA.",
    },
    "vees-brooklyn": {
        "our_story": "Vee's has served Crown Heights for 30-plus years—oxtail, cow foot soup, and ackee and saltfish with the generous portions and neighborhood prices Brooklyn expects.",
        "cultural_roots": "Jamaican-American chop-shop culture: long-simmered oxtail, cow foot soup on weekends, and the Crown Heights dining room where island families eat daily.",
    },
    "afrikiko-houston": {
        "our_story": "Afrikiko is SW Houston's gold standard for Ghanaian comfort food—family-owned for 15-plus years, serving waakye and groundnut soup with chop-bar warmth.",
        "cultural_roots": "Ghanaian home cooking: waakye rice-and-beans, groundnut soup, and the street-stall flavors of Accra transplanted to Houston's southwest corridor.",
    },
    "aria-suya-kitchen-houston": {
        "our_story": "Aria Suya Kitchen brings Nigerian grill culture to the Galleria corridor—lamb chops, jollof, and suya with a step-up dining room that still feels like a regulars' spot.",
        "cultural_roots": "Northern Nigerian suya tradition: spice-rubbed grilled meats, pepper heat, and jollof rice—the flavors of Lagos chop bars with Galleria polish.",
    },
    "bantu-house": {
        "our_story": "Bantu House celebrates Africa's culinary diversity in Cypress—regional dishes, cultural programming, and a dining room built to showcase the continent's many kitchens.",
        "cultural_roots": "Pan-African heritage: regional recipes from across the continent, communal dining, and the Bantu linguistic and culinary traditions that connect central and southern Africa.",
    },
    "atl-daily-001": {
        "our_story": "Cafe Songhai serves West African fusion in Peachtree Corners—jollof, waakye, suya, and attiéké with live entertainment and a patio built for weekend gatherings.",
        "cultural_roots": "West African party-kitchen culture: Ivorian attiéké, Ghanaian waakye, Nigerian jollof, and the live-music dining rooms that define Atlanta's suburbs.",
    },
}


def load_remaining() -> list[dict]:
    existing: dict = {}
    for p in ROOT.glob("data/catalog-*-copy-enrichments.json"):
        if p.name == "catalog-batch3-copy-enrichments.json":
            continue
        existing.update(json.loads(p.read_text(encoding="utf-8")))

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    out: list[dict] = []
    for row in catalog:
        rid = row["id"]
        if rid in existing:
            continue
        story = str(row.get("our_story") or "")
        roots = str(row.get("cultural_roots") or "")
        about = str(row.get("about") or "")
        if GENERIC_STORY.match(story) or roots.strip() in ("", "Diaspora dining in the United States."):
            pass
        elif GENERIC_ABOUT.search(about):
            pass
        elif not story or not roots:
            pass
        else:
            continue
        city = ""
        if row.get("address"):
            parts = [p.strip() for p in row["address"].split(",")]
            if len(parts) >= 3:
                city = parts[-2]
        out.append(
            {
                "id": rid,
                "name": row.get("name", ""),
                "cuisine": row.get("cuisine") or "",
                "region": row.get("region") or "",
                "city": city,
                "state": row.get("state") or "",
                "neighborhood": row.get("neighborhood"),
                "specialty": row.get("specialty"),
                "about": about,
                "website": row.get("website") or "",
            }
        )
    out.sort(key=lambda x: x["id"])
    return out


def infer_kind(item: dict) -> str:
    blob = " ".join(
        [
            item["name"],
            item["cuisine"],
            item.get("website") or "",
            item.get("about") or "",
        ]
    ).lower()
    if any(k in blob for k in ("ethiopian", "eritrean", "habesha", "injera", "mitmita", "konjo", "sheba", "lalibela")):
        return "ethiopian"
    if any(k in blob for k in ("haitian", "griot", "pikliz")):
        return "haitian"
    if any(k in blob for k in ("jamaican", "jerk", "patties", "oxtail", "ackee")):
        return "jamaican"
    if any(k in blob for k in ("senegal", "yassa", "mafe", "thieb")):
        return "senegalese"
    if any(k in blob for k in ("nigerian", "suya", "jollof", "egusi", "abula", "calabar")):
        return "nigerian"
    if any(k in blob for k in ("ghana", "waakye", "fufu")):
        return "ghanaian"
    if any(k in blob for k in ("cape verde", "katchupa", "cesaria")):
        return "cape_verdean"
    if any(k in blob for k in ("caribbean", "trinidad", "callaloo")):
        return "caribbean"
    if any(k in blob for k in ("burundian", "baobab")):
        return "burundian"
    if any(k in blob for k in ("somali", "barwaaqo")):
        return "somali"
    if any(k in blob for k in ("shawarma", "kabab", "kabob", "kebab", "halal", "beirut", "yemen", "mediterranean", "uzbek", "turkish", "leban")):
        return "middle_eastern"
    if "chanko" in blob or "ichiban" in blob:
        return "japanese"
    if "dough" in blob:
        return "bakery"
    if "terrazz" in blob or "italian" in blob:
        return "italian"
    if "south african" in blob:
        return "south_african"
    if "creole" in blob or "dooky" in blob:
        return "creole"
    if "soul" in blob:
        return "soul"
    return "west_african"


def loc(item: dict) -> str:
    if item.get("neighborhood"):
        return f"{item['neighborhood']}, {item['city']}"
    return f"{item['city']}, {item['state']}"


def needs_about(item: dict) -> bool:
    about = item.get("about") or ""
    return bool(GENERIC_ABOUT.search(about) or not about.strip())


def generate_about(item: dict, kind: str) -> str | None:
    if not needs_about(item):
        return None
    name = item["name"]
    city = item["city"]
    templates = {
        "ethiopian": f"{name} serves Ethiopian injera platters, tibs, and traditional wats in {city}.",
        "haitian": f"{name} brings Haitian griot, rice-and-beans, and bakery favorites to {city}.",
        "jamaican": f"{name} serves Jamaican jerk, oxtail, and island comfort food in {city}.",
        "nigerian": f"{name} serves Nigerian jollof, suya, and West African staples in {city}.",
        "senegalese": f"{name} serves Senegalese yassa, mafe, and thieboudienne in {city}.",
        "ghanaian": f"{name} serves Ghanaian waakye, fufu, and chop-bar classics in {city}.",
        "caribbean": f"{name} serves Caribbean plates and island hospitality in {city}.",
        "west_african": f"{name} serves West African jollof, stews, and grill plates in {city}.",
        "middle_eastern": f"{name} serves halal Mediterranean and Middle Eastern grill plates in {city}.",
        "japanese": f"{name} serves Japanese chanko-nabe hot pot and izakaya plates in {city}.",
        "bakery": f"{name} serves fresh-baked goods and sweet treats in {city}.",
        "italian": f"{name} serves Italian dining in {city}.",
        "somali": f"{name} serves Somali and East African comfort food in {city}.",
        "cape_verdean": f"{name} serves Cape Verdean katchupa and island cooking in {city}.",
    }
    return templates.get(kind, templates["west_african"])


def generate_story_roots(item: dict, kind: str) -> tuple[str, str]:
    name = item["name"]
    where = loc(item)
    specialty = item.get("specialty")
    spec = f"—known for {specialty}" if specialty else ""

    stories = {
        "ethiopian": (
            f"{name} brings Ethiopian injera platters and traditional wats to {where}{spec}—a Habesha dining room for shared meals and coffee ceremony.",
            "Ethiopian communal dining: injera as plate and utensil, berbere-spiced wats, and the hospitality rituals of Addis Ababa kitchens.",
        ),
        "haitian": (
            f"{name} serves Haitian cooking in {where}{spec}—griot, rice-and-beans, and Creole spice in a neighborhood kitchen built for the diaspora.",
            "Haitian-Creole traditions: epis seasoning, citrus-marinated griot, and the bakery-and-kitchen culture of Port-au-Prince.",
        ),
        "jamaican": (
            f"{name} keeps {item['city']} fed with Jamaican jerk, oxtail, and patty-shop soul{spec}—island flavor with neighborhood warmth.",
            "Jamaican cooking: scotch bonnet heat, pimento smoke, and the yard-food culture that defines Caribbean dining abroad.",
        ),
        "nigerian": (
            f"{name} serves Nigerian and West African cooking in {where}{spec}—pepper-forward stews, jollof, and chop-bar hospitality.",
            "Nigerian kitchen culture: jollof rice, suya spice, swallow-and-soup pairings, and the bold seasoning of Lagos chop houses.",
        ),
        "senegalese": (
            f"{name} brings Senegalese cooking to {where}{spec}—yassa, mafe, and thieboudienne in a halal-friendly diaspora dining room.",
            "Senegalese coastal cuisine: peanut mafe, lemony yassa, and fish-and-rice traditions from Dakar's Atlantic kitchens.",
        ),
        "ghanaian": (
            f"{name} is a Ghanaian dining room in {where}{spec}—waakye, fufu, and the chop-bar flavors Accra is known for.",
            "Ghanaian chop culture: waakye rice-and-beans, groundnut soup, and the street-stall seasonings of West Africa's gold coast.",
        ),
        "caribbean": (
            f"{name} brings Caribbean flavor to {where}{spec}—island spices, seafood, and the warmth of a diaspora neighborhood spot.",
            "Pan-Caribbean cooking: curry, coconut, scotch bonnet, and the blended traditions of islands across the West Indies.",
        ),
        "burundian": (
            f"{name} serves Burundian and East African cooking in {where}{spec}—heartfelt stews and homestyle hospitality.",
            "Burundian table culture: plantains, leafy greens, bean stews, and the family-kitchen traditions of the African Great Lakes.",
        ),
        "cape_verdean": (
            f"{name} honors Cape Verdean cooking in {where}{spec}—katchupa, grilled seafood, and island hospitality.",
            "Cape Verdean island cuisine: slow katchupa stews, Atlantic catch, and the Crioulo foodways of Cabo Verde.",
        ),
        "somali": (
            f"{name} serves Somali and East African comfort food in {where}{spec}—rice, stewed meats, and chai in a community gathering spot.",
            "Somali kitchen traditions: spiced rice, goat and chicken stews, sambusas, and the halal cafe culture of the Horn of Africa.",
        ),
        "middle_eastern": (
            f"{name} serves halal Mediterranean and Middle Eastern grills in {where}{spec}—shawarma, kebabs, and mezze for quick lunch or family dinner.",
            "Levantine and halal grill culture: spice-rubbed kebabs, flatbread, and the crossroads cooking of Mediterranean diaspora communities.",
        ),
        "japanese": (
            f"{name} serves Japanese chanko-nabe and izakaya fare in {where}—hearty hot pots and ramen-adjacent comfort in a casual dining room.",
            "Japanese chanko culture: sumo-strength hot pots, dashi broths, and the izakaya small-plates tradition of post-training meals.",
        ),
        "bakery": (
            f"{name} draws {item['city']} crowds for fresh-baked sweets and creative dough creations{spec}.",
            "Artisan baking culture: fresh dough, creative flavors, and the neighborhood bakery as a daily gathering spot.",
        ),
        "italian": (
            f"{name} serves Italian classics in {where}— pasta, grilled plates, and a terrace-room atmosphere for Tampa dining.",
            "Italian dining tradition: olive oil, slow sauces, and the trattoria culture of shared plates and wine.",
        ),
        "south_african": (
            f"{name} brings South African flavors to {where}{spec}—braai grills, stews, and fusion plates from the southern tip of the continent.",
            "South African braai and township cooking: fire-grilled meats, chakalaka relish, and the multicultural spice of the Rainbow Nation.",
        ),
        "creole": (
            f"{name} preserves Creole cooking in {where}{spec}—gumbo, fried chicken, and the soul of Louisiana's table.",
            "Louisiana Creole heritage: roux-based gumbo, fried chicken, and the West African and French roots of New Orleans cuisine.",
        ),
        "soul": (
            f"{name} serves soul food and Southern comfort in {where}{spec}—slow-cooked plates and church-supper warmth.",
            "African American soul food: slow braises, greens, cornbread, and the Southern kitchen traditions of the Black diaspora.",
        ),
        "west_african": (
            f"{name} serves West African jollof, stews, and grill plates in {where}{spec}—a neighborhood spot for diaspora comfort food.",
            "West African chop-bar culture: one-pot rice dishes, pepper stews, and the communal dining rooms that anchor immigrant communities.",
        ),
    }
    return stories.get(kind, stories["west_african"])


def build_entry(item: dict) -> dict[str, str]:
    rid = item["id"]
    if rid in CURATED:
        entry = dict(CURATED[rid])
    else:
        kind = infer_kind(item)
        story, roots = generate_story_roots(item, kind)
        entry = {"our_story": story, "cultural_roots": roots}
        about = generate_about(item, kind)
        if about:
            entry["about"] = about
    return entry


def main() -> int:
    items = load_remaining()
    enrichments = {item["id"]: build_entry(item) for item in items}
    OUT.write_text(json.dumps(enrichments, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(enrichments)} entries to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
