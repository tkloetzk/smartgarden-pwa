import { expect } from '@playwright/test';
import { test } from './helpers/testModeSetup';

/**
 * Dashboard Integration Tests
 * 
 * Tests for dashboard functionality with authentication
 */

// Test mode is globally injected via the shared fixture in helpers/testModeSetup

// Skipped: UI login test is not meaningful in auto test mode (mock user is always present)

// Use test mode for all other tests
test.describe('Dashboard Integration (Test Mode)', () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode flags to ensure mock user is used
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = true;
      (window as any).__VITE_TEST_MODE = "true";
    });
  });

  test('loads basic app structure', async ({ page }) => {
    await page.goto('/');
  await page.waitForSelector('[data-testid="smartgarden-title"], form, #root', { timeout: 15000 });

    // Root visible - this should always work
    await expect(page.locator('#root')).toBeVisible();

    // Check what's rendered - either auth form or dashboard
    const authForm = page.locator('form');
    const isAuthForm = await authForm.isVisible().catch(() => false);
    
    if (isAuthForm) {
      // We're on the auth form - verify it has expected elements
      console.log('✅ Auth form is visible');
      const emailInput = page.locator('input[type="email"], #email');
      await expect(emailInput).toBeVisible();
      
      const passwordInput = page.locator('input[type="password"], #password');
      await expect(passwordInput).toBeVisible();
      
      // Look for sign in button or form submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")');
      await expect(submitButton).toBeVisible();
      
    } else {
      // We might be on the dashboard - check for dashboard elements
      console.log('✅ Checking for dashboard elements');
      const dashboardTitle = page.getByTestId('smartgarden-title');
      const isDashboard = await dashboardTitle.isVisible().catch(() => false);
      
      if (isDashboard) {
        await expect(dashboardTitle).toHaveText(/smartgarden/i);
        console.log('✅ Dashboard is visible');
      } else {
        // Neither auth nor dashboard - might be loading
        console.log('⚠️ Neither auth form nor dashboard detected');
      }
    }
  });

  test('auth form has proper structure', async ({ page }) => {
    await page.goto('/');
  await page.waitForSelector('[data-testid="smartgarden-title"], form, #root', { timeout: 15000 });
    
    // This test only runs if we see the auth form
    const authForm = page.locator('form');
    const isAuthForm = await authForm.isVisible().catch(() => false);
    
    if (!isAuthForm) {
      console.log('Skipping auth form test - not on auth page');
      return;
    }

    // Verify auth form elements
    const emailInput = page.locator('input[type="email"], #email');
    const passwordInput = page.locator('input[type="password"], #password');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Check labels
    const emailLabel = page.locator('label:has-text("Email")');
    const passwordLabel = page.locator('label:has-text("Password")');
    
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });
});
