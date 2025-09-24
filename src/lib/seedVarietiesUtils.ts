import type { SeedVariety } from "@/data/seedVarieties";
import { seedVarieties } from "@/data/seedVarieties";

/**
 * Derived array of variety display names (read-only tuple).
 * This is generated at runtime from the single source of truth in `seedVarieties`.
 */
export const VARIETY_NAMES = seedVarieties.map((v) => v.name) as readonly string[];

/**
 * Slug helper: derive a stable slug from a variety name.
 */
export const varietySlug = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");

/**
 * Map for fast (case-insensitive) lookup by name.
 */
export const VARIETY_BY_NAME: ReadonlyMap<string, SeedVariety> = new Map(
  seedVarieties.map((v) => [v.name.toLowerCase(), v])
);

/**
 * Find a variety by display name (case-insensitive). Returns undefined if not found.
 */
export function findVarietyByName(name: string): SeedVariety | undefined {
  return VARIETY_BY_NAME.get(name.trim().toLowerCase());
}

/**
 * Find by slug (derived from name).
 */
export function findVarietyBySlug(slug: string): SeedVariety | undefined {
  const lower = slug.trim().toLowerCase();
  return seedVarieties.find((v) => varietySlug(v.name) === lower);
}

/**
 * Return the raw seed varieties array (read-only reference).
 * Prefer using the helpers above for common lookups; this is exported for
 * legacy code that needs the full data structure.
 */
export function getAllVarieties(): readonly SeedVariety[] {
  return seedVarieties as readonly SeedVariety[];
}

export default {
  VARIETY_NAMES,
  VARIETY_BY_NAME,
  findVarietyByName,
  findVarietyBySlug,
  getAllVarieties,
  varietySlug,
};
