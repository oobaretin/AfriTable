# Restaurant curation (AfriTable)

AfriTable is a **reservation platform for sit-down African and Caribbean dining**. Listings must represent places a guest can realistically visit, sit, and eat — not delivery-only kitchens, food trucks, retail markets, or ghost/virtual brands without a dining room.

## Dine-in scope (what belongs in the catalog)

**Include** when the operator has a public dining room or seated counter service, even if they also offer delivery, catering, or online ordering via Toast/DoorDash/Uber Eats.

**Exclude** when the operator is primarily:

- Pickup/delivery-only (no dine-in)
- A food truck or mobile vendor without a fixed sit-down location
- A home kitchen or commissary not open to the public as a restaurant
- A grocery, market, or specialty retail store
- A virtual/ghost brand with no bookable physical dining room
- Permanently closed, misclassified cuisine, or unverifiable scrape noise

**Do not remove** only because a listing lacks a standalone website — many legitimate dine-in spots use social or delivery platforms as their web presence.

Scripts:

- `python3 scripts/curation-remove-flagged.py` — closed, misclassified, or unverifiable listings
- `python3 scripts/curation-remove-non-dine-in.py` — pickup-only, trucks, retail, home kitchens
- `node scripts/remove-non-dine-in-restaurants.mjs` — legacy batch (Supabase sync)

## What “verified” means here

We cannot prove every row is open without calling each business. For the catalog we:

1. **Spot-check** flagship and random listings via web search (official site, major directories, recent press).
2. **Prefer** rows with working `website`, full address + ZIP, `phone`, and `hours` aligned to the operator’s published schedule.
3. **Queue** prospects missing phone/hours in `data/curation-candidates.json` before promoting them to `data/restaurants.json`.

## Spot-check log (July 2026)

| Listing | Result |
|--------|--------|
| Spicy Fame (Raleigh) | Pickup/delivery only — **removed** |
| Saaraloge's Kitchen (Riverside) | Home-kitchen pickup — **removed** |
| Bee's Island Kitchen (Tampa) | Carryout-only — **removed** |
| Selam (Houston) | Retail specialty store ([selamspecialty.com](https://selamspecialty.com/)) — **removed** |
| Kayode Restaurant Mirage (Brooklyn) | Pickup/delivery-focused; dine-in not open — **removed** |
| BlackStar Kebab (Seattle) | Food truck — **removed** |
| Benita's Kitchen (Orlando) | Chevron counter spot with dine-in seating — **kept** |
| ULTRA KITCHEN (San Antonio) | Dine-in + catering — **kept** |
| The Social Room (Cleveland Heights) | Neighborhood dive bar — **removed** |
| Niimatallaah (Tampa) | Address maps to medical campus — **removed** |
| Siphokazi (Tampa) | Unverifiable at fairgrounds address — **removed** |
| Global Cuisine (Denver) | Global Grocery Mart at same address — **removed** |
| Afro Caribbean Grill (Houston) | Food truck — takeout/delivery only — **removed** |
| Igatap African Caribbean Cuisine (Orlando) | SNAP retailer at grocery-market address — **removed** |

### Website batch 6 (Jul 2026, Colorado)

| Listing | Website |
|---------|---------|
| Fidel East African Restaurant (Aurora) | facebook.com/FidelResturant |
| Abyssinia Ethiopian Restaurant (Denver) | facebook.com/injera720 |
| All-Stars Cafe (Aurora) | Facebook page |
| Zula Cafe & Lounge (Aurora) | Facebook page |

No verified URL yet: 5 Star Café, Lalibela Cafe, Geez Habesha, Sarr Maimouna.

### Website batch 7 (Jul 2026, Texas)

| Listing | Website |
|---------|---------|
| Ponti's Ivorian Kitchen (Houston) | instagram.com/pontiskitchen |
| Chef Benny (Houston) | instagram.com/chefbennyhouston |
| Fufudelight & Suya Kitchen (Arlington) | Facebook page |
| Dee Titolat African Restaurant (Houston) | instagram.com/dee_titolat_cuissine |
| Vertex (Houston) | Facebook page |
| Ewatomi (Houston) | facebook.com/ewatominaturalherbsandfoods |
| Traditional Food Restaurant (Houston) | Facebook page |
| Cafe De Vivre (Houston) | instagram.com/cafedevivrehouston |
| Grill Master African Restaurant (Houston) | instagram.com/grill_master_african_resto |

Afro Caribbean Grill (Houston) — food truck, takeout-only — **removed**.

### Website batch 8 (Jul 2026, Florida)

| Listing | Website |
|---------|---------|
| Marabou Restaurant and Lounge (Orlando) | instagram.com/marabou_lounge_restaurant |

Igatap African Caribbean Cuisine — misclassified SNAP/grocery address — **removed**.

No verified URL yet: ~~Benita's Kitchen~~ — resolved in batch 10 via Google Business profile.

### Website batch 9 (Jul 2026, Colorado — remaining)

| Listing | Website |
|---------|---------|
| Geez Habesha Bar & Restaurant (Aurora) | onhavanastreet.com business profile |
| 5 Star Café Eritrean Restaurant (Denver) | Facebook page |
| Lalibela Cafe (Denver) | instagram.com/lalibela_cafe |
| Sarr Maimouna West African Food (Denver) | facebook.com/SarrMaimounaKitchen |

Corrected Sarr Maimouna address: 10004 E Colfax (Aurora scrape) → **5091 E Colfax Ave, Denver** (Westword / Uber Eats).

### Website batch 10 (Jul 2026, final queue)

| Listing | Website |
|---------|---------|
| AMAYE International Restaurant (Portland) | instagram.com/amayeskitchenpdx |
| Mega Suya Bar & Grill (Indianapolis) | instagram.com/megasuyabarandgrill |
| Benita's Kitchen (Orlando) | Google Maps business profile (no verified social page) |

Website research queue cleared — **0** listings missing operator URLs.

### Website batch 5 (Jul 2026, non–TX/CO/FL)

Applied social/operator URLs where standalone sites do not exist:

| Listing | Website |
|---------|---------|
| D. Salam African Cuisine (NYC) | instagram.com/dsalamrestaurant |
| Samoha African Cuisine (Charlotte) | Facebook page |
| Safina World Restaurant (Columbus) | Facebook page |
| Nico's Lounge (Nashville) | Facebook page |
| AfroSpice BisTro (Bronx) | instagram.com/afrospice_bistro |
| International Delicious Kitchen (Columbus) | Facebook page |

No verified standalone site: AMAYE (Portland), Mega Suya (Indianapolis), Fufudelight (Arlington TX — catalog `state` typo AZ).

## Spot-check log (April 2026)

| Listing | Result |
|--------|--------|
| Swahili Village (DC) | Still operating; [swahilivillages.com](https://www.swahilivillages.com/washington-dc). OpenTable may show intermittent online booking—does not mean closed. |
| Tatiana by Kwame Onwuachi (NYC) | Open; [tatiananyc.com](https://www.tatiananyc.com/). |
| Dukunoo Jamaican Kitchen (Miami) | Open; Wynwood location active. |
| Omalicha Kitchen (Houston) | Open; [omalichakitchen.com](https://www.omalichakitchen.com/). |
| Yassa African Restaurant (Chicago) | Open; long-running Bronzeville location. |
| Café Nubia (Dallas) | Open; hours updated in JSON to match published Wed–Sun lounge schedule (Mon–Tue closed). |

## Gaps to fill next

- **Colorado** had no rows; added **Whittier Cafe** (Denver) as a verified coffee/ceremony anchor.
- **Dallas** added **Shuri African Restaurant** (Walnut St)—distinct from existing Aldeez / Island Spot / Café Nubia row.
- **Florida** is under-represented vs Houston/NY—prioritize vetted Miami/Broward/Tampa adds.
- **Grilling Jerk Island** (Denver, opened ~Nov 2025)—see `data/curation-candidates.json` until phone + hours are confirmed.

## How to add a restaurant

1. Add a complete object to `data/restaurants.json` (match existing shape: `id`, `name`, `cuisine`, `region`, `price_range`, `rating`, `address`, `phone`, `website`, `hours`, `state`, …).
2. Run `node scripts/audit-restaurant-data.mjs` and fix any reported gaps.
3. Deploy; confirm detail page and availability behave as expected (Supabase vs JSON catalog).
