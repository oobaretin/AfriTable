#!/usr/bin/env python3
"""
Scrape African & Caribbean restaurants by metro via SerpAPI (Python port of lib/scrape-city.ts).

Usage:
  python3 scripts/scrape-cities-serpapi.py plan
  python3 scripts/scrape-cities-serpapi.py scrape Tampa Orlando Denver
  python3 scripts/scrape-cities-serpapi.py stitch
  python3 scripts/scrape-cities-serpapi.py merge
  python3 scripts/scrape-cities-serpapi.py all Tampa Orlando Denver
"""
from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
CATALOG_PATH = DATA_DIR / "restaurants.json"
CITIES_PATH = ROOT / "lib" / "nationwide-scrape-cities.ts"
ENV_PATH = ROOT / ".env.local"
LOG_PATH = ROOT / ".cursor" / "debug-3435b4.log"
SESSION_ID = "3435b4"

MAP_QUERY_COUNT = 13
SEARCH_QUERIES = [
    "Nigerian restaurants",
    "Ethiopian restaurants",
    "Ghanaian restaurants",
    "Senegalese restaurants",
    "Kenyan restaurants",
    "Somali restaurants",
    "Eritrean restaurants",
    "South African restaurants",
    "Jamaican restaurants",
    "Trinidadian restaurants",
    "Haitian restaurants",
    "Caribbean restaurants",
    "West African restaurants",
    "East African restaurants",
]

CUISINE_MAP: dict[str, list[str]] = {
    "nigerian": ["Nigerian", "West African"],
    "ethiopian": ["Ethiopian", "East African"],
    "ghanaian": ["Ghanaian", "West African"],
    "senegalese": ["Senegalese", "West African"],
    "kenyan": ["Kenyan", "East African"],
    "somali": ["Somali", "East African"],
    "eritrean": ["Eritrean", "East African"],
    "south african": ["South African", "African"],
    "jamaican": ["Jamaican", "Caribbean"],
    "trinidadian": ["Trinidadian", "Caribbean"],
    "haitian": ["Haitian", "Caribbean"],
    "caribbean": ["Caribbean"],
    "west african": ["West African"],
    "east african": ["East African"],
}

DEFAULT_HOURS = {
    "monday": {"open": "11:00", "close": "22:00", "closed": False},
    "tuesday": {"open": "11:00", "close": "22:00", "closed": False},
    "wednesday": {"open": "11:00", "close": "22:00", "closed": False},
    "thursday": {"open": "11:00", "close": "22:00", "closed": False},
    "friday": {"open": "11:00", "close": "23:00", "closed": False},
    "saturday": {"open": "11:00", "close": "23:00", "closed": False},
    "sunday": {"open": "12:00", "close": "21:00", "closed": False},
}


def audit_log(message: str, data: dict, hypothesis_id: str = "scrape") -> None:
    line = json.dumps(
        {
            "sessionId": SESSION_ID,
            "runId": "city-scrape",
            "hypothesisId": hypothesis_id,
            "location": "scrape-cities-serpapi.py",
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


def parse_cities() -> list[dict[str, str]]:
    src = CITIES_PATH.read_text(encoding="utf-8")
    cities: list[dict[str, str]] = []
    for m in re.finditer(r'\{\s*name:\s*"([^"]+)",\s*state:\s*"([^"]+)",\s*ll:\s*"([^"]+)"', src):
        cities.append({"name": m.group(1), "state": m.group(2), "ll": m.group(3)})
    if not cities:
        raise RuntimeError("Could not parse NATIONWIDE_SCRAPE_CITIES")
    return cities


def city_slug(name: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", name.lower()))


def get_place_detail_limit(env: dict[str, str]) -> tuple[int, bool]:
    skip = re.match(r"^(1|true|yes)$", str(env.get("SERPAPI_SKIP_PLACE_DETAILS", "")), re.I)
    if skip:
        return 0, True
    free = re.match(r"^(1|true|yes)$", str(env.get("SERPAPI_FREE_TIER", "")), re.I)
    raw = env.get("SERPAPI_MAX_PLACE_DETAILS", "").strip()
    fallback = 5 if free else 50
    try:
        parsed = int(raw) if raw else fallback
    except ValueError:
        parsed = fallback
    return min(50, max(0, parsed)), False


def estimate_per_metro(env: dict[str, str]) -> int:
    max_details, skip = get_place_detail_limit(env)
    return MAP_QUERY_COUNT + (0 if skip else max_details)


def fetch_serpapi(api_key: str, params: dict[str, str]) -> dict | None:
    query = urllib.parse.urlencode({**params, "api_key": api_key})
    url = f"https://serpapi.com/search.json?{query}"
    with urllib.request.urlopen(url, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def infer_state_from_zip_city(zip_code: str, city: str, fallback: str = "") -> str:
    digits = re.sub(r"\D", "", str(zip_code or ""))
    z3 = int(digits[:3]) if len(digits) >= 3 else None
    if z3 is not None:
        if 850 <= z3 <= 865:
            return "AZ"
        if 900 <= z3 <= 966:
            return "CA"
        if 550 <= z3 <= 567:
            return "MN"
        if 970 <= z3 <= 978:
            return "OR"
        if 370 <= z3 <= 385:
            return "TN"
        if 800 <= z3 <= 816:
            return "CO"
        if 336 <= z3 <= 339:
            return "FL"
        if 280 <= z3 <= 289:
            return "NC"
    c = str(city or "").lower()
    city_map = {
        "tampa": "FL",
        "orlando": "FL",
        "denver": "CO",
        "charlotte": "NC",
        "jacksonville": "FL",
        "miami": "FL",
    }
    return city_map.get(c, fallback)


def determine_cuisine_types(title: str, place_type: str = "") -> list[str]:
    text = f"{title} {place_type}".lower()
    for key, values in CUISINE_MAP.items():
        if key in text:
            return list(dict.fromkeys(values))
    return ["African"]


def parse_price_range(price: str | None) -> int:
    if not price:
        return 2
    return min(max(len(re.findall(r"\$", price)), 1), 4)


def generate_description(name: str, cuisines: list[str], details: dict | None, city: str) -> str:
    cuisine = cuisines[0] if cuisines else "African"
    place = city or "the area"
    if details and details.get("description"):
        return str(details["description"])
    return (
        f"Authentic {cuisine} restaurant in {place}. "
        f"Experience traditional {cuisine} flavors and hospitality at {name}."
    )


def convert_to_afritable_format(basic: dict, details: dict | None, default_city: str) -> dict[str, Any]:
    raw_parts = [
        p.strip()
        for p in str(basic.get("address") or "").split(",")
        if p.strip() and not re.match(r"^USA$", p.strip(), re.I)
    ]
    street = city = state_from_line = zip_code = ""
    if len(raw_parts) >= 3:
        last = raw_parts[-1]
        m = re.match(r"^([A-Z]{2})\s*(\d{5})?$", last, re.I)
        if m:
            state_from_line = m.group(1).upper()
            zip_code = m.group(2) or ""
        else:
            zm = re.search(r"\b(\d{5})\b", last)
            zip_code = zm.group(1) if zm else ""
        city = raw_parts[-2]
        street = ", ".join(raw_parts[:-2])
    elif len(raw_parts) == 2:
        street, city = raw_parts[0], raw_parts[1]
    elif raw_parts:
        street = raw_parts[0]

    if not city:
        city = default_city
    state = state_from_line or infer_state_from_zip_city(zip_code, city, "")
    cuisine_types = determine_cuisine_types(str(basic.get("title") or ""), str(basic.get("type") or ""))

    photos: list[str] = []
    place_results = (details or {}).get("place_results") if details else None
    if isinstance(place_results, dict):
        thumb = str(place_results.get("thumbnail") or "").strip()
        if thumb:
            photos.append(thumb)
        for img in place_results.get("images") or []:
            if isinstance(img, dict) and img.get("title") == "All":
                continue
            url = str(img.get("thumbnail") or img.get("image") or "").strip()
            if url and url not in photos:
                photos.append(url)
            if len(photos) >= 10:
                break

    gps = basic.get("gps_coordinates") if isinstance(basic.get("gps_coordinates"), dict) else {}
    return {
        "name": basic.get("title"),
        "cuisine_types": cuisine_types,
        "address": {
            "street": street,
            "city": city,
            "state": state,
            "zip": zip_code,
            "coordinates": {
                "lat": basic.get("latitude") or gps.get("latitude"),
                "lng": basic.get("longitude") or gps.get("longitude"),
            },
        },
        "phone": basic.get("phone") or (place_results or {}).get("phone") if place_results else basic.get("phone"),
        "website": basic.get("website") or (place_results or {}).get("website") if place_results else basic.get("website"),
        "description": generate_description(
            str(basic.get("title") or ""),
            cuisine_types,
            place_results if isinstance(place_results, dict) else None,
            city,
        ),
        "price_range": parse_price_range(str(basic.get("price") or "")),
        "hours": DEFAULT_HOURS.copy(),
        "google_rating": basic.get("rating"),
        "google_review_count": basic.get("reviews"),
        "photos": photos,
        "google_place_id": basic.get("place_id"),
        "google_maps_url": basic.get("link"),
    }


def scrape_metro(api_key: str, city: dict[str, str], env: dict[str, str]) -> tuple[list[dict], int]:
    max_details, skip_details = get_place_detail_limit(env)
    searches = 0
    location = f"{city['name']}, {city['state']}"
    all_results: list[dict] = []

    print(f"\n{'=' * 50}\nScraping: {location}\n{'=' * 50}")
    audit_log("metro start", {"city": city["name"], "state": city["state"]})

    for query in SEARCH_QUERIES:
        full_query = f"{query} in {location}"
        print(f"  Search: {full_query}")
        payload = fetch_serpapi(
            api_key,
            {
                "engine": "google_maps",
                "q": full_query,
                "ll": city["ll"],
                "type": "search",
            },
        )
        searches += 1
        results = (payload or {}).get("local_results") or []
        print(f"    → {len(results)} results")
        all_results.extend(r for r in results if isinstance(r, dict))
        time.sleep(1.0)

    unique = list({str(r.get("place_id") or r.get("title")): r for r in all_results}.values())
    print(f"  Unique map hits: {len(unique)}")

    detailed: list[tuple[dict, dict | None]] = []
    if skip_details or max_details == 0:
        detailed = [(r, None) for r in unique[:40]]
    else:
        for i, restaurant in enumerate(unique[:max_details]):
            place_id = str(restaurant.get("place_id") or "").strip()
            if not place_id:
                continue
            print(f"  Place detail {i + 1}/{min(len(unique), max_details)}: {restaurant.get('title')}")
            details = fetch_serpapi(
                api_key,
                {"engine": "google_maps", "type": "place", "place_id": place_id},
            )
            searches += 1
            detailed.append((restaurant, details))
            time.sleep(1.5)
        if not detailed:
            detailed = [(r, None) for r in unique[:40]]

    formatted = [
        convert_to_afritable_format(basic, details, city["name"]) for basic, details in detailed
    ]
    audit_log(
        "metro complete",
        {"city": city["name"], "count": len(formatted), "searchesUsed": searches},
        "success",
    )
    return formatted, searches


def cmd_plan(env: dict[str, str]) -> int:
    per_metro = estimate_per_metro(env)
    cities = parse_cities()
    scraped: list[str] = []
    missing: list[str] = []
    for c in cities:
        path = DATA_DIR / f"serpapi-{city_slug(c['name'])}-restaurants.json"
        (scraped if path.exists() else missing).append(c["name"])

    free = bool(re.match(r"^(1|true|yes)$", str(env.get("SERPAPI_FREE_TIER", "")), re.I))
    monthly_cap = 250 if free else 5000
    batch = missing[:5]

    print("SerpAPI scrape plan (python)\n")
    print(f"  API key present:     {'yes' if env.get('SERPAPI_KEY') else 'NO'}")
    print(f"  Est. searches/metro: ~{per_metro}")
    print(f"  Typical monthly cap: ~{monthly_cap}")
    print(f"  Metros in list:      {len(cities)}")
    print(f"  Local scrape files:  {len(scraped)}")
    print(f"  Missing scrape files:{len(missing)}\n")
    if missing:
        print("Next metros without local JSON (first 10):")
        for name in missing[:10]:
            print(f"    - {name}")
        print(f"\nSuggested: python3 scripts/scrape-cities-serpapi.py scrape {' '.join(batch[:3])}")
        print(f"Estimated searches: ~{min(3, len(batch)) * per_metro}\n")

    plan_path = DATA_DIR / "serpapi-scrape-plan.json"
    plan_path.write_text(
        json.dumps(
            {
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "perMetro": per_metro,
                "monthlyCap": monthly_cap,
                "scraped": scraped,
                "missing": missing,
                "suggestedBatch": batch[:3],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Plan file: {plan_path}")
    return 0


def cmd_scrape(city_names: list[str], env: dict[str, str]) -> int:
    api_key = env.get("SERPAPI_KEY") or ""
    if not api_key:
        print("ERROR: SERPAPI_KEY not set in .env.local")
        return 1

    all_cities = parse_cities()
    want = set(city_names)
    picked = [c for c in all_cities if c["name"] in want]
    if not picked:
        print(f"No matching cities. Examples: Tampa, Orlando, Denver, Charlotte")
        return 1

    per_metro = estimate_per_metro(env)
    est = len(picked) * per_metro
    print(f"\nEstimated SerpAPI searches: ~{est} ({len(picked)} × ~{per_metro})\n")
    audit_log("scrape batch start", {"cities": [c["name"] for c in picked], "estimatedSearches": est})

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    total_searches = 0
    all_formatted: list[dict] = []

    for i, city in enumerate(picked):
        formatted, used = scrape_metro(api_key, city, env)
        total_searches += used
        out = DATA_DIR / f"serpapi-{city_slug(city['name'])}-restaurants.json"
        out.write_text(json.dumps(formatted, indent=2) + "\n", encoding="utf-8")
        print(f"  Saved {len(formatted)} → {out}")
        all_formatted.extend(formatted)
        if i < len(picked) - 1:
            time.sleep(5)

    cmd_stitch()
    audit_log(
        "scrape batch complete",
        {"cities": [c["name"] for c in picked], "restaurants": len(all_formatted), "searchesUsed": total_searches},
        "summary",
    )
    print(f"\nTotal SerpAPI searches used: {total_searches}")
    return 0


def cmd_stitch() -> int:
    files = sorted(
        p
        for p in DATA_DIR.glob("serpapi-*-restaurants.json")
        if p.name != "serpapi-all-cities-restaurants.json"
    )
    all_rows: list[dict] = []
    for path in files:
        rows = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(rows, list):
            all_rows.extend(rows)

    unique = list({f"{r.get('name')}-{((r.get('address') or {}).get('street') or '')}": r for r in all_rows}.values())
    out = DATA_DIR / "serpapi-all-cities-restaurants.json"
    out.write_text(json.dumps(unique, indent=2) + "\n", encoding="utf-8")
    print(f"Stitched {len(files)} city files → {len(unique)} unique → {out}")
    audit_log("stitched", {"files": len(files), "unique": len(unique)})
    return 0


def slugify(value: str) -> str:
    s = re.sub(r"['\"]", "", str(value or "").lower().strip())
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", s))


def normalize_address_line(addr: str) -> str:
    return re.sub(r"\s+", " ", str(addr or "").lower()).strip()


def infer_state(city: str, zip_code: str, serp_state: str) -> str:
    upstream = str(serp_state or "").strip().upper()
    if re.match(r"^[A-Z]{2}$", upstream):
        return upstream
    return infer_state_from_zip_city(zip_code, city, "")


def infer_region(cuisine_types: list[str]) -> str:
    t = " ".join(cuisine_types or []).lower()
    if re.search(r"jamaican|trinidadian|haitian|caribbean", t):
        return "Caribbean"
    if re.search(r"nigerian|ghanaian|senegalese|liberian|west african", t):
        return "West African"
    if re.search(r"ethiopian|eritrean|somali|kenyan|east african", t):
        return "East African"
    if re.search(r"south african", t):
        return "Southern African"
    return "African"


def price_num_to_str(n: int | float) -> str:
    return {1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}.get(int(n), "$$")


def hours_to_simple(h: dict | None) -> dict[str, str]:
    return {"mon_sat": "11:00 AM - 9:00 PM", "sun": "12:00 PM - 8:00 PM"}


def serp_row_to_catalog(row: dict, used_ids: set[str]) -> dict:
    addr = row.get("address") or {}
    state = infer_state(str(addr.get("city") or ""), str(addr.get("zip") or ""), str(addr.get("state") or ""))
    street = str(addr.get("street") or "").strip()
    city = str(addr.get("city") or "").strip()
    zip_code = re.sub(r"\D", "", str(addr.get("zip") or ""))[:5]
    address = f"{street}, {city}, {state} {zip_code}".replace(", ,", ",").strip(", ")

    rec_id = slugify(f"{row.get('name')}-{city}") or f"serpapi-{secrets.token_hex(4)}"
    base = rec_id
    n = 0
    while rec_id in used_ids:
        n += 1
        rec_id = f"{base}-{n}"
    used_ids.add(rec_id)

    cuisines = row.get("cuisine_types") or ["African"]
    coords = addr.get("coordinates") or {}
    rec: dict[str, Any] = {
        "id": rec_id,
        "name": str(row.get("name") or "").strip(),
        "cuisine": cuisines[0] if cuisines else "African",
        "region": infer_region(cuisines),
        "price_range": price_num_to_str(row.get("price_range") or 2),
        "rating": row.get("google_rating") if isinstance(row.get("google_rating"), (int, float)) else 4.2,
        "address": address,
        "hours": hours_to_simple(row.get("hours")),
        "about": str(row.get("description") or f"{row.get('name')} — discovered via SerpAPI batch.")[:500],
        "our_story": "Listing sourced from public maps data; verify hours and menu before publishing.",
        "cultural_roots": "Diaspora dining in the United States.",
        "menu_highlights": ["Call for seasonal specials"],
        "vibe_category": "Authentic Staples",
        "state": state,
    }
    if row.get("phone"):
        rec["phone"] = row["phone"]
    if row.get("website"):
        rec["website"] = row["website"]
    if row.get("google_place_id"):
        rec["google_place_id"] = row["google_place_id"]
    if coords.get("lat") is not None:
        rec["lat"] = coords["lat"]
        rec["lng"] = coords.get("lng")
    if row.get("photos"):
        rec["images"] = row["photos"][:3]
    return rec


def cmd_merge() -> int:
    serp_path = DATA_DIR / "serpapi-all-cities-restaurants.json"
    if not serp_path.exists():
        print(f"Missing {serp_path}. Run scrape + stitch first.")
        return 1

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    serp = json.loads(serp_path.read_text(encoding="utf-8"))
    used_ids = {r["id"] for r in catalog if r.get("id")}
    seen_addresses = {normalize_address_line(r.get("address", "")) for r in catalog}
    seen_place_ids = {r["google_place_id"] for r in catalog if r.get("google_place_id")}

    added = skipped = 0
    added_ids: list[str] = []

    for row in serp:
        pid = row.get("google_place_id")
        if pid and pid in seen_place_ids:
            skipped += 1
            continue
        addr = row.get("address") or {}
        street = str(addr.get("street") or "").strip()
        city = str(addr.get("city") or "").strip()
        if not street or not city:
            skipped += 1
            continue
        state = infer_state(city, str(addr.get("zip") or ""), str(addr.get("state") or ""))
        zip_code = re.sub(r"\D", "", str(addr.get("zip") or ""))[:5]
        full_line = normalize_address_line(f"{street}, {city}, {state} {zip_code}")
        if full_line in seen_addresses:
            skipped += 1
            continue

        rec = serp_row_to_catalog(row, used_ids)
        seen_addresses.add(normalize_address_line(rec["address"]))
        if rec.get("google_place_id"):
            seen_place_ids.add(rec["google_place_id"])
        catalog.append(rec)
        added_ids.append(rec["id"])
        added += 1

    CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    print(f"Merged into {CATALOG_PATH}")
    print(f"  Added: {added}")
    print(f"  Skipped: {skipped}")
    print(f"  Total now: {len(catalog)}")
    audit_log("merge complete", {"added": added, "skipped": skipped, "total": len(catalog), "ids": added_ids[:20]})
    return 0


def main() -> int:
    env = load_env(ENV_PATH)
    env.update({k: v for k, v in os.environ.items() if k.startswith("SERPAPI_")})

    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["plan", "scrape", "stitch", "merge", "all"])
    parser.add_argument("cities", nargs="*", help="City names e.g. Tampa Orlando Denver")
    args = parser.parse_args()

    if args.command == "plan":
        return cmd_plan(env)
    if args.command == "stitch":
        return cmd_stitch()
    if args.command == "merge":
        return cmd_merge()
    if args.command == "scrape":
        if not args.cities:
            print("Provide city names: scrape Tampa Orlando Denver")
            return 1
        # Default free tier when unset to protect quota
        if "SERPAPI_FREE_TIER" not in env and "SERPAPI_FREE_TIER" not in os.environ:
            os.environ["SERPAPI_FREE_TIER"] = "1"
            env["SERPAPI_FREE_TIER"] = "1"
        return cmd_scrape(args.cities, env)
    if args.command == "all":
        if not args.cities:
            print("Provide city names: all Tampa Orlando Denver")
            return 1
        if "SERPAPI_FREE_TIER" not in env and "SERPAPI_FREE_TIER" not in os.environ:
            os.environ["SERPAPI_FREE_TIER"] = "1"
            env["SERPAPI_FREE_TIER"] = "1"
        rc = cmd_scrape(args.cities, env)
        if rc != 0:
            return rc
        return cmd_merge()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
