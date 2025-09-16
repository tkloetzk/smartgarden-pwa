/**
 * Consolidated Application Constants
 * 
 * This file contains all application-wide constants, configuration,
 * and static data used throughout the SmartGarden application.
 * Organized by feature domain for better maintainability.
 */

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  // Care scheduling defaults
  CARE_SCHEDULING: {
    DUE_SOON_THRESHOLD_DAYS: 2,
    OVERDUE_THRESHOLD_DAYS: 1,
    FALLBACK_INTERVAL_DAYS: 1,
    DEFAULT_WATERING_INTERVAL_DAYS: 3,
    DEFAULT_FERTILIZING_INTERVAL_DAYS: 14,
    MAX_TASK_LOOKBACK_DAYS: 30,
  },
  
  // Growth stage defaults
  GROWTH_STAGES: {
    DEFAULT_GERMINATION_DAYS: [7, 14],
    DEFAULT_MATURITY_DAYS: [60, 90],
    STAGE_TRANSITION_BUFFER_DAYS: 3,
  },
  
  // UI Configuration
  UI: {
    PAGINATION_SIZE: 10,
    CARD_GRID_BREAKPOINTS: {
      MOBILE: 1,
      TABLET: 2,
      DESKTOP: 3,
    },
    DEBOUNCE_MS: 300,
    TOAST_DURATION_MS: 3000,
  },
  
  // Data validation
  VALIDATION: {
    MIN_PLANT_NAME_LENGTH: 2,
    MAX_PLANT_NAME_LENGTH: 50,
    MAX_NOTES_LENGTH: 500,
    MIN_WATER_AMOUNT_ML: 1,
    MAX_WATER_AMOUNT_ML: 10000,
  },
  
  // Performance settings
  PERFORMANCE: {
    FIREBASE_CACHE_SIZE_MB: 40,
    IMAGE_MAX_SIZE_MB: 5,
    SYNC_RETRY_ATTEMPTS: 3,
    SYNC_RETRY_DELAY_MS: 1000,
  },
  
  // Development settings
  DEV: {
    ENABLE_REDUX_DEVTOOLS: process.env.NODE_ENV === 'development',
    MOCK_DELAYS_MS: 500,
    ENABLE_PERFORMANCE_LOGGING: process.env.NODE_ENV === 'development',
  },
} as const;

// ============================================================================
// FERTILIZER PRODUCTS
// ============================================================================

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

// Most commonly used products for easy access
export const COMMON_FERTILIZERS = {
  NEPTUNES_HARVEST_FISH_SEAWEED: FERTILIZER_PRODUCTS.NEPTUNES_HARVEST_FISH_SEAWEED,
  FISH_EMULSION: FERTILIZER_PRODUCTS.FISH_EMULSION,
  BONE_MEAL: FERTILIZER_PRODUCTS.BONE_MEAL,
  LIQUID_KELP: FERTILIZER_PRODUCTS.LIQUID_KELP,
  BALANCED_LIQUID: FERTILIZER_PRODUCTS.BALANCED_LIQUID_FERTILIZER,
} as const;

// ============================================================================
// TYPES
// ============================================================================

// Type for application configuration access
export type AppConfig = typeof APP_CONFIG;

// Type for fertilizer product names
export type FertilizerProduct = typeof FERTILIZER_PRODUCTS[keyof typeof FERTILIZER_PRODUCTS];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Configuration helper functions
export const CONFIG_HELPERS = {
  getDueSoonDate: (daysAhead = APP_CONFIG.CARE_SCHEDULING.DUE_SOON_THRESHOLD_DAYS) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date;
  },
  
  getOverdueDate: (daysBehind = APP_CONFIG.CARE_SCHEDULING.OVERDUE_THRESHOLD_DAYS) => {
    const date = new Date();
    date.setDate(date.getDate() - daysBehind);
    return date;
  },
  
  isValidWaterAmount: (amount: number) => {
    return amount >= APP_CONFIG.VALIDATION.MIN_WATER_AMOUNT_ML && 
           amount <= APP_CONFIG.VALIDATION.MAX_WATER_AMOUNT_ML;
  },
};

// Fertilizer helper functions
export const FERTILIZER_HELPERS = {
  isValidFertilizerProduct: (product: string): product is FertilizerProduct => {
    return Object.values(FERTILIZER_PRODUCTS).includes(product as FertilizerProduct);
  },
  
  getAllProducts: () => Object.values(FERTILIZER_PRODUCTS),
  
  getCommonProducts: () => Object.values(COMMON_FERTILIZERS),
  
  searchProducts: (searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return Object.values(FERTILIZER_PRODUCTS).filter(product => 
      product.toLowerCase().includes(term)
    );
  },
};

// ============================================================================
// CONSOLIDATED EXPORT
// ============================================================================

// Main constants object for convenient access
export const CONSTANTS = {
  APP: APP_CONFIG,
  FERTILIZERS: FERTILIZER_PRODUCTS,
  COMMON_FERTILIZERS,
  HELPERS: {
    ...CONFIG_HELPERS,
    ...FERTILIZER_HELPERS,
  },
} as const;

// Default export for single import access
export default CONSTANTS;

// ============================================================================
// BACKWARDS COMPATIBILITY
// ============================================================================
// Individual items are already exported above, no need to re-export
