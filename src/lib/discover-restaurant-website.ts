/**
 * Discover a restaurant's official website via web search (Google-style queries).
 * Uses SerpAPI Google when available; falls back to DuckDuckGo HTML (no API quota).
 */

const BLOCKED_HOST_PATTERNS = [
  "google.",
  "goo.gl",
  "googleusercontent",
  "maps.",
  "yelp.",
  "tripadvisor.",
  "facebook.",
  "instagram.",
  "doordash.",
  "ubereats.",
  "grubhub.",
  "opentable.",
  "resy.com",
  "res-menu.net",
  "allmenus.",
  "menupix.",
  "zmenu.",
  "menuworld.",
  "yellowpages.",
  "bbb.org",
  "wikipedia.",
  "linkedin.",
  "youtube.",
  "tiktok.",
  "twitter.",
  "x.com",
  "duckduckgo.",
  "bing.",
  "postmates.",
  "seamless.",
  "foursquare.",
  "mapquest.",
  "wheree.",
  "restaurantguru.",
  "restaurantji.",
  "zomato.",
  "singleplatform.",
  "loc8nearme.",
  "niche.com",
  "andbeaches.com",
  "visit",
  "destinations.",
  "explore",
  "dynamicafrican.",
  "alltrails.",
  "eventbrite.",
  "wherevi.com",
  "wheree.com",
  "agncy.dev",
  "ubuntu.com",
  "communityliving.",
];

const AGGREGATOR_PATH = /\/(menu|order|delivery|reviews?|listing)/i;

/** Queries a person would try on google.com (tried in order until a match is found). */
export function buildWebsiteSearchQueries(name: string, addressLine?: string): string[] {
  const parts = (addressLine || "").split(",").map((s) => s.trim()).filter(Boolean);
  const cityState = parts.length >= 2 ? parts.slice(-2).join(" ") : addressLine || "";
  const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || "";

  const queries = [
    `${name} restaurant ${cityState}`,
    `${name} ${city} restaurant website`,
    `${name} restaurant ${cityState} official website`,
    `${name} ${cityState}`,
  ];
  return [...new Set(queries.map((q) => q.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

export function buildWebsiteSearchQuery(name: string, addressLine?: string): string {
  return buildWebsiteSearchQueries(name, addressLine)[0];
}

function hostMatchesBlockPattern(host: string, pattern: string): boolean {
  const key = pattern.replace(/\.$/, "");
  // Avoid false positives (e.g. restauranttx.com matching "x.com")
  if (key === "x.com") return host === "x.com" || host === "www.x.com";
  if (key === "visit") return /(^|\.)visit\./.test(host) || host.startsWith("visit.");
  return host.includes(key);
}

export function isBlockedWebsiteUrl(url: string): boolean {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();
    if (BLOCKED_HOST_PATTERNS.some((p) => hostMatchesBlockPattern(host, p))) return true;
    if (AGGREGATOR_PATH.test(u.pathname) && /menu|order/i.test(u.pathname)) return true;
    return false;
  } catch {
    return true;
  }
}

const GENERIC_WORDS = new Set([
  "the", "and", "bar", "grill", "cafe", "kitchen", "restaurant", "house", "place", "food",
  "african", "caribbean", "ethiopian", "nigerian", "jamaican", "international", "cuisine",
]);

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !GENERIC_WORDS.has(t));
}

/** Common spelling drift between brand name and domain (e.g. Abeba vs Ababa). */
function tokenMatchesHost(token: string, hostCompact: string): boolean {
  if (token.length >= 4 && hostCompact.includes(token)) return true;
  if (/^ababa$/i.test(token) && /abeba|ababa/.test(hostCompact)) return true;
  if (/^abeba$/i.test(token) && /abeba|ababa/.test(hostCompact)) return true;
  return false;
}

/** Host must contain a distinctive token from the restaurant name. */
export function hostMatchesRestaurantName(host: string, restaurantName: string): boolean {
  const hostCompact = host.toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9]/g, "");
  const tokens = nameTokens(restaurantName);
  if (tokens.length) {
    if (tokens.some((t) => tokenMatchesHost(t, hostCompact))) return true;
    const matched = tokens.filter((t) => t.length >= 4 && tokenMatchesHost(t, hostCompact)).length;
    if (matched >= 2) return true;
  }
  const compact = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return compact.length >= 6 && hostCompact.includes(compact.slice(0, 8));
}

export function scoreWebsiteCandidate(url: string, restaurantName: string): number {
  if (isBlockedWebsiteUrl(url)) return -1000;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!hostMatchesRestaurantName(host, restaurantName)) return -500;

    let score = 10;
    const tokens = nameTokens(restaurantName);
    for (const t of tokens) {
      if (host.includes(t)) score += 30;
      else if (t.length >= 5 && host.includes(t.slice(0, 5))) score += 15;
    }
    if (/\.(com|net|org|co|us|shop)$/i.test(host)) score += 8;
    if (/menu|res-menu|allmenus|order-online/i.test(url)) score -= 35;
    if (u.pathname === "/" || u.pathname.length < 20) score += 5;
    return score;
  } catch {
    return -1000;
  }
}

export function pickBestWebsite(candidates: string[], restaurantName: string): string | null {
  const unique = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
  let best: { url: string; score: number } | null = null;
  for (const url of unique) {
    const score = scoreWebsiteCandidate(url, restaurantName);
    if (score < 5) continue;
    if (!best || score > best.score) best = { url, score };
  }
  if (!best) return null;
  try {
    const u = new URL(best.url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return best.url;
  }
}

export async function discoverViaDuckDuckGo(query: string): Promise<string[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AfriTable/1.0; +https://afri-table.com)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) return [];

  const html = await response.text();
  const urls: string[] = [];
  const re = /uddg=([^&"'<>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      urls.push(decodeURIComponent(m[1]));
    } catch {
      /* skip */
    }
  }
  return urls;
}

export async function discoverViaSerpApi(
  query: string,
  apiKey: string,
): Promise<{ urls: string[]; error?: string }> {
  try {
    const { getJson } = await import("serpapi");
    const response = (await getJson({
      engine: "google",
      q: query,
      api_key: apiKey,
      num: 8,
    })) as {
      knowledge_graph?: { website?: string };
      organic_results?: Array<{ link?: string }>;
      error?: string;
    };

    if (response?.error) return { urls: [], error: response.error };

    const urls: string[] = [];
    if (response.knowledge_graph?.website) urls.push(response.knowledge_graph.website);
    for (const row of response.organic_results ?? []) {
      if (row.link) urls.push(row.link);
    }
    return { urls };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("run out of searches")) return { urls: [], error: "serpapi_quota" };
    return { urls: [], error: msg };
  }
}

export async function discoverRestaurantWebsite(
  name: string,
  addressLine?: string,
  options?: { serpApiKey?: string; preferSerpApi?: boolean },
): Promise<{ website: string | null; source: string; candidates: number; query?: string }> {
  const queries = buildWebsiteSearchQueries(name, addressLine);
  let candidates: string[] = [];
  let source = "none";
  let usedQuery = queries[0];

  const key = options?.serpApiKey?.trim();

  for (const query of queries) {
    let batch: string[] = [];

    if (key && options?.preferSerpApi !== false) {
      const serp = await discoverViaSerpApi(query, key);
      if (serp.urls.length) {
        batch = serp.urls;
        source = "serpapi_google";
      }
    }

    if (!batch.length) {
      batch = await discoverViaDuckDuckGo(query);
      if (batch.length) source = "duckduckgo";
    }

    if (batch.length) {
      candidates = [...candidates, ...batch];
      usedQuery = query;
      const website = pickBestWebsite(candidates, name);
      if (website) {
        return { website, source, candidates: candidates.length, query: usedQuery };
      }
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  const website = pickBestWebsite(candidates, name);
  return { website, source, candidates: candidates.length, query: usedQuery };
}
