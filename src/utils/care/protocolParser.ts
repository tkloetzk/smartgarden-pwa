// src/utils/protocolParser.ts

export interface ParsedDilution {
  value?: number;
  unit: "tsp" | "tbsp" | "oz" | "ml" | "cups";
  perUnit: "gal" | "quart" | "liter" | "cup";
}

export interface ParsedAmount {
  amount?: number;
  unit: "oz" | "ml" | "cups" | "gal" | "quart" | "liter";
}

/**
 * Parses dilution strings from protocols into individual components
 * Examples: 
 * - "1 tbsp/gallon" → { value: 1, unit: "tbsp", perUnit: "gal" }
 * - "½ strength" → { unit: "tbsp", perUnit: "gal" } (default fallback)
 * - "1 Tbsp/gal" → { value: 1, unit: "tbsp", perUnit: "gal" }
 */
export function parseDilutionString(dilutionStr: string): ParsedDilution | null {
  if (!dilutionStr || dilutionStr.trim() === "") {
    return null;
  }

  const cleaned = dilutionStr.toLowerCase().trim();
  
  // Handle special cases
  if (cleaned.includes("½ strength") || cleaned.includes("half strength")) {
    return { value: 0.5, unit: "tbsp", perUnit: "gal" };
  }
  
  if (cleaned.includes("full strength")) {
    return { value: 1, unit: "tbsp", perUnit: "gal" };
  }
  
  if (cleaned.includes("as directed")) {
    return { unit: "tbsp", perUnit: "gal" }; // Default units without value
  }

  // Parse patterns like "1 tbsp/gallon", "2 tsp/quart", etc.
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ml|cups?)\s*\/\s*(gal|gallon|gallons|quart|quarts|liter|liters|cup|cups)/i,
    /(\d+(?:\.\d+)?)\s*(tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ml|cups?)\s*per\s*(gal|gallon|gallons|quart|quarts|liter|liters|cup|cups)/i
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const [, value, unit, perUnit] = match;
      return {
        value: parseFloat(value),
        unit: normalizeDilutionUnit(unit),
        perUnit: normalizeDilutionPerUnit(perUnit)
      };
    }
  }

  // Try to parse just the unit part without value (e.g., "tbsp/gal")
  const unitOnlyPattern = /(tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ml|cups?)\s*\/\s*(gal|gallon|gallons|quart|quarts|liter|liters|cup|cups)/i;
  const unitMatch = cleaned.match(unitOnlyPattern);
  if (unitMatch) {
    const [, unit, perUnit] = unitMatch;
    return {
      unit: normalizeDilutionUnit(unit),
      perUnit: normalizeDilutionPerUnit(perUnit)
    };
  }

  // Default fallback for any unrecognized format
  return { unit: "tbsp", perUnit: "gal" };
}

/**
 * Parses amount strings from protocols into components
 * Examples:
 * - "1-2 quarts per grow bag" → { amount: 1.5, unit: "quart" }
 * - "250 ml" → { amount: 250, unit: "ml" }
 * - "Apply to runoff" → { unit: "ml" } (default fallback)
 */
export function parseAmountString(amountStr: string): ParsedAmount | null {
  if (!amountStr || amountStr.trim() === "") {
    return null;
  }

  const cleaned = amountStr.toLowerCase().trim();
  
  // Handle special cases
  if (cleaned.includes("apply to runoff") || cleaned.includes("as needed")) {
    return { unit: "ml" }; // Default unit without amount
  }

  // Parse range patterns like "1-2 quarts", "16-24 oz", "1-2 quarts per grow bag"
  const rangePattern = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(oz|ml|cups?|quarts?|gallons?|liters?)(?:\s+per\s+.*)?/i;
  const rangeMatch = cleaned.match(rangePattern);
  if (rangeMatch) {
    const [, min, max, unit] = rangeMatch;
    const avgAmount = (parseFloat(min) + parseFloat(max)) / 2;
    return {
      amount: avgAmount,
      unit: normalizeAmountUnit(unit)
    };
  }

  // Parse single amount patterns like "250 ml", "2 cups", "1 quart", "2 cups per bag"
  const singlePattern = /(\d+(?:\.\d+)?)\s*(oz|ml|cups?|quarts?|gallons?|liters?)(?:\s+per\s+.*)?/i;
  const singleMatch = cleaned.match(singlePattern);
  if (singleMatch) {
    const [, amount, unit] = singleMatch;
    return {
      amount: parseFloat(amount),
      unit: normalizeAmountUnit(unit)
    };
  }

  // Default fallback
  return { unit: "ml" };
}

/**
 * Normalizes dilution unit names (tsp, tbsp, etc.)
 */
function normalizeDilutionUnit(unit: string): "tsp" | "tbsp" | "oz" | "ml" | "cups" {
  const normalized = unit.toLowerCase().trim();
  
  if (normalized.includes("tbsp") || normalized.includes("tablespoon")) {
    return "tbsp";
  }
  if (normalized.includes("tsp") || normalized.includes("teaspoon")) {
    return "tsp";
  }
  if (normalized === "oz") {
    return "oz";
  }
  if (normalized === "ml") {
    return "ml";
  }
  if (normalized.includes("cup")) {
    return "cups";
  }
  
  // Default fallback
  return "tbsp";
}

/**
 * Normalizes dilution per unit names (gal, quart, etc.)
 */
function normalizeDilutionPerUnit(unit: string): "gal" | "quart" | "liter" | "cup" {
  const normalized = unit.toLowerCase().trim();
  
  if (normalized.includes("gal")) {
    return "gal";
  }
  if (normalized.includes("quart")) {
    return "quart";
  }
  if (normalized.includes("liter")) {
    return "liter";
  }
  if (normalized.includes("cup")) {
    return "cup";
  }
  
  // Default fallback
  return "gal";
}

/**
 * Normalizes application amount unit names
 */
function normalizeAmountUnit(unit: string): "oz" | "ml" | "cups" | "gal" | "quart" | "liter" {
  const normalized = unit.toLowerCase().trim();
  
  if (normalized.includes("gal")) {
    return "gal";
  }
  if (normalized.includes("quart")) {
    return "quart";
  }
  if (normalized.includes("liter")) {
    return "liter";
  }
  if (normalized.includes("cup")) {
    return "cups";
  }
  if (normalized === "oz") {
    return "oz";
  }
  if (normalized === "ml") {
    return "ml";
  }
  
  // Default fallback
  return "ml";
}