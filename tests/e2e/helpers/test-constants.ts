/**
 * Test Constants
 *
 * Centralized constants for E2E tests to ensure consistency
 * and easy maintenance across test files.
 */

export const TIMEOUTS = {
  /** Default timeout for page navigation and major UI changes */
  NAVIGATION: 10000,

  /** Timeout for forms and complex components to load */
  FORM_LOAD: 15000,

  /** Timeout for individual elements to become visible */
  ELEMENT_VISIBLE: 5000,

  /** Timeout for database operations and async data loading */
  DATA_LOAD: 15000,

  /** Short timeout for quick interactions and state changes */
  QUICK_ACTION: 2000,
} as const;

export const SELECTORS = {
  /** Common application selectors */
  APP: {
    ROOT: '#root',
    NAVIGATION: 'nav',
    LOADING: '[data-testid="loading"]',
  },

  /** Dashboard specific selectors */
  DASHBOARD: {
    TITLE: '[data-testid="smartgarden-title"]',
    WELCOME_MESSAGE: '[data-testid="welcome-message-title"]',
    ADD_FIRST_PLANT_BUTTON: 'button:has-text("Add Your First Plant")',
  },

  /** Form specific selectors - more specific to avoid ambiguity */
  FORMS: {
    PLANT_REGISTRATION: '[data-testid="plant-registration-form"]',
    VARIETY_SELECT: 'select#varietyId',
    PLANT_NAME_INPUT: 'input[name="name"]', // More specific than input[type="text"]
    PLANTING_DATE_INPUT: 'input[name="plantedDate"]',
    QUANTITY_INPUT: '[data-testid="quantity-input"]',
    QUANTITY_INCREASE_BTN: 'button[aria-label="Increase quantity"]',
    QUANTITY_DECREASE_BTN: 'button[aria-label="Decrease quantity"]',
    // Dropdown option selectors
    VARIETY_PLACEHOLDER: 'select#varietyId option:first-child',
    VARIETY_FIRST_OPTION: 'select#varietyId option:nth-child(2)', // Skip placeholder
    // Submit button patterns
    SUBMIT_BUTTONS: 'button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Register")',
  },

  /** Navigation selectors - context-specific to avoid .first() usage */
  NAV: {
    /** Mobile bottom navigation */
    MOBILE: {
      CONTAINER: 'nav.fixed.bottom-0',
      DASHBOARD_LINK: 'nav.fixed.bottom-0 a[href="/"]',
      PLANTS_LINK: 'nav.fixed.bottom-0 a[href="/plants"]',
      ADD_PLANT_LINK: 'nav.fixed.bottom-0 a[href="/add-plant"]',
    },
    /** Desktop header navigation */
    DESKTOP: {
      CONTAINER: 'header nav',
      DASHBOARD_LINK: 'header nav a[href="/"]',
      PLANTS_LINK: 'header nav a[href="/plants"]',
      ADD_PLANT_LINK: 'header nav a[href="/add-plant"]',
    },
    /** Generic selectors (fallback) */
    ANY: {
      DASHBOARD_LINK: 'a[href="/"]',
      PLANTS_LINK: 'a[href="/plants"]',
      ADD_PLANT_LINK: 'a[href="/add-plant"]',
    },
  },
} as const;

export const TEXT_CONTENT = {
  /** Common text content to look for in tests */
  LOADING: {
    DASHBOARD: 'Loading dashboard...',
    VARIETIES: 'Loading varieties...',
  },

  LABELS: {
    PLANT_VARIETY: 'Plant Variety',
    PLANT_NAME: 'Plant Name',
    PLANTING_DATE: 'Planting Date',
    QUANTITY: 'Quantity',
  },

  BUTTONS: {
    ADD_FIRST_PLANT: 'Add Your First Plant',
    SIGN_OUT: 'Sign Out',
  },

  HEADERS: {
    REGISTER_PLANT: 'Register Your Plant',
    PLANT_INFORMATION: 'Plant Information',
    WELCOME_SMARTGARDEN: 'Welcome to SmartGarden!',
  },
} as const;