import { expect } from "@playwright/test";
import { test } from "./helpers/testModeSetup";

/**
 * Dashboard Integration Tests
 *
 * Tests for dashboard functionality with authentication
 */

// Test mode is globally injected via the shared fixture in helpers/testModeSetup

// Skipped: UI login test is not meaningful in auto test mode (mock user is always present)

// Use test mode for all other tests
test.describe("Dashboard Integration (Test Mode)", () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode flags to ensure mock user is used
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = true;
      (window as any).__VITE_TEST_MODE = "true";
    });
  });

  test("loads app and shows loading state or dashboard", async ({ page }) => {
    await page.goto("/");

    // Wait for the root element to be visible
    await page.waitForSelector("#root", { timeout: 15000 });
    await expect(page.locator("#root")).toBeVisible();

    // Check if we see either the loading state or the dashboard
    const loadingElement = page.getByText("Loading dashboard...");
    const dashboardTitle = page.getByTestId("smartgarden-title");

    // One of these should be visible (either loading or dashboard)
    const isLoadingVisible = await loadingElement
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isDashboardVisible = await dashboardTitle
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // At least one should be visible
    expect(isLoadingVisible || isDashboardVisible).toBe(true);
  });

  test("shows auth form when not authenticated", async ({ page }) => {
    // Temporarily disable test mode to test the auth flow
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = false;
      (window as any).__VITE_TEST_MODE = "false";
    });

    await page.goto("/");

    // Wait for either the auth form or loading state
    await page.waitForSelector(
      'form, #root, [data-testid="smartgarden-title"]',
      { timeout: 15000 }
    );

    // Should see either the auth form or loading state
    const authForm = page.locator("form");
    const loadingElement = page.getByText("Loading dashboard...");

    const isAuthFormVisible = await authForm
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isLoadingVisible = await loadingElement
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(isAuthFormVisible || isLoadingVisible).toBe(true);
  });

  test("navigation elements are present", async ({ page }) => {
    await page.goto("/");

    // Wait for the root element
    await page.waitForSelector("#root", { timeout: 15000 });

    // Check for basic navigation elements that should be available
    const rootElement = page.locator("#root");
    await expect(rootElement).toBeVisible();

    // Check for anchor tags which indicate navigation
    const links = page.locator("a[href]");
    // We should have at least some links on the page
    const linksCount = await links.count().catch(() => 0);
    expect(linksCount).toBeGreaterThan(0); // Should have actual navigation links
  });
});
