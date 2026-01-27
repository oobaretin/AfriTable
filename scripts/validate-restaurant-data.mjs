import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

// Known city-state mappings
const CITY_STATE_MAP = {
  "houston": "TX",
  "dallas": "TX",
  "austin": "TX",
  "san antonio": "TX",
  "fort worth": "TX",
  "atlanta": "GA",
  "washington": "DC",
  "falls church": "VA",
  "arlington": "VA",
  "alexandria": "VA",
  "fairfax": "VA",
  "vienna": "VA",
  "reston": "VA",
  "mclean": "VA",
  "new york": "NY",
  "brooklyn": "NY",
  "queens": "NY",
  "los angeles": "CA",
  "san francisco": "CA",
  "san diego": "CA",
  "chicago": "IL",
  "philadelphia": "PA",
  "phoenix": "AZ",
  "san antonio": "TX",
  "san jose": "CA",
  "jacksonville": "FL",
  "miami": "FL",
  "boston": "MA",
  "seattle": "WA",
  "denver": "CO",
  "baltimore": "MD",
  "charlotte": "NC",
  "nashville": "TN",
  "detroit": "MI",
  "portland": "OR",
  "oklahoma city": "OK",
  "las vegas": "NV",
  "memphis": "TN",
  "louisville": "KY",
  "milwaukee": "WI",
  "albuquerque": "NM",
  "tucson": "AZ",
  "fresno": "CA",
  "sacramento": "CA",
  "kansas city": "MO",
  "mesa": "AZ",
  "atlanta": "GA",
  "omaha": "NE",
  "raleigh": "NC",
  "minneapolis": "MN",
  "tulsa": "OK",
  "cleveland": "OH",
  "wichita": "KS",
  "arlington": "TX",
  "new orleans": "LA",
  "oakland": "CA",
  "minneapolis": "MN",
  "tampa": "FL",
  "tulsa": "OK",
  "cleveland": "OH",
  "wichita": "KS",
  "arlington": "TX",
  "new orleans": "LA",
  "oakland": "CA",
  "miami": "FL",
  "honolulu": "HI",
  "long beach": "CA",
  "virginia beach": "VA",
  "oakland": "CA",
  "minneapolis": "MN",
  "tulsa": "OK",
  "cleveland": "OH",
  "wichita": "KS",
  "arlington": "TX",
  "new orleans": "LA",
  "oakland": "CA",
  "bakersfield": "CA",
  "aurora": "CO",
  "anaheim": "CA",
  "santa ana": "CA",
  "st. louis": "MO",
  "corpus christi": "TX",
  "riverside": "CA",
  "lexington": "KY",
  "pittsburgh": "PA",
  "anchorage": "AK",
  "stockton": "CA",
  "cincinnati": "OH",
  "st. paul": "MN",
  "toledo": "OH",
  "greensboro": "NC",
  "newark": "NJ",
  "plano": "TX",
  "henderson": "NV",
  "lincoln": "NE",
  "buffalo": "NY",
  "jersey city": "NJ",
  "chula vista": "CA",
  "fort wayne": "IN",
  "orlando": "FL",
  "st. petersburg": "FL",
  "chandler": "AZ",
  "laredo": "TX",
  "norfolk": "VA",
  "durham": "NC",
  "madison": "WI",
  "lubbock": "TX",
  "winston-salem": "NC",
  "garland": "TX",
  "glendale": "AZ",
  "hialeah": "FL",
  "reno": "NV",
  "chesapeake": "VA",
  "scottsdale": "AZ",
  "north las vegas": "NV",
  "irving": "TX",
  "fremont": "CA",
  "irvine": "CA",
  "birmingham": "AL",
  "rochester": "NY",
  "san bernardino": "CA",
  "spokane": "WA",
  "gilbert": "AZ",
  "arlington": "VA",
  "montgomery": "AL",
  "boise": "ID",
  "richmond": "VA",
  "des moines": "IA",
  "modesto": "CA",
  "fayetteville": "NC",
  "shreveport": "LA",
  "tacoma": "WA",
  "fontana": "CA",
  "oxnard": "CA",
  "aurora": "IL",
  "moreno valley": "CA",
  "yonkers": "NY",
  "huntington beach": "CA",
  "glendale": "CA",
  "santa clarita": "CA",
  "grand rapids": "MI",
  "overland park": "KS",
  "salt lake city": "UT",
  "tallahassee": "FL",
  "grand prairie": "TX",
  "amarillo": "TX",
  "port st. lucie": "FL",
  "huntsville": "AL",
  "grand prairie": "TX",
  "brownsville": "TX",
  "providence": "RI",
  "santa clarita": "CA",
  "peoria": "AZ",
  "ontario": "CA",
  "vancouver": "WA",
  "sioux falls": "SD",
  "chattanooga": "TN",
  "fort lauderdale": "FL",
  "tempe": "AZ",
  "oakland": "CA",
  "el paso": "TX",
  "dayton": "OH",
  "salem": "OR",
  "little rock": "AR",
  "cape coral": "FL",
  "pembroke pines": "FL",
  "santa rosa": "CA",
  "eugene": "OR",
  "corona": "CA",
  "springfield": "MO",
  "peoria": "IL",
  "pasadena": "TX",
  "fort collins": "CO",
  "joliet": "IL",
  "paterson": "NJ",
  "rockford": "IL",
  "naperville": "IL",
  "savannah": "GA",
  "mesquite": "TX",
  "ontario": "CA",
  "mcallen": "TX",
  "syracuse": "NY",
  "palmdale": "CA",
  "hayward": "CA",
  "lakewood": "CO",
  "hollywood": "FL",
  "torrance": "CA",
  "yonkers": "NY",
  "bridgeport": "CT",
  "hampton": "VA",
  "elizabeth": "NJ",
  "kansas city": "KS",
  "warren": "MI",
  "stamford": "CT",
  "thousand oaks": "CA",
  "cedar rapids": "IA",
  "visalia": "CA",
  "new haven": "CT",
  "west palm beach": "FL",
  "south bend": "IN",
  "erie": "PA",
  "fargo": "ND",
  "concord": "CA",
  "evansville": "IN",
  "sterling heights": "MI",
  "wilmington": "NC",
  "hartford": "CT",
  "pueblo": "CO",
  "charleston": "SC",
  "pasadena": "CA",
  "orange": "CA",
  "fullerton": "CA",
  "killeen": "TX",
  "frisco": "TX",
  "daytona beach": "FL",
  "waterbury": "CT",
  "norman": "OK",
  "columbia": "SC",
  "vallejo": "CA",
  "abilene": "TX",
  "berkeley": "CA",
  "round rock": "TX",
  "ann arbor": "MI",
  "lansing": "MI",
  "pomona": "CA",
  "allentown": "PA",
  "mckinney": "TX",
  "fairfield": "CA",
  "westminster": "CO",
  "richardson": "TX",
  "clearwater": "FL",
  "carlsbad": "CA",
  "west covina": "CA",
  "brandon": "FL",
  "roswell": "GA",
  "sandy springs": "GA",
  "gainesville": "FL",
  "waco": "TX",
  "bellevue": "WA",
  "plano": "TX",
  "west valley city": "UT",
  "davenport": "IA",
  "erie": "PA",
  "spokane": "WA",
  "fremont": "CA",
  "irvine": "CA",
  "san bernardino": "CA",
  "boise": "ID",
  "birmingham": "AL",
  "rochester": "NY",
  "richmond": "VA",
  "des moines": "IA",
  "modesto": "CA",
  "fayetteville": "NC",
  "shreveport": "LA",
  "tacoma": "WA",
  "fontana": "CA",
  "oxnard": "CA",
  "aurora": "IL",
  "moreno valley": "CA",
  "yonkers": "NY",
  "huntington beach": "CA",
  "glendale": "CA",
  "santa clarita": "CA",
  "grand rapids": "MI",
  "overland park": "KS",
  "salt lake city": "UT",
  "tallahassee": "FL",
  "grand prairie": "TX",
  "amarillo": "TX",
  "port st. lucie": "FL",
  "huntsville": "AL",
  "brownsville": "TX",
  "providence": "RI",
  "peoria": "AZ",
  "ontario": "CA",
  "vancouver": "WA",
  "sioux falls": "SD",
  "chattanooga": "TN",
  "fort lauderdale": "FL",
  "tempe": "AZ",
  "el paso": "TX",
  "dayton": "OH",
  "salem": "OR",
  "little rock": "AR",
  "cape coral": "FL",
  "pembroke pines": "FL",
  "santa rosa": "CA",
  "eugene": "OR",
  "corona": "CA",
  "springfield": "MO",
  "peoria": "IL",
  "pasadena": "TX",
  "fort collins": "CO",
  "joliet": "IL",
  "paterson": "NJ",
  "rockford": "IL",
  "naperville": "IL",
  "savannah": "GA",
  "mesquite": "TX",
  "mcallen": "TX",
  "syracuse": "NY",
  "palmdale": "CA",
  "hayward": "CA",
  "lakewood": "CO",
  "hollywood": "FL",
  "torrance": "CA",
  "bridgeport": "CT",
  "hampton": "VA",
  "elizabeth": "NJ",
  "kansas city": "KS",
  "warren": "MI",
  "stamford": "CT",
  "thousand oaks": "CA",
  "cedar rapids": "IA",
  "visalia": "CA",
  "new haven": "CT",
  "west palm beach": "FL",
  "south bend": "IN",
  "erie": "PA",
  "fargo": "ND",
  "concord": "CA",
  "evansville": "IN",
  "sterling heights": "MI",
  "wilmington": "NC",
  "hartford": "CT",
  "pueblo": "CO",
  "charleston": "SC",
  "pasadena": "CA",
  "orange": "CA",
  "fullerton": "CA",
  "killeen": "TX",
  "frisco": "TX",
  "daytona beach": "FL",
  "waterbury": "CT",
  "norman": "OK",
  "columbia": "SC",
  "vallejo": "CA",
  "abilene": "TX",
  "berkeley": "CA",
  "round rock": "TX",
  "ann arbor": "MI",
  "lansing": "MI",
  "pomona": "CA",
  "allentown": "PA",
  "mckinney": "TX",
  "fairfield": "CA",
  "westminster": "CO",
  "richardson": "TX",
  "clearwater": "FL",
  "carlsbad": "CA",
  "west covina": "CA",
  "brandon": "FL",
  "roswell": "GA",
  "sandy springs": "GA",
  "gainesville": "FL",
  "waco": "TX",
  "bellevue": "WA",
  "west valley city": "UT",
  "davenport": "IA",
  "meadows place": "TX",
  "cypress": "TX",
};

// ZIP code to state mapping (first 3 digits)
const ZIP_STATE_MAP = {
  "770": "TX", // Houston
  "750": "TX", // Dallas
  "787": "TX", // Austin
  "782": "TX", // San Antonio
  "761": "TX", // Fort Worth
  "303": "GA", // Atlanta
  "200": "DC", // Washington DC
  "220": "VA", // Northern Virginia
  "221": "VA", // Northern Virginia
  "222": "VA", // Arlington
  "223": "VA", // Alexandria
  "100": "NY", // New York
  "900": "CA", // Los Angeles
  "941": "CA", // San Francisco
  "606": "IL", // Chicago
  "191": "PA", // Philadelphia
  "850": "AZ", // Phoenix
  "331": "FL", // Miami
  "021": "MA", // Boston
  "981": "WA", // Seattle
  "802": "CO", // Denver
  "212": "MD", // Baltimore
  "282": "NC", // Charlotte
  "372": "TN", // Nashville
  "482": "MI", // Detroit
  "972": "OR", // Portland
  "891": "NV", // Las Vegas
  "381": "TN", // Memphis
  "402": "KY", // Louisville
  "532": "WI", // Milwaukee
  "871": "NM", // Albuquerque
  "857": "AZ", // Tucson
  "937": "CA", // Fresno
  "958": "CA", // Sacramento
  "641": "MO", // Kansas City
  "852": "AZ", // Mesa
  "303": "GA", // Atlanta
  "681": "NE", // Omaha
  "276": "NC", // Raleigh
  "554": "MN", // Minneapolis
  "741": "OK", // Tulsa
  "441": "OH", // Cleveland
  "672": "KS", // Wichita
  "760": "TX", // Arlington, TX
  "701": "LA", // New Orleans
  "946": "CA", // Oakland
  "968": "HI", // Honolulu
  "908": "CA", // Long Beach
  "234": "VA", // Virginia Beach
  "933": "CA", // Bakersfield
  "800": "CO", // Aurora, CO
  "928": "CA", // Anaheim
  "927": "CA", // Santa Ana
  "631": "MO", // St. Louis
  "784": "TX", // Corpus Christi
  "925": "CA", // Riverside
  "405": "KY", // Lexington
  "152": "PA", // Pittsburgh
  "995": "AK", // Anchorage
  "952": "CA", // Stockton
  "452": "OH", // Cincinnati
  "551": "MN", // St. Paul
  "436": "OH", // Toledo
  "274": "NC", // Greensboro
  "071": "NJ", // Newark
  "750": "TX", // Plano
  "890": "NV", // Henderson
  "685": "NE", // Lincoln
  "142": "NY", // Buffalo
  "073": "NJ", // Jersey City
  "919": "CA", // Chula Vista
  "468": "IN", // Fort Wayne
  "328": "FL", // Orlando
  "337": "FL", // St. Petersburg
  "852": "AZ", // Chandler
  "780": "TX", // Laredo
  "235": "VA", // Norfolk
  "277": "NC", // Durham
  "537": "WI", // Madison
  "794": "TX", // Lubbock
  "271": "NC", // Winston-Salem
  "750": "TX", // Garland
  "853": "AZ", // Glendale, AZ
  "330": "FL", // Hialeah
  "895": "NV", // Reno
  "233": "VA", // Chesapeake
  "852": "AZ", // Scottsdale
  "890": "NV", // North Las Vegas
  "750": "TX", // Irving
  "945": "CA", // Fremont
  "926": "CA", // Irvine
  "352": "AL", // Birmingham
  "146": "NY", // Rochester
  "924": "CA", // San Bernardino
  "992": "WA", // Spokane
  "852": "AZ", // Gilbert
  "222": "VA", // Arlington, VA
  "361": "AL", // Montgomery
  "837": "ID", // Boise
  "232": "VA", // Richmond
  "503": "IA", // Des Moines
  "953": "CA", // Modesto
  "283": "NC", // Fayetteville
  "711": "LA", // Shreveport
  "984": "WA", // Tacoma
  "923": "CA", // Fontana
  "930": "CA", // Oxnard
  "605": "IL", // Aurora, IL
  "922": "CA", // Moreno Valley
  "107": "NY", // Yonkers
  "926": "CA", // Huntington Beach
  "912": "CA", // Glendale, CA
  "913": "CA", // Santa Clarita
  "495": "MI", // Grand Rapids
  "662": "KS", // Overland Park
  "841": "UT", // Salt Lake City
  "323": "FL", // Tallahassee
  "750": "TX", // Grand Prairie
  "791": "TX", // Amarillo
  "349": "FL", // Port St. Lucie
  "358": "AL", // Huntsville
  "785": "TX", // Brownsville
  "029": "RI", // Providence
  "853": "AZ", // Peoria, AZ
  "917": "CA", // Ontario
  "986": "WA", // Vancouver, WA
  "571": "SD", // Sioux Falls
  "374": "TN", // Chattanooga
  "333": "FL", // Fort Lauderdale
  "852": "AZ", // Tempe
  "799": "TX", // El Paso
  "454": "OH", // Dayton
  "973": "OR", // Salem
  "722": "AR", // Little Rock
  "339": "FL", // Cape Coral
  "330": "FL", // Pembroke Pines
  "954": "CA", // Santa Rosa
  "974": "OR", // Eugene
  "928": "CA", // Corona
  "658": "MO", // Springfield, MO
  "616": "IL", // Peoria, IL
  "775": "TX", // Pasadena, TX
  "805": "CO", // Fort Collins
  "604": "IL", // Joliet
  "075": "NJ", // Paterson
  "611": "IL", // Rockford
  "605": "IL", // Naperville
  "314": "GA", // Savannah
  "751": "TX", // Mesquite
  "785": "TX", // McAllen
  "132": "NY", // Syracuse
  "935": "CA", // Palmdale
  "945": "CA", // Hayward
  "802": "CO", // Lakewood
  "330": "FL", // Hollywood, FL
  "905": "CA", // Torrance
  "066": "CT", // Bridgeport
  "236": "VA", // Hampton
  "072": "NJ", // Elizabeth
  "661": "KS", // Kansas City, KS
  "480": "MI", // Warren
  "069": "CT", // Stamford
  "913": "CA", // Thousand Oaks
  "524": "IA", // Cedar Rapids
  "932": "CA", // Visalia
  "065": "CT", // New Haven
  "334": "FL", // West Palm Beach
  "466": "IN", // South Bend
  "165": "PA", // Erie
  "581": "ND", // Fargo
  "945": "CA", // Concord
  "477": "IN", // Evansville
  "483": "MI", // Sterling Heights
  "284": "NC", // Wilmington
  "061": "CT", // Hartford
  "810": "CO", // Pueblo
  "294": "SC", // Charleston
  "911": "CA", // Pasadena, CA
  "928": "CA", // Orange
  "928": "CA", // Fullerton
  "765": "TX", // Killeen
  "750": "TX", // Frisco
  "321": "FL", // Daytona Beach
  "067": "CT", // Waterbury
  "730": "OK", // Norman
  "292": "SC", // Columbia
  "945": "CA", // Vallejo
  "796": "TX", // Abilene
  "947": "CA", // Berkeley
  "786": "TX", // Round Rock
  "481": "MI", // Ann Arbor
  "489": "MI", // Lansing
  "917": "CA", // Pomona
  "181": "PA", // Allentown
  "750": "TX", // McKinney
  "945": "CA", // Fairfield
  "800": "CO", // Westminster
  "750": "TX", // Richardson
  "337": "FL", // Clearwater
  "920": "CA", // Carlsbad
  "917": "CA", // West Covina
  "335": "FL", // Brandon
  "300": "GA", // Roswell
  "303": "GA", // Sandy Springs
  "326": "FL", // Gainesville
  "767": "TX", // Waco
  "980": "WA", // Bellevue
  "841": "UT", // West Valley City
  "528": "IA", // Davenport
  "774": "TX", // Meadows Place, Cypress, Richmond (TX)
  "775": "TX", // Pasadena, TX area
};

function validatePhone(phone) {
  if (!phone) return { valid: true, issue: null };
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { valid: false, issue: `Invalid length: ${cleaned.length} digits` };
  }
  return { valid: true, issue: null };
}

function validateURL(url) {
  if (!url) return { valid: true, issue: null };
  try {
    new URL(url);
    return { valid: true, issue: null };
  } catch {
    return { valid: false, issue: "Invalid URL format" };
  }
}

function validateAddress(addr) {
  const issues = [];
  
  if (!addr || typeof addr !== "object") {
    return { valid: false, issues: ["Address is missing or invalid format"] };
  }
  
  const city = (addr.city || "").toLowerCase().trim();
  const state = (addr.state || "").toUpperCase().trim();
  const zip = (addr.zip || "").trim();
  const street = (addr.street || "").trim();
  
  if (!street) issues.push("Missing street address");
  if (!city) issues.push("Missing city");
  if (!state) issues.push("Missing state");
  if (!zip) issues.push("Missing ZIP code");
  
  // Check ZIP-state mapping first (ZIP codes are more reliable)
  let zipStateMatch = null;
  if (zip && state && zip.length >= 3) {
    const zipPrefix = zip.substring(0, 3);
    const expectedState = ZIP_STATE_MAP[zipPrefix];
    if (expectedState) {
      zipStateMatch = expectedState === state;
      if (!zipStateMatch) {
        issues.push(`ZIP code ${zip} (prefix ${zipPrefix}) indicates ${expectedState}, but state is ${state}`);
      }
    }
  }
  
  // Check city-state mapping (only if ZIP doesn't provide clear answer or confirms issue)
  if (city && state) {
    const expectedState = CITY_STATE_MAP[city];
    if (expectedState && expectedState !== state) {
      // Special cases: cities that exist in multiple states
      // Only flag if ZIP code doesn't contradict or if both agree on mismatch
      if (city.includes("richmond")) {
        // Richmond exists in both TX and VA - trust ZIP code
        if (zip && zip.length >= 3) {
          const zipPrefix = zip.substring(0, 3);
          if (zipPrefix.startsWith("77")) {
            // Texas ZIP - don't flag as issue
          } else if (zipPrefix.startsWith("23")) {
            // Virginia ZIP - flag as issue
            issues.push(`City "${addr.city}" should be in ${expectedState}, but state is ${state}`);
          }
        }
      } else if (city.includes("arlington")) {
        // Arlington exists in both TX and VA - trust ZIP code
        if (zip && zip.length >= 3) {
          const zipPrefix = zip.substring(0, 3);
          if (zipPrefix.startsWith("22")) {
            // Virginia ZIP - flag as issue
            issues.push(`City "${addr.city}" should be in ${expectedState}, but state is ${state}`);
          } else if (zipPrefix.startsWith("76")) {
            // Texas ZIP - don't flag as issue
          }
        }
      } else {
        // For other cities, only flag if ZIP code doesn't contradict
        if (zipStateMatch === null || zipStateMatch === true) {
          // ZIP either doesn't provide answer or confirms state is correct
          // So city-state mismatch is a real issue
          issues.push(`City "${addr.city}" should be in ${expectedState}, but state is ${state}`);
        }
        // If ZIP contradicts city (zipStateMatch === false), trust ZIP over city
      }
    }
  }
  
  // Validate ZIP format
  if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
    issues.push(`Invalid ZIP code format: ${zip}`);
  }
  
  // Validate state format (should be 2 letters)
  if (state && !/^[A-Z]{2}$/.test(state)) {
    issues.push(`Invalid state format: ${state} (should be 2 letters)`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("🔍 Validating all restaurant data...\n");

  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, address, phone, website, instagram_handle, facebook_url, description, cuisine_types")
    .order("name");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  if (!restaurants || restaurants.length === 0) {
    console.log("❌ No restaurants found.");
    return;
  }

  console.log(`Found ${restaurants.length} restaurants to validate\n`);

  const issues = [];
  const fixes = [];

  for (const restaurant of restaurants) {
    const restaurantIssues = [];
    const restaurantFixes = {};

    // Validate address
    const addrValidation = validateAddress(restaurant.address);
    if (!addrValidation.valid) {
      restaurantIssues.push(...addrValidation.issues.map(i => `Address: ${i}`));
      
      // Suggest fixes
      const addr = restaurant.address || {};
      const city = (addr.city || "").toLowerCase().trim();
      const state = (addr.state || "").toUpperCase().trim();
      const zip = (addr.zip || "").trim();
      
      if (city && CITY_STATE_MAP[city] && CITY_STATE_MAP[city] !== state) {
        restaurantFixes.address = { ...addr, state: CITY_STATE_MAP[city] };
      } else if (zip && zip.length >= 3) {
        const zipPrefix = zip.substring(0, 3);
        if (ZIP_STATE_MAP[zipPrefix] && ZIP_STATE_MAP[zipPrefix] !== state) {
          restaurantFixes.address = { ...addr, state: ZIP_STATE_MAP[zipPrefix] };
        }
      }
    }

    // Validate phone
    const phoneValidation = validatePhone(restaurant.phone);
    if (!phoneValidation.valid) {
      restaurantIssues.push(`Phone: ${phoneValidation.issue}`);
    }

    // Validate website
    const websiteValidation = validateURL(restaurant.website);
    if (!websiteValidation.valid) {
      restaurantIssues.push(`Website: ${websiteValidation.issue}`);
    }

    // Validate Instagram
    if (restaurant.instagram_handle) {
      const instagramValidation = validateURL(restaurant.instagram_handle);
      if (!instagramValidation.valid && !restaurant.instagram_handle.startsWith("@")) {
        restaurantIssues.push(`Instagram: ${instagramValidation.issue}`);
      }
    }

    // Validate Facebook
    const facebookValidation = validateURL(restaurant.facebook_url);
    if (!facebookValidation.valid) {
      restaurantIssues.push(`Facebook: ${facebookValidation.issue}`);
    }

    // Check for missing description
    if (!restaurant.description || restaurant.description.trim().length < 10) {
      restaurantIssues.push("Description: Missing or too short");
    }

    // Check for missing cuisine types
    if (!restaurant.cuisine_types || restaurant.cuisine_types.length === 0) {
      restaurantIssues.push("Cuisine types: Missing");
    }

    if (restaurantIssues.length > 0) {
      issues.push({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        issues: restaurantIssues,
        fixes: restaurantFixes,
      });
    }
  }

  if (issues.length === 0) {
    console.log("✅ All restaurant data is valid!\n");
    return;
  }

  console.log(`⚠️  Found ${issues.length} restaurant(s) with issues:\n`);

  for (const issue of issues) {
    console.log(`📋 ${issue.name} (${issue.slug})`);
    issue.issues.forEach((i) => console.log(`   - ${i}`));
    if (Object.keys(issue.fixes).length > 0) {
      console.log(`   💡 Suggested fixes available`);
    }
    console.log();
  }

  // Show fixes that can be applied
  const autoFixable = issues.filter((i) => Object.keys(i.fixes).length > 0);
  if (autoFixable.length > 0) {
    console.log(`\n🔧 ${autoFixable.length} restaurant(s) can be auto-fixed:\n`);
    
    for (const fix of autoFixable) {
      console.log(`   ${fix.name}:`);
      if (fix.fixes.address) {
        const old = fix.fixes.address;
        const newState = fix.fixes.address.state;
        console.log(`     State: ${old.state || "missing"} → ${newState}`);
      }
      console.log();
    }

    console.log("💡 Run: npm run fix:address-state to apply address fixes");
  }

  // Generate summary
  console.log("\n📊 Summary:");
  console.log(`   Total restaurants: ${restaurants.length}`);
  console.log(`   Restaurants with issues: ${issues.length}`);
  console.log(`   Auto-fixable: ${autoFixable.length}`);
  console.log(`   Need manual review: ${issues.length - autoFixable.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
