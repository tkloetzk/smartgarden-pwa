import { expect } from "@playwright/test";
import { test } from "./helpers/testModeSetup";
import { TIMEOUTS, SELECTORS, TEXT_CONTENT } from "./helpers/test-constants";
import { TestModes, applyTestMode } from "./helpers/test-modes";
import { getFormInput, getDropdownOption } from "./helpers/reliable-selectors";

/**
 * Add Plant Form Tests
 *
 * Tests for the plant registration form functionality
 */

test.describe("Add Plant Form", () => {
  test.beforeEach(async ({ page }) => {
    // Set test mode flags to ensure mock user is used
    await applyTestMode(page, TestModes.withDbInit());
  });

  test("form loads and displays all required fields", async ({ page }) => {
    // Navigate to add plant page
    await page.goto("/add-plant");

    // Wait for the form to load (varieties might be loading)
    await page.waitForSelector(SELECTORS.FORMS.PLANT_REGISTRATION, { timeout: TIMEOUTS.FORM_LOAD });

    // Verify main form is present
    const form = page.locator(SELECTORS.FORMS.PLANT_REGISTRATION);
    await expect(form).toBeVisible();

    // Check for form sections and headers
    await expect(page.getByText(TEXT_CONTENT.HEADERS.REGISTER_PLANT)).toBeVisible();
    await expect(page.getByText(TEXT_CONTENT.HEADERS.PLANT_INFORMATION)).toBeVisible();

    // Check core required fields are present
    // Plant Variety dropdown (use specific ID selector)
    const varietySelect = page.locator(SELECTORS.FORMS.VARIETY_SELECT);
    await expect(varietySelect).toBeVisible();
    await expect(page.getByText(TEXT_CONTENT.LABELS.PLANT_VARIETY)).toBeVisible();

    // Plant Name input (optional) - using reliable selector
    const nameInput = await getFormInput(page, 'plant-name');
    await expect(nameInput).toBeVisible();
    await expect(page.getByText(TEXT_CONTENT.LABELS.PLANT_NAME)).toBeVisible();

    // Planting Date input - using reliable selector
    const dateInput = await getFormInput(page, 'planting-date');
    await expect(dateInput).toBeVisible();
    await expect(page.getByText(TEXT_CONTENT.LABELS.PLANTING_DATE)).toBeVisible();

    // Quantity input with controls
    const quantityInput = page.locator(SELECTORS.FORMS.QUANTITY_INPUT);
    await expect(quantityInput).toBeVisible();
    await expect(page.getByText(TEXT_CONTENT.LABELS.QUANTITY)).toBeVisible();
  });

  test("plant variety dropdown loads and has expected state", async ({ page }) => {
    await page.goto("/add-plant");

    // Wait for form to load
    await page.waitForSelector(SELECTORS.FORMS.PLANT_REGISTRATION, { timeout: TIMEOUTS.FORM_LOAD });

    const varietySelect = page.locator(SELECTORS.FORMS.VARIETY_SELECT);
    await expect(varietySelect).toBeVisible();

    // Wait for varieties loading to complete (but don't require specific count)
    await page.waitForFunction(() => {
      const select = document.querySelector('select#varietyId');
      return select && !select.textContent?.includes('Loading varieties');
    }, { timeout: TIMEOUTS.DATA_LOAD });

    // Check that dropdown has at least the placeholder
    const optionCount = await varietySelect.locator('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(1); // At least placeholder

    // Verify placeholder text using reliable option selector
    const placeholderOption = await getDropdownOption(page, SELECTORS.FORMS.VARIETY_SELECT, 0);
    const placeholderText = await placeholderOption.textContent();
    expect(placeholderText).toContain('Select a variety');

    // If we have more than just placeholder, verify it's working
    if (optionCount > 1) {
      // Test that we can open the dropdown
      await varietySelect.click();
      await expect(varietySelect).toBeFocused();
    } else {
      // Verify the dropdown is still functional (not disabled)
      await expect(varietySelect).not.toBeDisabled();
    }
  });

  test("required fields are marked with asterisks", async ({ page }) => {
    await page.goto("/add-plant");
    await page.waitForSelector(SELECTORS.FORMS.PLANT_REGISTRATION, { timeout: TIMEOUTS.FORM_LOAD });

    // Check that required fields have asterisk indicators
    await expect(page.getByText(`${TEXT_CONTENT.LABELS.PLANT_VARIETY} *`)).toBeVisible();
    await expect(page.getByText(`${TEXT_CONTENT.LABELS.PLANTING_DATE} *`)).toBeVisible();
    await expect(page.getByText(`${TEXT_CONTENT.LABELS.QUANTITY} *`)).toBeVisible();

    // Optional field should not have asterisk
    const plantNameLabel = page.getByText(TEXT_CONTENT.LABELS.PLANT_NAME);
    await expect(plantNameLabel).toBeVisible();
    // Check that it doesn't have an asterisk
    const plantNameText = await plantNameLabel.textContent();
    expect(plantNameText).not.toContain('*');
  });

  test("quantity controls work correctly", async ({ page }) => {
    await page.goto("/add-plant");
    await page.waitForSelector(SELECTORS.FORMS.PLANT_REGISTRATION, { timeout: TIMEOUTS.FORM_LOAD });

    const quantityInput = page.locator(SELECTORS.FORMS.QUANTITY_INPUT);

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
    await page.waitForSelector(SELECTORS.FORMS.PLANT_REGISTRATION, { timeout: TIMEOUTS.FORM_LOAD });

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