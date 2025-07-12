// Application-wide configuration constants
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

// Type for configuration access
export type AppConfig = typeof APP_CONFIG;

// Helper functions for common calculations
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