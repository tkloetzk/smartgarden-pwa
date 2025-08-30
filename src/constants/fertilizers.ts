/**
 * Fertilizer Product Constants
 * 
 * This file contains standardized fertilizer product names to ensure consistency
 * across the application and prevent typos in seed variety data.
 */

export const FERTILIZER_PRODUCTS = {
  // Fish-based fertilizers
  FISH_EMULSION: "Fish Emulsion",
  NEPTUNES_HARVEST_FISH_SEAWEED: "Neptune's Harvest Fish + Seaweed",
  NEPTUNES_HARVEST: "Neptune's Harvest",
  FISH_SEAWEED_BLEND: "Fish + Seaweed blend",
  FISH_KELP_BLEND: "Fish emulsion/fish+kelp blend",
  FISH_KELP_TEA: "Fish/Kelp Tea",
  LOWER_N_FISH_EMULSION: "Lower-N Fish Emulsion",
  
  // Seaweed/Kelp fertilizers
  LIQUID_KELP: "Liquid Kelp",
  LIQUID_KELP_SEAWEED_EXTRACT: "Liquid Kelp/Seaweed Extract", 
  KELP_EXTRACT_K_RICH: "Kelp Extract + K-rich formula",
  KELP_MEAL: "Kelp Meal",
  LIQUID_KELP_FISH_SEAWEED: "Liquid kelp or fish + seaweed",
  
  // Balanced fertilizers
  BALANCED_LIQUID_FERTILIZER: "Balanced Liquid Fertilizer",
  BALANCED_LIQUID_FERTILIZER_LOWER: "Balanced liquid fertilizer",
  LIQUID_KELP_BALANCED_ORGANIC: "Liquid Kelp + balanced organic fertilizer",
  
  // Granular fertilizers
  GRANULAR_4_4_4: "4-4-4 granular fertilizer",
  FERTILIZER_5_10_10: "5-10-10 fertilizer (light dose)",
  FERTILIZER_9_15_30: "9-15-30 fertilizer",
  
  // Specialized fertilizers
  BLOOM_BOOSTER_HIGH_PK: "Higher P-K fertilizer (bloom booster)",
  BLOOM_BOOSTER_HIGH_PK_ALT: "Higher P-K fertilizer",
  ESPOMA_BERRY_TONE: "Espoma Berry-Tone",
  
  // Organic amendments
  BONE_MEAL: "Bone meal",
  WORM_CASTINGS: "Worm Casting",
  WORM_CASTINGS_TEA: "Worm Casting Tea", 
  WORM_CASTINGS_BONE_MEAL: "Worm Castings & Bone Meal",
  COMPOST: "Compost",
  BLOOD_MEAL: "Blood Meal",
  WOOD_ASH_POTASSIUM_SULFATE: "Wood ash or potassium sulfate",
  
  // Calcium supplements
  CALCIUM_CHLORIDE_SULFATE: "Calcium chloride or calcium sulfate",
  
  // Potassium supplements
  K2SO4: "K₂SO₄",
  K2SO4_KNO3: "K₂SO₄/KNO₃",
  
  // Inoculants
  RHIZOBIUM_LEGUMINOSARUM: "Rhizobium leguminosarum inoculant",
} as const;

// Type for fertilizer product names
export type FertilizerProduct = typeof FERTILIZER_PRODUCTS[keyof typeof FERTILIZER_PRODUCTS];

// Helper function to validate fertilizer product names
export function isValidFertilizerProduct(product: string): product is FertilizerProduct {
  return Object.values(FERTILIZER_PRODUCTS).includes(product as FertilizerProduct);
}

// Most commonly used products for easy access
export const COMMON_FERTILIZERS = {
  NEPTUNES_HARVEST_FISH_SEAWEED: FERTILIZER_PRODUCTS.NEPTUNES_HARVEST_FISH_SEAWEED,
  FISH_EMULSION: FERTILIZER_PRODUCTS.FISH_EMULSION,
  BONE_MEAL: FERTILIZER_PRODUCTS.BONE_MEAL,
  LIQUID_KELP: FERTILIZER_PRODUCTS.LIQUID_KELP,
  BALANCED_LIQUID: FERTILIZER_PRODUCTS.BALANCED_LIQUID_FERTILIZER,
} as const;