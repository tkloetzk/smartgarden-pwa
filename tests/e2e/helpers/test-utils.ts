import { test as base, expect } from '@playwright/test';

/**
 * E2E Test Fixtures and Utilities
 * 
 * Extended Playwright test with custom fixtures for SmartGarden PWA testing.
 */

// Extend basic test with custom fixtures
export const test = base.extend<{
  /**
   * Mock authentication state for testing authenticated flows
   */
  authenticatedPage: any;
}>({
  authenticatedPage: async ({ page }, use) => {
    // For future: Add authentication setup here
    // For now, just use the regular page
    await use(page);
  },
});

export { expect };

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Wait for the application to be fully loaded
   */
  waitForAppLoad: async (page: any) => {
    // Wait for React to load
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Wait for loading states to finish
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="loading"], .loading, .spinner'),
      { timeout: 15000 }
    );
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
  },

  /**
   * Check if user is on the authentication page
   */
  isOnAuthPage: async (page: any) => {
    const authForm = page.locator('form');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    
    try {
      await expect(authForm).toBeVisible({ timeout: 5000 });
      await expect(emailInput).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if user is on the dashboard page
   */
  isOnDashboard: async (page: any) => {
    // Look for dashboard-specific elements
    const summaryCards = page.locator('[data-testid="summary-cards"], .summary-cards');
    const plantGarden = page.locator('[data-testid="plant-garden"], .plant-garden');
    const dashboardContent = page.locator('main, [role="main"]');
    
    try {
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get page title and verify it's appropriate
   */
  verifyPageTitle: async (page: any, expectedPattern?: RegExp) => {
    const title = await page.title();
    
    if (expectedPattern) {
      expect(title).toMatch(expectedPattern);
    } else {
      // Default: should have some title, not be empty
      expect(title.length).toBeGreaterThan(0);
    }
    
    return title;
  },

  /**
   * Check for accessibility violations (basic checks)
   */
  checkBasicAccessibility: async (page: any) => {
    // Check for proper heading structure
    const h1 = page.locator('h1');
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    
    // Should have at least one main heading
    await expect(headings.first()).toBeVisible({ timeout: 5000 });
    
    // Check for form labels if forms are present
    const forms = page.locator('form');
    const formsCount = await forms.count();
    
    if (formsCount > 0) {
      const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
      const inputsCount = await inputs.count();
      
      if (inputsCount > 0) {
        // At least some inputs should have labels or aria-labels
        const labeledInputs = page.locator('input[aria-label], input[aria-labelledby], label input');
        const labeledCount = await labeledInputs.count();
        
        // Not perfect check, but better than nothing
        expect(labeledCount).toBeGreaterThan(0);
      }
    }
  }
};

/**
 * Test data constants
 */
export const testData = {
  // Mock user credentials (for future auth testing)
  mockUser: {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  },
  
  // Expected page titles
  pageTitles: {
    dashboard: /smart.*garden|garden|dashboard/i,
    auth: /sign.*in|login|auth/i
  },
  
  // Common timeouts
  timeouts: {
    pageLoad: 15000,
    elementVisible: 10000,
    networkIdle: 5000,
    animation: 1000
  }
};
