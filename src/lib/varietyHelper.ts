import { SeedVariety } from "@/data/seedVarieties";
import { findVarietyByName as findVarietyByNameFromUtils, getAllVarieties as getAllVarietiesFromUtils } from "@/lib/seedVarietiesUtils";
import type { PlantCategory } from "@/types";

/**
 * Return all varieties (readonly to avoid accidental mutation).
 */
export const getAllVarieties = (): readonly SeedVariety[] => getAllVarietiesFromUtils();

/**
 * Find a variety by its name (case-insensitive).
 */
export const findVarietyByName = findVarietyByNameFromUtils;

/**
 * Filter varieties by category.
 */
export const filterVarietiesByCategory = (category: PlantCategory): SeedVariety[] =>
  getAllVarieties().filter((v) => v.category === category);

/**
 * Simple search over name and category.
 */
export const searchVarieties = (query: string): SeedVariety[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllVarieties().filter((v) => {
    return (
      v.name.toLowerCase().includes(q) ||
      String(v.category).toLowerCase().includes(q)
    );
  });
};