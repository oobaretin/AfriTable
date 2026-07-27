/**
 * Diaspora cuisines shown in the homepage hero typewriter and browse filters.
 * Hero uses uppercase labels; filters use title-case ids for catalog matching.
 */
export const HERO_CUISINE_LABELS = [
  "NIGERIAN",
  "ETHIOPIAN",
  "JAMAICAN",
  "HAITIAN",
  "SENEGALESE",
  "GHANAIAN",
  "CARIBBEAN",
  "GULLAH",
] as const;

export type HeroCuisineLabel = (typeof HERO_CUISINE_LABELS)[number];

/** Title-case ids for directory / homepage cuisine filter chips. */
export const BROWSE_CUISINE_FILTERS: { id: string; label: string }[] = [
  { id: "Nigerian", label: "Nigerian" },
  { id: "Ethiopian", label: "Ethiopian" },
  { id: "Jamaican", label: "Jamaican" },
  { id: "Haitian", label: "Haitian" },
  { id: "Senegalese", label: "Senegalese" },
  { id: "Ghanaian", label: "Ghanaian" },
  { id: "Caribbean", label: "Caribbean" },
  { id: "Gullah", label: "Gullah" },
];
