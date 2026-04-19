# Restaurant curation (AfriTable)

## What “verified” means here

We cannot prove every row is open without calling each business. For the catalog we:

1. **Spot-check** flagship and random listings via web search (official site, major directories, recent press).
2. **Prefer** rows with working `website`, full address + ZIP, `phone`, and `hours` aligned to the operator’s published schedule.
3. **Queue** prospects missing phone/hours in `data/curation-candidates.json` before promoting them to `data/restaurants.json`.

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
