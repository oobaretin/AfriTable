#!/usr/bin/env node

/**
 * Deduplication script for restaurants.json
 * Checks for duplicate entries by id or name and merges rich data fields
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const restaurantsPath = path.join(__dirname, '..', 'data', 'restaurants.json');

function deduplicateRestaurants() {
  try {
    const data = fs.readFileSync(restaurantsPath, 'utf-8');
    const restaurants = JSON.parse(data);
    
    const seenById = new Map();
    const seenByName = new Map();
    const deduplicated = [];
    let duplicatesFound = 0;
    let updatesMade = 0;

    for (const restaurant of restaurants) {
      const id = restaurant.id?.toLowerCase();
      const name = restaurant.name?.toLowerCase().trim();
      
      // Check for duplicate by ID
      if (id && seenById.has(id)) {
        console.log(`⚠️  Duplicate ID found: ${restaurant.id} (${restaurant.name})`);
        duplicatesFound++;
        
        // Merge rich data fields into existing entry
        const existing = seenById.get(id);
        if (restaurant.vibe && !existing.vibe) existing.vibe = restaurant.vibe;
        if (restaurant.specialty && !existing.specialty) existing.specialty = restaurant.specialty;
        if (restaurant.neighborhood && !existing.neighborhood) existing.neighborhood = restaurant.neighborhood;
        if (restaurant.vibe_tags && !existing.vibe_tags) existing.vibe_tags = restaurant.vibe_tags;
        if (restaurant.menu_highlights && !existing.menu_highlights) existing.menu_highlights = restaurant.menu_highlights;
        if (restaurant.website && !existing.website) existing.website = restaurant.website;
        if (restaurant.phone && !existing.phone) existing.phone = restaurant.phone;
        updatesMade++;
        continue;
      }
      
      // Check for duplicate by name (case-insensitive)
      if (name && seenByName.has(name)) {
        console.log(`⚠️  Duplicate name found: ${restaurant.name} (ID: ${restaurant.id})`);
        duplicatesFound++;
        
        // Merge rich data fields into existing entry
        const existing = seenByName.get(name);
        if (restaurant.vibe && !existing.vibe) existing.vibe = restaurant.vibe;
        if (restaurant.specialty && !existing.specialty) existing.specialty = restaurant.specialty;
        if (restaurant.neighborhood && !existing.neighborhood) existing.neighborhood = restaurant.neighborhood;
        if (restaurant.vibe_tags && !existing.vibe_tags) existing.vibe_tags = restaurant.vibe_tags;
        if (restaurant.menu_highlights && !existing.menu_highlights) existing.menu_highlights = restaurant.menu_highlights;
        if (restaurant.website && !existing.website) existing.website = restaurant.website;
        if (restaurant.phone && !existing.phone) existing.phone = restaurant.phone;
        updatesMade++;
        continue;
      }
      
      // Add to maps and array
      if (id) seenById.set(id, restaurant);
      if (name) seenByName.set(name, restaurant);
      deduplicated.push(restaurant);
    }

    if (duplicatesFound > 0) {
      console.log(`\n✅ Deduplication complete:`);
      console.log(`   - Found ${duplicatesFound} duplicate(s)`);
      console.log(`   - Updated ${updatesMade} existing entry/entries`);
      console.log(`   - Final count: ${deduplicated.length} restaurants`);
      
      // Write back to file
      fs.writeFileSync(restaurantsPath, JSON.stringify(deduplicated, null, 2) + '\n', 'utf-8');
      console.log(`\n✅ Updated restaurants.json`);
    } else {
      console.log(`✅ No duplicates found. Total restaurants: ${deduplicated.length}`);
    }
  } catch (error) {
    console.error('❌ Error deduplicating restaurants:', error);
    process.exit(1);
  }
}

deduplicateRestaurants();
