#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const restaurantsPath = path.join(__dirname, '..', 'data', 'restaurants.json');

// Read restaurants
const restaurants = JSON.parse(fs.readFileSync(restaurantsPath, 'utf-8'));

// Function to determine vibe category
function getVibeCategory(restaurant) {
  // Fine Dining indicators
  const fineDiningIndicators = [
    restaurant.price_range === '$$$$',
    restaurant.price_range === '$$$' && (restaurant.featured === true || restaurant.awards?.length > 0),
    restaurant.featured === true && (restaurant.price_range === '$$$' || restaurant.price_range === '$$$$'),
    restaurant.awards && restaurant.awards.length > 0 && (restaurant.price_range === '$$$' || restaurant.price_range === '$$$$'),
    restaurant.vibe?.toLowerCase().includes('fine dining'),
    restaurant.vibe?.toLowerCase().includes('elite'),
    restaurant.vibe?.toLowerCase().includes('sophisticated'),
    restaurant.vibe?.toLowerCase().includes('high-end'),
    restaurant.vibe?.toLowerCase().includes('michelin'),
    restaurant.vibe?.toLowerCase().includes('james beard'),
    restaurant.cuisine?.toLowerCase().includes('fine dining'),
  ];

  // Community Favorites indicators
  const communityFavoritesIndicators = [
    restaurant.vibe?.toLowerCase().includes('community'),
    restaurant.vibe?.toLowerCase().includes('family-owned'),
    restaurant.vibe?.toLowerCase().includes('neighborhood'),
    restaurant.vibe?.toLowerCase().includes('local'),
    restaurant.vibe?.toLowerCase().includes('authentic') && (restaurant.price_range === '$' || restaurant.price_range === '$$'),
  ];

  // Authentic Staples indicators
  const authenticStaplesIndicators = [
    restaurant.vibe?.toLowerCase().includes('authentic'),
    restaurant.vibe?.toLowerCase().includes('traditional'),
    restaurant.vibe?.toLowerCase().includes('casual'),
    restaurant.price_range === '$' || restaurant.price_range === '$$',
  ];

  // Determine category
  if (fineDiningIndicators.some(indicator => indicator === true)) {
    return 'Fine Dining';
  } else if (communityFavoritesIndicators.some(indicator => indicator === true)) {
    return 'Community Favorites';
  } else if (authenticStaplesIndicators.some(indicator => indicator === true)) {
    return 'Authentic Staples';
  } else {
    // Default based on price range
    if (restaurant.price_range === '$$$' || restaurant.price_range === '$$$$') {
      return 'Fine Dining';
    } else {
      return 'Authentic Staples';
    }
  }
}

// Add vibe_category to each restaurant
let fineDiningCount = 0;
let authenticStaplesCount = 0;
let communityFavoritesCount = 0;

restaurants.forEach(restaurant => {
  const category = getVibeCategory(restaurant);
  restaurant.vibe_category = category;
  
  if (category === 'Fine Dining') fineDiningCount++;
  else if (category === 'Authentic Staples') authenticStaplesCount++;
  else if (category === 'Community Favorites') communityFavoritesCount++;
});

// Write back to file
fs.writeFileSync(restaurantsPath, JSON.stringify(restaurants, null, 2) + '\n');

console.log('✅ Vibe categories added successfully!');
console.log(`📊 Statistics:`);
console.log(`   Fine Dining: ${fineDiningCount}`);
console.log(`   Authentic Staples: ${authenticStaplesCount}`);
console.log(`   Community Favorites: ${communityFavoritesCount}`);
console.log(`   Total: ${restaurants.length}`);
