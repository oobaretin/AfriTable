// Geocoding utilities for zip code to coordinates conversion

// Simple zip code to coordinates lookup (US zip codes)
// This is a basic lookup - in production, you'd use a geocoding API or comprehensive database
const ZIP_CODE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Houston area
  "77001": { lat: 29.7604, lng: -95.3698 },
  "77002": { lat: 29.7604, lng: -95.3698 },
  "77024": { lat: 29.774, lng: -95.501 },
  "77201": { lat: 29.766, lng: -95.366 },
  "77045": { lat: 29.624, lng: -95.461 },
  "77057": { lat: 29.737, lng: -95.485 },
  "77042": { lat: 29.737, lng: -95.485 },
  "77004": { lat: 29.720, lng: -95.370 },
  "77011": { lat: 29.740, lng: -95.310 },
  "77036": { lat: 29.720, lng: -95.485 },
  "77074": { lat: 29.690, lng: -95.490 },
  "77063": { lat: 29.720, lng: -95.485 },
  "77082": { lat: 29.720, lng: -95.610 },
  "77084": { lat: 29.820, lng: -95.650 },
  "77090": { lat: 29.920, lng: -95.420 },
  "77015": { lat: 29.780, lng: -95.260 },
  "77071": { lat: 29.620, lng: -95.480 },
  
  // Katy area
  "77494": { lat: 29.736, lng: -95.823 },
  "77450": { lat: 29.749, lng: -95.753 },
  "77493": { lat: 29.736, lng: -95.823 },
  "77449": { lat: 29.820, lng: -95.820 },
  
  // New York
  "10023": { lat: 40.776, lng: -73.982 },
  "10029": { lat: 40.793, lng: -73.944 },
  "10036": { lat: 40.758, lng: -73.985 },
  
  // Washington DC
  "20024": { lat: 38.884, lng: -77.016 },
  "20002": { lat: 38.907, lng: -76.988 },
  "20009": { lat: 38.920, lng: -77.037 },
  
  // Los Angeles
  "90028": { lat: 34.098, lng: -118.326 },
  "90036": { lat: 34.069, lng: -118.361 },
  "90021": { lat: 34.033, lng: -118.238 },
  
  // Atlanta
  "30305": { lat: 33.831, lng: -84.388 },
  "30309": { lat: 33.799, lng: -84.388 },
  "30318": { lat: 33.786, lng: -84.443 },
  "30342": { lat: 33.878, lng: -84.378 },
  
  // Chicago
  "60640": { lat: 41.978, lng: -87.655 },
  "60629": { lat: 41.778, lng: -87.711 },
  "60615": { lat: 41.801, lng: -87.600 },
  
  // Miami
  "33136": { lat: 25.790, lng: -80.130 },
  "33127": { lat: 25.830, lng: -80.200 },
  
  // Philadelphia
  "19103": { lat: 39.952, lng: -75.165 },
  
  // Seattle
  "98122": { lat: 47.608, lng: -122.296 },
  
  // San Francisco
  "94111": { lat: 37.795, lng: -122.400 },
  
  // Portland
  "97214": { lat: 45.515, lng: -122.651 },
  
  // New Orleans
  "70115": { lat: 29.925, lng: -90.081 },
  
  // Boston
  "02115": { lat: 42.342, lng: -71.085 },
  
  // Detroit
  "48202": { lat: 42.331, lng: -83.046 },
  
  // San Antonio
  "78205": { lat: 29.424, lng: -98.494 },
  
  // Charlotte
  "28202": { lat: 35.227, lng: -80.843 },
  
  // Nashville
  "37203": { lat: 36.162, lng: -86.781 },
  
  // Charleston
  "29403": { lat: 32.787, lng: -79.937 },
  
  // Richmond
  "77406": { lat: 29.580, lng: -95.760 },
  
  // Sugar Land
  "77498": { lat: 29.620, lng: -95.630 },
  
  // Bellaire
  "77401": { lat: 29.705, lng: -95.458 },
  
  // Meadows Place
  "77477": { lat: 29.650, lng: -95.580 },
};

/**
 * Get coordinates for a zip code
 * Returns null if zip code not found
 */
export function getZipCodeCoordinates(zipCode: string): { lat: number; lng: number } | null {
  return ZIP_CODE_COORDINATES[zipCode] || null;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
