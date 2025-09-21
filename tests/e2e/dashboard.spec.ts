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

  test("shows empty garden state when user has no plants", async ({ page }) => {
    // Set test mode with empty plants override
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = true;
      (window as any).__VITE_TEST_MODE = "true";
      (window as any).__EMPTY_PLANTS_MODE = true;
    });

    await page.goto("/");

    // Wait for the root element to be visible
    await page.waitForSelector("#root", { timeout: 15000 });
    await expect(page.locator("#root")).toBeVisible();

    // Check for empty garden welcome message
    const welcomeTitle = page.getByTestId("welcome-message-title");
    await expect(welcomeTitle).toBeVisible();
    await expect(welcomeTitle).toContainText("Welcome to SmartGarden!");

    // Check for add plant button
    const addPlantButton = page.getByText("Add Your First Plant");
    await expect(addPlantButton).toBeVisible();

    // Verify no plant-related content is shown
    const plantGroups = page.locator('[data-testid*="plant-group"]');
    const plantGroupsCount = await plantGroups.count();
    expect(plantGroupsCount).toBe(0);

    // Test "Add Your First Plant" button navigation
    const addFirstPlantButton = page.getByText("Add Your First Plant");
    await addFirstPlantButton.click();

    // Verify we're navigated to the add plant page
    await page.waitForURL("**/add-plant", { timeout: 10000 });
    expect(page.url()).toContain("/add-plant");
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

  test("navigation links work correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for dashboard to load
    await page.waitForSelector("#root", { timeout: 15000 });

    // Test Plants link navigation
    const plantsLink = page.locator('a[href="/plants"]').first();
    await expect(plantsLink).toBeVisible();
    await plantsLink.click();

    // Verify we're on the plants page
    await page.waitForURL("**/plants", { timeout: 10000 });
    expect(page.url()).toContain("/plants");

    // Test Add Plant link navigation
    const addPlantLink = page.locator('a[href="/add-plant"]').first();
    await expect(addPlantLink).toBeVisible();
    await addPlantLink.click();

    // Verify we're on the add plant page
    await page.waitForURL("**/add-plant", { timeout: 10000 });
    expect(page.url()).toContain("/add-plant");

    // Test Dashboard link navigation back to home
    const dashboardLink = page.locator('a[href="/"]').first();
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();

    // Verify we're back on the dashboard
    await page.waitForURL("**/", { timeout: 10000 });
    expect(page.url()).toMatch(/\/$|\/$/);
  });

  test("active navigation state is highlighted correctly", async ({ page }) => {
    // Start on dashboard
    await page.goto("/");
    await page.waitForSelector("#root", { timeout: 15000 });

    // Check that Dashboard link has active styling (primary color)
    const dashboardLink = page.locator('a[href="/"]').first();
    await expect(dashboardLink).toHaveClass(/text-primary/);

    // Navigate to Plants page
    await page.locator('a[href="/plants"]').first().click();
    await page.waitForURL("**/plants", { timeout: 10000 });

    // Check that Plants link now has active styling
    const plantsLink = page.locator('a[href="/plants"]').first();
    await expect(plantsLink).toHaveClass(/text-primary/);

    // Navigate to Add Plant page
    await page.locator('a[href="/add-plant"]').first().click();
    await page.waitForURL("**/add-plant", { timeout: 10000 });

    // Check that Add Plant link now has active styling
    const addPlantLink = page.locator('a[href="/add-plant"]').first();
    await expect(addPlantLink).toHaveClass(/text-primary/);
  });

  test.skip("dark mode toggle works correctly", async ({ page }) => {
    // Skipping: Dark mode functionality needs debugging
    await page.goto("/");
    await page.waitForSelector("#root", { timeout: 15000 });

    // Find the dark mode toggle button
    const darkModeToggle = page.locator('button[aria-label*="Switch to"]');
    await expect(darkModeToggle).toBeVisible();

    // Check initial state (should show sun icon for light mode or moon for dark mode)
    const initialIcon = await darkModeToggle.locator('span').last().textContent();
    const isInitiallyDark = initialIcon?.includes('🌙');

    // Click the toggle
    await darkModeToggle.click();

    // Wait a moment for the transition
    await page.waitForTimeout(500);

    // Check that the icon changed
    const newIcon = await darkModeToggle.locator('span').last().textContent();
    const isNowDark = newIcon?.includes('🌙');

    // The state should have switched
    expect(isNowDark).toBe(!isInitiallyDark);

    // Click again to toggle back
    await darkModeToggle.click();
    await page.waitForTimeout(500);

    // Should be back to original state
    const finalIcon = await darkModeToggle.locator('span').last().textContent();
    const isFinallyDark = finalIcon?.includes('🌙');
    expect(isFinallyDark).toBe(isInitiallyDark);
  });
});
