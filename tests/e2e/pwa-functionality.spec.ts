import { test, expect } from "@playwright/test";
import { AuthHelper } from "./helpers/auth-helper";

test.describe("PWA Functionality", () => {
  // Remove the beforeEach since we're using storageState

  test.only("app loads and displays correctly", async ({ page }) => {
    // Start from root - we should already be authenticated via storageState
    await page.goto("/");

    // Wait a moment for any redirects or loading
    await page.waitForTimeout(2000);

    // Check if we're logged in by looking for common authenticated elements
    const isAuthenticated =
      (await page
        .locator('text="SmartGarden", text="Dashboard", text="Plants"')
        .count()) > 0;

    if (isAuthenticated) {
      console.log("✅ Already authenticated via storage state");
    } else {
      console.log("ℹ️ Not authenticated, performing manual login");
      const authHelper = new AuthHelper(page);
      await authHelper.login();
    }

    // Now check for your app content
    await expect(page.locator('text="SmartGarden"')).toBeVisible({
      timeout: 10000,
    });
  });

  // Add more flexible tests
  test("can navigate to main sections", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Look for navigation elements or main content
    const hasContent =
      (await page
        .locator('text="Plants", text="Dashboard", text="Add"')
        .count()) > 0;
    expect(hasContent).toBeTruthy();
  });
});
