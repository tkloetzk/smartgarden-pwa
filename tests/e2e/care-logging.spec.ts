/**
 * E2E Test: Complete Care Logging Workflows
 * 
 * Tests end-to-end user journeys for logging plant care activities
 * with smart defaults, form validation, and success flows.
 * 
 * Replaces complex integration test: smartDefaultsIntegration.test.tsx
 */

import { test, expect } from '@playwright/test';
import { 
  PlantCarePageObjects, 
  E2EPlantFactory, 
  E2EActivityFactory,
  E2EMockSetup 
} from './fixtures/plantCareFixtures';

test.describe('Care Logging Workflows', () => {
  let pageObjects: PlantCarePageObjects;
  let mockSetup: E2EMockSetup;

  test.beforeEach(async ({ page }) => {
    pageObjects = new PlantCarePageObjects(page);
    mockSetup = new E2EMockSetup(page);

    // Setup authenticated user
    await mockSetup.setupAuthenticatedUser();
    
    // Setup test data
    await mockSetup.mockVarieties();
    await mockSetup.mockSmartDefaults();
  });

  test.describe('Fertilization with Smart Defaults', () => {
    test('User logs fertilization using smart suggestions for strawberry plant', async ({ page }) => {
      // Given: User has a mature strawberry plant
      const strawberryPlant = E2EPlantFactory.strawberryPlant();
      await mockSetup.mockPlants([strawberryPlant]);

      // When: User navigates to care logging for the plant
      await pageObjects.goToCareLogging(strawberryPlant.id);

      // Then: Page loads with plant pre-selected
      await expect(page.locator('[data-testid="selected-plant"]')).toHaveText(strawberryPlant.name);

      // When: User selects fertilization activity
      await pageObjects.selectActivityType('fertilize');

      // Then: Smart suggestion appears for strawberry fertilization
      await expect(page.locator('[data-testid="smart-suggestion"]')).toBeVisible();
      await expect(page.locator('text=Neptune\'s Harvest')).toBeVisible();
      await expect(page.locator('text=1 tbsp/gallon')).toBeVisible();

      // When: User accepts the smart suggestion
      await pageObjects.useSmartSuggestion('neptunes-harvest');

      // Then: Form is auto-populated with suggestion data
      await expect(page.locator('[data-testid="fertilizer-product"]')).toHaveValue('Neptune\'s Harvest');
      await expect(page.locator('[data-testid="fertilizer-dilution"]')).toHaveValue('1 tbsp/gallon');
      await expect(page.locator('[data-testid="fertilizer-amount"]')).toHaveValue('1-2 quarts');

      // When: User adds notes and submits
      await pageObjects.fillFertilizationForm({
        notes: 'Weekly fertilization as scheduled'
      });

      // Mock successful activity creation
      await page.route('**/activities', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ 
              id: 'new-activity-123',
              ...E2EActivityFactory.fertilizationActivity(strawberryPlant.id)
            }),
          });
        }
      });

      await pageObjects.submitActivity();

      // Then: Success message appears and user is redirected
      await pageObjects.expectSuccessMessage('Fertilization logged successfully');
      await expect(page).toHaveURL(`/plants/${strawberryPlant.id}`);
    });

    test('User logs fertilization with custom values (not using smart defaults)', async ({ page }) => {
      const strawberryPlant = E2EPlantFactory.strawberryPlant();
      await mockSetup.mockPlants([strawberryPlant]);

      await pageObjects.goToCareLogging(strawberryPlant.id);
      await pageObjects.selectActivityType('fertilize');

      // User ignores smart suggestions and enters custom values
      await pageObjects.fillFertilizationForm({
        product: '9-15-30 fertilizer',
        dilution: 'As directed',
        amount: '2 quarts',
        notes: 'Using different fertilizer this week'
      });

      // Mock successful activity creation
      await page.route('**/activities', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ 
              id: 'custom-activity-123',
              plantId: strawberryPlant.id,
              activityType: 'fertilize',
              details: {
                product: '9-15-30 fertilizer',
                dilution: 'As directed',
                amount: '2 quarts'
              },
              notes: 'Using different fertilizer this week'
            }),
          });
        }
      });

      await pageObjects.submitActivity();

      await pageObjects.expectSuccessMessage();
      await expect(page).toHaveURL(`/plants/${strawberryPlant.id}`);
    });

    test('User receives different smart suggestions for different plant varieties', async ({ page }) => {
      const tomatoPlant = E2EPlantFactory.tomatoPlant();
      await mockSetup.mockPlants([tomatoPlant]);

      // Mock variety-specific smart defaults
      await page.route('**/smart-defaults**', (route) => {
        const url = new URL(route.request().url());
        const plantId = url.searchParams.get('plantId');
        
        if (plantId === tomatoPlant.id) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
              type: 'fertilize',
              product: 'Tomato Fertilizer',
              dilution: '2 tbsp/gallon',
              amount: '1 quart',
              confidence: 'high',
              reasoning: 'Recommended for tomatoes in vegetative stage'
            }]),
          });
        }
      });

      await pageObjects.goToCareLogging(tomatoPlant.id);
      await pageObjects.selectActivityType('fertilize');

      // Different plant should get different suggestion
      await expect(page.locator('text=Tomato Fertilizer')).toBeVisible();
      await expect(page.locator('text=2 tbsp/gallon')).toBeVisible();
    });
  });

  test.describe('Watering with Smart Defaults', () => {
    test('User logs watering with smart amount suggestions', async ({ page }) => {
      const lettucePlant = E2EPlantFactory.lettucePlant();
      await mockSetup.mockPlants([lettucePlant]);

      await pageObjects.goToCareLogging(lettucePlant.id);
      await pageObjects.selectActivityType('water');

      // Smart watering suggestion should appear
      await expect(page.locator('[data-testid="smart-suggestion"]')).toBeVisible();
      await expect(page.locator('text=1-2 cups')).toBeVisible();

      await pageObjects.useSmartSuggestion('water-amount');

      // Form should be populated
      await expect(page.locator('[data-testid="watering-amount"]')).toHaveValue('1-2 cups');

      // User completes the form
      await pageObjects.fillWateringForm({
        method: 'deep-watering',
        notes: 'Morning watering session'
      });

      // Mock successful activity creation
      await page.route('**/activities', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ 
              id: 'watering-activity-123',
              ...E2EActivityFactory.wateringActivity(lettucePlant.id)
            }),
          });
        }
      });

      await pageObjects.submitActivity();

      await pageObjects.expectSuccessMessage('Watering logged successfully');
      await expect(page).toHaveURL(`/plants/${lettucePlant.id}`);
    });
  });

  test.describe('Observation Activities', () => {
    test('User logs observation without requiring amounts or products', async ({ page }) => {
      const strawberryPlant = E2EPlantFactory.strawberryPlant();
      await mockSetup.mockPlants([strawberryPlant]);

      await pageObjects.goToCareLogging(strawberryPlant.id);
      await pageObjects.selectActivityType('observe');

      // Observation should not show product/amount fields
      await expect(page.locator('[data-testid="fertilizer-product"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="watering-amount"]')).not.toBeVisible();

      // But should have notes field
      await expect(page.locator('[data-testid="activity-notes"]')).toBeVisible();

      // User fills observation notes
      await page.fill('[data-testid="activity-notes"]', 'Plant looks healthy, new growth on runners');

      // Mock successful activity creation
      await page.route('**/activities', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ 
              id: 'observation-activity-123',
              ...E2EActivityFactory.observationActivity(strawberryPlant.id)
            }),
          });
        }
      });

      await pageObjects.submitActivity();

      await pageObjects.expectSuccessMessage('Observation logged successfully');
    });
  });

  test.describe('Multiple Plant Selection', () => {
    test('User can select different plants and get appropriate suggestions', async ({ page }) => {
      const plants = E2EPlantFactory.multiplePlants();
      await mockSetup.mockPlants(plants);

      // Start without pre-selected plant
      await pageObjects.goToCareLogging();

      // Select strawberry plant
      await pageObjects.selectPlant(plants[0].name);
      await pageObjects.selectActivityType('fertilize');

      // Should see strawberry-specific suggestion
      await expect(page.locator('text=Neptune\'s Harvest')).toBeVisible();

      // Switch to tomato plant
      await pageObjects.selectPlant(plants[1].name);

      // Mock tomato-specific suggestions
      await page.route('**/smart-defaults**', (route) => {
        const url = new URL(route.request().url());
        const plantId = url.searchParams.get('plantId');
        
        if (plantId === plants[1].id) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
              type: 'fertilize',
              product: 'Balanced Fertilizer',
              dilution: '1 tsp/gallon',
              amount: '1 cup',
              confidence: 'medium'
            }]),
          });
        }
      });

      // Trigger suggestion refresh
      await pageObjects.selectActivityType('water');
      await pageObjects.selectActivityType('fertilize');

      // Should now see tomato-specific suggestion
      await expect(page.locator('text=Balanced Fertilizer')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('User sees validation errors for incomplete fertilization form', async ({ page }) => {
      const strawberryPlant = E2EPlantFactory.strawberryPlant();
      await mockSetup.mockPlants([strawberryPlant]);

      await pageObjects.goToCareLogging(strawberryPlant.id);
      await pageObjects.selectActivityType('fertilize');

      // Try to submit without required fields
      await pageObjects.submitActivity();

      // Should see validation errors
      await expect(page.locator('[data-testid="error-product-required"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-dilution-required"]')).toBeVisible();

      // Submit button should be disabled
      await expect(page.locator('[data-testid="submit-activity"]')).toBeDisabled();
    });

    test('User can submit valid form after fixing validation errors', async ({ page }) => {
      const strawberryPlant = E2EPlantFactory.strawberryPlant();
      await mockSetup.mockPlants([strawberryPlant]);

      await pageObjects.goToCareLogging(strawberryPlant.id);
      await pageObjects.selectActivityType('fertilize');

      // Fill required fields
      await pageObjects.fillFertilizationForm({
        product: 'Neptune\'s Harvest',
        dilution: '1 tbsp/gallon'
      });

      // Validation errors should disappear
      await expect(page.locator('[data-testid="error-product-required"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="error-dilution-required"]')).not.toBeVisible();

      // Submit button should be enabled
      await expect(page.locator('[data-testid="submit-activity"]')).toBeEnabled();
    });
  });

  test.describe('Error Handling', () => {
    test('User sees error message when activity submission fails', async ({ page }) => {
      const strawberryPlant = E2EPlantFactory.strawberryPlant();
      await mockSetup.mockPlants([strawberryPlant]);

      await pageObjects.goToCareLogging(strawberryPlant.id);
      await pageObjects.selectActivityType('fertilize');

      await pageObjects.fillFertilizationForm({
        product: 'Neptune\'s Harvest',
        dilution: '1 tbsp/gallon'
      });

      // Mock failed activity creation
      await page.route('**/activities', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'Failed to save activity'
            }),
          });
        }
      });

      await pageObjects.submitActivity();

      // Should show error message
      await pageObjects.expectErrorMessage('Failed to log activity. Please try again.');
      
      // Should stay on the same page
      await expect(page).toHaveURL(new RegExp('/log-care'));
    });
  });
});

/**
 * KEY BENEFITS OF THIS E2E APPROACH:
 * 
 * ✅ REAL USER WORKFLOWS:
 * - Tests actual user journeys from start to finish
 * - Validates cross-component integration
 * - Tests with realistic data flows and API calls
 * - Verifies navigation and page transitions
 * 
 * ✅ COMPREHENSIVE COVERAGE:
 * - Smart defaults integration with different plants
 * - Form validation and error handling
 * - Different activity types and their requirements
 * - Success and failure scenarios
 * 
 * ✅ MAINTAINABLE STRUCTURE:
 * - Page Object pattern for reusable interactions
 * - Fixture factories for consistent test data
 * - Clear test scenarios focused on user value
 * - Easy to extend with new plant varieties or features
 * 
 * This replaces complex integration tests that mixed UI rendering
 * with business logic, providing better coverage and faster feedback
 * for actual user experience.
 */