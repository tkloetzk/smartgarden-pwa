// tests/e2e/plant-registration.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Plant Registration", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route("**/auth/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { uid: "test-user", email: "test@example.com" },
        }),
      });
    });

    // Mock varieties API
    await page.route("**/varieties", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "tomato-1",
            name: "Cherry Tomato",
            category: "fruiting-plants",
            growthTimeline: {
              germination: 7,
              seedling: 14,
              vegetative: 28,
              maturation: 60,
            },
          },
        ]),
      });
    });

    await page.goto("/plants/add");
  });

  test("successfully registers a new plant", async ({ page }) => {
    // Wait for form to load
    await expect(page.getByText("Register New Plant")).toBeVisible();

    // Fill variety
    await page.selectOption('[data-testid="variety-select"]', "tomato-1");

    // Fill planting date
    const today = new Date().toISOString().split("T")[0];
    await page.fill('[data-testid="planting-date"]', today);

    // Select container type
    await page.click("text=Grow Bag");

    // Container size should be auto-selected
    await expect(
      page.locator('[data-testid="container-size-select"]')
    ).toHaveValue("1-gallon");

    // Select soil mixture
    await page.click('[data-testid="select-soil-mixture"]');

    // Submit form
    await page.click('button:has-text("Register Plant")');

    // Verify success
    await expect(
      page.getByText("Successfully registered 1 plant(s)! 🌱")
    ).toBeVisible();
  });

  test("handles validation errors properly", async ({ page }) => {
    // Try to submit empty form
    await page.click('button:has-text("Register Plant")');

    // Check for validation errors
    await expect(page.getByText("Please select a variety")).toBeVisible();
    await expect(
      page.getByText("Please select a container type")
    ).toBeVisible();
    await expect(page.getByText("Please select a soil mixture")).toBeVisible();
  });

  test("works with custom container dimensions", async ({ page }) => {
    await page.selectOption('[data-testid="variety-select"]', "tomato-1");

    await page.click("text=Grow Bag");
    await page.selectOption('[data-testid="container-size-select"]', "custom");

    // Fill custom dimensions
    await page.selectOption('[data-testid="bag-shape-select"]', "round");
    await page.fill('[data-testid="diameter-input"]', "12");
    await page.fill('[data-testid="height-input"]', "8");

    await page.click('[data-testid="select-soil-mixture"]');

    await page.click('button:has-text("Register Plant")');

    await expect(
      page.getByText("Successfully registered 1 plant(s)! 🌱")
    ).toBeVisible();
  });

  test("supports multiple plants registration", async ({ page }) => {
    await page.selectOption('[data-testid="variety-select"]', "tomato-1");
    await page.click("text=Grow Bag");

    // Set quantity to 3
    await page.fill('[data-testid="quantity-input"]', "3");

    await page.click('[data-testid="select-soil-mixture"]');
    await page.click('button:has-text("Register Plants")');

    await expect(
      page.getByText("Successfully registered 3 plant(s)! 🌱")
    ).toBeVisible();
  });
});
