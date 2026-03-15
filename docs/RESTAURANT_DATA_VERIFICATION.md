# Restaurant Data Verification

This doc explains how to keep `data/restaurants.json` accurate and up to date using **Google Maps (the website)**, not the API.

## Verify via Google Maps (recommended)

1. Generate a report with one-click links to Google Maps for every restaurant:
   ```bash
   node scripts/verify-via-google-maps.mjs
   ```
2. Open the generated file in your browser:
   - **File:** `data/restaurants-verify-report.html`
3. Click **“Verify on Google Maps →”** for each restaurant. Google Maps opens with a search for that place.
4. On Google Maps, check the listing’s **address**, **phone**, **website**, and **hours**.
5. Update `data/restaurants.json` with any corrections (same `id` so links don’t break). Use `""` for missing website, not `"N/A"`.

Entries that need verification (missing phone, website, or full address) are highlighted in the report.

## Quick audit

Run the audit script to see which entries need work:

```bash
node scripts/audit-restaurant-data.mjs
```

It reports:

- **Missing phone** – no phone number
- **Missing/empty website** – no website or empty string
- **Invalid website** – value is not a valid URL (e.g. "N/A" left as text)
- **Address without ZIP** – address is city/neighborhood only (e.g. "Brooklyn, NY")
- **Missing state** – no `state` field

## How to verify a restaurant

1. **Search**: Google “[Restaurant name] [city]” or use the address if you have one.
2. **Check**:
   - Official name and any “also known as”
   - Full street address with ZIP
   - Current phone number
   - Current website (prefer official site over social only)
   - Opening hours (if you want to store them)
3. **Update** `data/restaurants.json`:
   - Use the same `id` (slug) so links don’t break.
   - Set `website` to `""` if they have no site (not `"N/A"`).
   - Ensure `state` is the 2-letter code (e.g. `"NY"`, `"TX"`).

## Already verified (sample)

These were checked against the web and updated in the repo:

- **Bamboo Walk** (Brooklyn) – address, phone, website, hours
- **BlackStar Kebab** (Seattle) – address, phone, website
- **48th Street Grille** (Philadelphia) – address, phone, website

## Bulk updates

- For many entries, use the audit output as a checklist.
- Prefer updating in small batches and re-running the audit.
- After editing `data/restaurants.json`, run `node scripts/audit-restaurant-data.mjs` again to confirm counts and fix any new issues.
