import * as fs from "node:fs";
import * as path from "node:path";

const filePath = path.join(process.cwd(), "data", "restaurants.json");
const restaurants = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// Extract city from address
function extractCity(address) {
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    return parts[1];
  }
  return "";
}

// Add city field to each restaurant
const restaurantsWithCity = restaurants.map((r) => ({
  ...r,
  city: extractCity(r.address),
}));

console.log(JSON.stringify(restaurantsWithCity, null, 2));
