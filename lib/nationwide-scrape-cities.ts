/**
 * Google Maps scrape targets (SerpAPI) — expand as you add markets.
 * Coordinates are approximate map centers (12z) for African & Caribbean discovery runs.
 */
export type ScrapeCity = { name: string; state: string; ll: string };

/** Top metros + secondary markets for nationwide ingest (`npm run scrape:city`). */
export const NATIONWIDE_SCRAPE_CITIES: ScrapeCity[] = [
  // Tier 1 (top 15 CBSA-style)
  { name: "New York", state: "NY", ll: "@40.7128,-74.0060,11z" },
  { name: "Los Angeles", state: "CA", ll: "@34.0522,-118.2437,11z" },
  { name: "Chicago", state: "IL", ll: "@41.8781,-87.6298,11z" },
  { name: "Dallas", state: "TX", ll: "@32.7767,-96.7970,11z" },
  { name: "Houston", state: "TX", ll: "@29.7604,-95.3698,11z" },
  { name: "Atlanta", state: "GA", ll: "@33.7490,-84.3880,11z" },
  { name: "Washington", state: "DC", ll: "@38.9072,-77.0369,11z" },
  { name: "Miami", state: "FL", ll: "@25.7617,-80.1918,11z" },
  { name: "Philadelphia", state: "PA", ll: "@39.9526,-75.1652,11z" },
  { name: "Phoenix", state: "AZ", ll: "@33.4484,-112.0740,11z" },
  { name: "Boston", state: "MA", ll: "@42.3601,-71.0589,11z" },
  { name: "Riverside", state: "CA", ll: "@33.9533,-117.3962,11z" },
  { name: "San Francisco", state: "CA", ll: "@37.7749,-122.4194,11z" },
  { name: "Detroit", state: "MI", ll: "@42.3314,-83.0458,11z" },
  { name: "Seattle", state: "WA", ll: "@47.6062,-122.3321,11z" },
  // Additional major / growth markets
  { name: "Minneapolis", state: "MN", ll: "@44.9778,-93.2650,11z" },
  { name: "San Diego", state: "CA", ll: "@32.7157,-117.1611,11z" },
  { name: "Tampa", state: "FL", ll: "@27.9506,-82.4572,11z" },
  { name: "Denver", state: "CO", ll: "@39.7392,-104.9903,11z" },
  { name: "Brooklyn", state: "NY", ll: "@40.6782,-73.9442,11z" },
  { name: "Charlotte", state: "NC", ll: "@35.2271,-80.8431,11z" },
  { name: "Orlando", state: "FL", ll: "@28.5383,-81.3792,11z" },
  { name: "San Antonio", state: "TX", ll: "@29.4241,-98.4936,11z" },
  { name: "Portland", state: "OR", ll: "@45.5152,-122.6784,11z" },
  { name: "Las Vegas", state: "NV", ll: "@36.1699,-115.1398,11z" },
  { name: "Salt Lake City", state: "UT", ll: "@40.7608,-111.8910,11z" },
  { name: "Nashville", state: "TN", ll: "@36.1627,-86.7816,11z" },
  { name: "Austin", state: "TX", ll: "@30.2672,-97.7431,11z" },
  { name: "New Orleans", state: "LA", ll: "@29.9511,-90.0715,11z" },
  { name: "Kansas City", state: "MO", ll: "@39.0997,-94.5786,11z" },
  { name: "Columbus", state: "OH", ll: "@39.9612,-82.9988,11z" },
  { name: "Indianapolis", state: "IN", ll: "@39.7684,-86.1581,11z" },
  { name: "St. Louis", state: "MO", ll: "@38.6270,-90.1994,11z" },
  { name: "Baltimore", state: "MD", ll: "@39.2904,-76.6122,11z" },
  { name: "Sacramento", state: "CA", ll: "@38.5816,-121.4944,11z" },
  { name: "Raleigh", state: "NC", ll: "@35.7796,-78.6382,11z" },
  { name: "Cleveland", state: "OH", ll: "@41.4993,-81.6944,11z" },
  { name: "Jacksonville", state: "FL", ll: "@30.3322,-81.6557,11z" },
  { name: "Memphis", state: "TN", ll: "@35.1495,-90.0490,11z" },
  { name: "Oklahoma City", state: "OK", ll: "@35.4676,-97.5164,11z" },
  { name: "Louisville", state: "KY", ll: "@38.2527,-85.7585,11z" },
  { name: "Richmond", state: "VA", ll: "@37.5407,-77.4360,11z" },
  { name: "Buffalo", state: "NY", ll: "@42.8864,-78.8784,11z" },
  { name: "Hartford", state: "CT", ll: "@41.7658,-72.6734,11z" },
  { name: "Albuquerque", state: "NM", ll: "@35.0844,-106.6504,11z" },
  { name: "Tucson", state: "AZ", ll: "@32.2226,-110.9747,11z" },
  { name: "Honolulu", state: "HI", ll: "@21.3069,-157.8583,11z" },
];
