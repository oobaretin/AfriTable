/** Build a google.com search URL to find a restaurant (not Google Maps). */

export function addressToSearchLine(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address.trim();
  if (typeof address === "object") {
    const a = address as Record<string, string | undefined>;
    return [a.street, a.city, a.state, a.zip].filter(Boolean).join(", ").trim();
  }
  return "";
}

export function googleSearchUrl(name: string, addressLine?: string): string {
  const query = [name, addressLine].filter(Boolean).join(", ").trim();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Resolve a google.com search link. Ignores legacy google.com/maps URLs so backfills can replace them.
 */
export function resolveGoogleSearchUrl(input: {
  name: string;
  address?: unknown;
  google_search_url?: string | null;
  /** @deprecated legacy catalog field — migrated to google_search_url */
  google_maps_url?: string | null;
}): string {
  const stored = input.google_search_url || input.google_maps_url;
  if (stored?.includes("google.com/search?")) {
    return stored;
  }
  return googleSearchUrl(input.name, addressToSearchLine(input.address));
}
