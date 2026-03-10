import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'data', 'restaurants.json');
const restaurants = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Define Closed/Outdated IDs to remove
const toRemove = ['peli-peli-houston', 'hou-sta-006'];

const cleanedData = restaurants
  .filter((r) => !toRemove.includes(r.id)) // Remove closed spots
  .map((r) => {
    // 2. Automatically extract State from the address string
    let state = 'TX'; // Default
    if (r.address) {
      const stateMatch = r.address.match(/\s([A-Z]{2})\s\d{5}/);
      state = stateMatch ? stateMatch[1] : 'TX';
    }

    // 3. Manual Fixes for neighborhood-only addresses
    if (r.name.includes('Bunna Cafe')) {
      r.address = '1084 Flushing Ave, Brooklyn, NY 11237';
      state = 'NY';
    }
    if (r.name.includes('Swahili Village') && r.address && r.address.includes('DC')) {
      r.address = '1990 M St NW, Washington, DC 20036';
      state = 'DC';
    }

    return { ...r, state };
  });

// 4. Remove exact duplicates based on address
const uniqueData = Array.from(new Map(cleanedData.map((item) => [item.address, item])).values());

fs.writeFileSync(filePath, JSON.stringify(uniqueData, null, 2));
console.log(`✅ Success! Processed ${uniqueData.length} restaurants with state fields.`);
