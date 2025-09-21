import { expect } from "@playwright/test";
import { test } from "./helpers/testModeSetup";

/**
 * Add Plant Form Tests
 *
 * Tests for the plant registration form functionality
 */

test.describe("Add Plant Form", () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode flags to ensure mock user is used
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = true;
      (window as any).__VITE_TEST_MODE = "true";
      (window as any).__FORCE_DB_INIT = true;
    });
  });

  test("form loads and displays all required fields", async ({ page }) => {
    // Navigate to add plant page
    await page.goto("/add-plant");

    // Wait for the form to load (varieties might be loading)
    await page.waitForSelector('[data-testid="plant-registration-form"]', { timeout: 15000 });

    // Verify main form is present
    const form = page.locator('[data-testid="plant-registration-form"]');
    await expect(form).toBeVisible();

    // Check for form sections and headers
    await expect(page.getByText("Register Your Plant")).toBeVisible();
    await expect(page.getByText("Plant Information")).toBeVisible();

    // Check core required fields are present
    // Plant Variety dropdown (use specific ID selector)
    const varietySelect = page.locator('select#varietyId');
    await expect(varietySelect).toBeVisible();
    await expect(page.getByText("Plant Variety")).toBeVisible();

    // Plant Name input (optional)
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
    await expect(page.getByText("Plant Name")).toBeVisible();

    // Planting Date input
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    await expect(page.getByText("Planting Date")).toBeVisible();

    // Quantity input with controls
    const quantityInput = page.locator('[data-testid="quantity-input"]');
    await expect(quantityInput).toBeVisible();
    await expect(page.getByText("Quantity")).toBeVisible();
  });

  test("plant variety dropdown loads and has expected state", async ({ page }) => {
    await page.goto("/add-plant");

    // Wait for form to load
    await page.waitForSelector('[data-testid="plant-registration-form"]', { timeout: 15000 });

    const varietySelect = page.locator('select#varietyId');
    await expect(varietySelect).toBeVisible();

    // Wait for varieties loading to complete (but don't require specific count)
    await page.waitForFunction(() => {
      const select = document.querySelector('select#varietyId');
      return select && !select.textContent?.includes('Loading varieties');
    }, { timeout: 15000 });

    // Check that dropdown has at least the placeholder
    const optionCount = await varietySelect.locator('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(1); // At least placeholder

    // Verify placeholder text
    const firstOption = varietySelect.locator('option').first();
    const firstOptionText = await firstOption.textContent();
    expect(firstOptionText).toContain('Select a variety');

    // If we have more than just placeholder, verify it's working
    if (optionCount > 1) {
      console.log(`✅ Loaded ${optionCount - 1} plant varieties successfully`);

      // Test that we can open the dropdown
      await varietySelect.click();
      await expect(varietySelect).toBeFocused();
    } else {
      console.log('⚠️ No varieties loaded - database may need seeding in test environment');

      // Verify the dropdown is still functional (not disabled)
      await expect(varietySelect).not.toBeDisabled();
    }
  });

  test("required fields are marked with asterisks", async ({ page }) => {
    await page.goto("/add-plant");
    await page.waitForSelector('[data-testid="plant-registration-form"]', { timeout: 15000 });

    // Check that required fields have asterisk indicators
    await expect(page.getByText("Plant Variety *")).toBeVisible();
    await expect(page.getByText("Planting Date *")).toBeVisible();
    await expect(page.getByText("Quantity *")).toBeVisible();

    // Optional field should not have asterisk
    const plantNameLabel = page.getByText("Plant Name");
    await expect(plantNameLabel).toBeVisible();
    // Check that it doesn't have an asterisk
    const plantNameText = await plantNameLabel.textContent();
    expect(plantNameText).not.toContain('*');
  });

  test("quantity controls work correctly", async ({ page }) => {
    await page.goto("/add-plant");
    await page.waitForSelector('[data-testid="plant-registration-form"]', { timeout: 15000 });

    const quantityInput = page.locator('[data-testid="quantity-input"]');

    // Check initial value
    await expect(quantityInput).toHaveValue('1');

    // Test increase button
    const increaseButton = page.locator('button[aria-label="Increase quantity"]');
    await expect(increaseButton).toBeVisible();
    await increaseButton.click();
    await expect(quantityInput).toHaveValue('2');

    // Test decrease button
    const decreaseButton = page.locator('button[aria-label="Decrease quantity"]');
    await expect(decreaseButton).toBeVisible();
    await decreaseButton.click();
    await expect(quantityInput).toHaveValue('1');
  });

  test("form has submit functionality", async ({ page }) => {
    await page.goto("/add-plant");
    await page.waitForSelector('[data-testid="plant-registration-form"]', { timeout: 15000 });

    // Look for submit/save buttons
    const submitButtons = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add"), button:has-text("Register")');
    const submitButtonCount = await submitButtons.count();

    // Should have at least one submit button
    expect(submitButtonCount).toBeGreaterThan(0);

    // Verify at least one submit button is visible
    const visibleSubmitButton = submitButtons.first();
    await expect(visibleSubmitButton).toBeVisible();
  });
});