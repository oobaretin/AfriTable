# SerpAPI Restaurant Scraping Guide

This guide explains how to use SerpAPI to scrape African and Caribbean restaurant data for AfriTable.

## Setup

### 1. Get SerpAPI Key

1. Sign up for a free account at [https://serpapi.com/users/sign_up](https://serpapi.com/users/sign_up)
2. Get your API key from the dashboard
3. Add to `.env.local`:
   ```
   SERPAPI_KEY=your_api_key_here
   ```

### 2. Install Dependencies

Dependencies are already installed:
- `serpapi` - SerpAPI client library
- `tsx` - TypeScript execution (already in package.json)

## Usage

### Scrape Single City (Houston)

```bash
npm run scrape:serpapi
```

This will:
- Search for African and Caribbean restaurants in Houston
- Fetch detailed information for each restaurant
- Save results to:
  - `data/serpapi-restaurants-raw.json` (raw API responses)
  - `data/serpapi-restaurants-formatted.json` (formatted for AfriTable)

### Scrape Multiple Cities

```bash
# Scrape all cities
npm run scrape:city

# Scrape specific cities
npm run scrape:city Houston Atlanta
```

Supported cities:
- Houston, TX
- Atlanta, GA
- Washington, DC
- New York, NY
- Los Angeles, CA
- Chicago, IL
- Dallas, TX
- Miami, FL

Results are saved to:
- `data/serpapi-{city}-restaurants.json` (per city)
- `data/serpapi-all-cities-restaurants.json` (combined, deduplicated)

## Workflow

### Step 1: Scrape Restaurants

```bash
npm run scrape:serpapi
```

### Step 2: Review Data

Open `data/serpapi-restaurants-formatted.json` and review:
- Restaurant names
- Addresses
- Cuisine types
- Ratings and reviews
- Contact information

### Step 3: Import to Database

```bash
npm run import:json -- ./data/serpapi-restaurants-formatted.json
```

This will:
- Import restaurants to the database
- Set `is_active: false` by default (requires admin approval)
- Create restaurant tables for reservations

### Step 4: Admin Review

1. Visit `/admin/pending-restaurants`
2. Review each restaurant
3. Activate restaurants that meet quality standards

## Data Format

The scraper converts SerpAPI data to AfriTable format:

```json
{
  "name": "Restaurant Name",
  "cuisine_types": ["Nigerian", "West African"],
  "address": {
    "street": "123 Main St",
    "city": "Houston",
    "state": "TX",
    "zip": "77000",
    "coordinates": {
      "lat": 29.7604,
      "lng": -95.3698
    }
  },
  "phone": "+1 713-555-0100",
  "website": "https://example.com",
  "description": "Authentic Nigerian restaurant...",
  "price_range": 2,
  "hours": { ... },
  "google_rating": 4.5,
  "review_count": 120,
  "photos": [...],
  "google_place_id": "...",
  "google_maps_url": "..."
}
```

## Rate Limits

SerpAPI has rate limits based on your plan:
- Free tier: 100 searches/month
- Paid plans: Higher limits

The scraper includes delays between requests to respect rate limits:
- 1 second between search queries
- 1.5 seconds between place detail requests
- 5 seconds between cities

## Troubleshooting

### "Invalid API key" error

- Verify `SERPAPI_KEY` is set in `.env.local`
- Check your API key is active in SerpAPI dashboard
- Ensure you haven't exceeded rate limits

### No results returned

- Check your SerpAPI quota
- Verify the search queries are correct
- Try a different city or search term

### Import fails

- Check the JSON file format is valid
- Verify database connection
- Check for duplicate restaurants (by slug)

## Notes

- Restaurants are imported as `is_active: false` by default
- Admin must review and activate restaurants
- Duplicate restaurants (by slug) are handled by upsert
- Photos from Google Maps are included if available
