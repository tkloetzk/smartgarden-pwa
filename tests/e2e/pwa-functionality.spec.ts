// tests/e2e/pwa-functionality.spec.ts
import { test, expect } from "@playwright/test";

test.describe("PWA Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("app loads and displays correctly", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("🌱 SmartGarden")).toBeVisible();
    await expect(page.getByText("Active Plants")).toBeVisible();
    await expect(page.getByText("Tasks Due")).toBeVisible();
  });

  test("offline functionality works", async ({ page, context }) => {
    // Load app first
    await page.goto("/");
    await expect(page.getByText("SmartGarden")).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();

    // Should still load from service worker cache
    await expect(page.getByText("SmartGarden")).toBeVisible();

    // Should show offline indicator
    await expect(page.getByText(/offline/i)).toBeVisible();
  });

  test("plant registration flow", async ({ page }) => {
    await page.goto("/");

    // Navigate to add plant
    await page.getByText("Add Your First Plant").click();

    // Fill form
    await page.selectOption('[name="varietyId"]', { index: 1 });
    await page.fill('[name="name"]', "My Test Plant");
    await page.fill('[name="location"]', "Test Location");
    await page.fill('[name="container"]', "Test Container");

    // Submit
    await page.getByText("Register Plant").click();

    // Should redirect and show plant
    await expect(page.getByText("My Test Plant")).toBeVisible();
  });

  test("data persists across page reloads", async ({ page }) => {
    await page.goto("/add-plant");

    // Add a plant
    await page.selectOption('[name="varietyId"]', { index: 1 });
    await page.fill('[name="name"]', "Persistent Plant");
    await page.fill('[name="location"]', "Kitchen");
    await page.fill('[name="container"]', "4 inch pot");
    await page.getByText("Register Plant").click();

    // Reload page
    await page.reload();

    // Plant should still be there
    await expect(page.getByText("Persistent Plant")).toBeVisible();
    await expect(page.getByText("1")).toBeVisible(); // Plant count
  });

  test("responsive design on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check navigation is visible and touch-friendly
    const navItems = page.locator("nav a");
    await expect(navItems.first()).toBeVisible();

    // Check minimum touch target size (44px)
    const buttonSize = await page.getByText("Add Plant").boundingBox();
    expect(buttonSize?.height).toBeGreaterThanOrEqual(44);
  });
});
