/**
 * E2E Test Fixtures - Plant Care Domain
 * Provides consistent test data and utilities for E2E tests
 */

import { Page } from '@playwright/test';

export interface TestPlant {
  id: string;
  name: string;
  varietyName: string;
  plantedDate: string;
  location: string;
  container: string;
  isActive: boolean;
  reminderPreferences: {
    watering: boolean;
    fertilizing: boolean;
    observation: boolean;
    lighting: boolean;
    pruning: boolean;
  };
}

export interface TestActivity {
  id: string;
  plantId: string;
  activityType: 'water' | 'fertilize' | 'observe' | 'prune' | 'thin';
  activityDate: string;
  details: {
    product?: string;
    amount?: string;
    dilution?: string;
    method?: string;
  };
  notes?: string;
}

/**
 * Test Plant Factory for E2E scenarios
 */
export class E2EPlantFactory {
  static strawberryPlant(overrides: Partial<TestPlant> = {}): TestPlant {
    return {
      id: 'strawberry-test-plant',
      name: 'Test Strawberry Plant',
      varietyName: 'Albion Strawberries',
      plantedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
      location: 'Indoor',
      container: 'Grow Bag',
      isActive: true,
      reminderPreferences: {
        watering: true,
        fertilizing: true,
        observation: true,
        lighting: false,
        pruning: true,
      },
      ...overrides,
    };
  }

  static tomatoPlant(overrides: Partial<TestPlant> = {}): TestPlant {
    return {
      id: 'tomato-test-plant',
      name: 'Test Cherry Tomato',
      varietyName: 'Cherry Tomato',
      plantedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      location: 'Indoor',
      container: '6-inch pot',
      isActive: true,
      reminderPreferences: {
        watering: true,
        fertilizing: false,
        observation: true,
        lighting: true,
        pruning: false,
      },
      ...overrides,
    };
  }

  static lettucePlant(overrides: Partial<TestPlant> = {}): TestPlant {
    return {
      id: 'lettuce-test-plant',
      name: 'Test May Queen Lettuce',
      varietyName: 'May Queen Lettuce',
      plantedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      location: 'Indoor',
      container: 'Seed tray',
      isActive: true,
      reminderPreferences: {
        watering: true,
        fertilizing: true,
        observation: false,
        lighting: false,
        pruning: false,
      },
      ...overrides,
    };
  }

  static multiplePlants(): TestPlant[] {
    return [
      E2EPlantFactory.strawberryPlant({ id: 'plant-1' }),
      E2EPlantFactory.tomatoPlant({ id: 'plant-2' }),
      E2EPlantFactory.lettucePlant({ id: 'plant-3' }),
    ];
  }
}

/**
 * Test Activity Factory for E2E scenarios
 */
export class E2EActivityFactory {
  static wateringActivity(plantId: string, daysAgo = 0): TestActivity {
    return {
      id: `watering-${plantId}-${daysAgo}`,
      plantId,
      activityType: 'water',
      activityDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      details: {
        amount: '2 cups',
        method: 'deep-watering',
      },
      notes: 'Regular watering session',
    };
  }

  static fertilizationActivity(plantId: string, daysAgo = 0): TestActivity {
    return {
      id: `fertilization-${plantId}-${daysAgo}`,
      plantId,
      activityType: 'fertilize',
      activityDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      details: {
        product: 'Neptune\'s Harvest',
        dilution: '1 tbsp/gallon',
        amount: '1-2 quarts',
        method: 'soil-drench',
      },
      notes: 'Weekly fertilization',
    };
  }

  static observationActivity(plantId: string, daysAgo = 0): TestActivity {
    return {
      id: `observation-${plantId}-${daysAgo}`,
      plantId,
      activityType: 'observe',
      activityDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      details: {},
      notes: 'Plant looks healthy, new growth visible',
    };
  }

  static careHistory(plantId: string): TestActivity[] {
    return [
      E2EActivityFactory.wateringActivity(plantId, 1),
      E2EActivityFactory.fertilizationActivity(plantId, 7),
      E2EActivityFactory.observationActivity(plantId, 3),
      E2EActivityFactory.wateringActivity(plantId, 4),
    ];
  }
}

/**
 * E2E Page Object Utilities
 */
export class PlantCarePageObjects {
  constructor(private page: Page) {}

  // Navigation helpers
  async goToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async goToPlantDetail(plantId: string) {
    await this.page.goto(`/plants/${plantId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async goToCareLogging(plantId?: string) {
    const url = plantId ? `/log-care/${plantId}` : '/log-care';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  // Care logging helpers
  async selectActivityType(activityType: string) {
    await this.page.selectOption('[data-testid="activity-type"]', activityType);
  }

  async selectPlant(plantName: string) {
    await this.page.selectOption('[data-testid="plant-select"]', plantName);
  }

  async fillFertilizationForm(details: {
    product?: string;
    dilution?: string;
    amount?: string;
    notes?: string;
  }) {
    if (details.product) {
      await this.page.fill('[data-testid="fertilizer-product"]', details.product);
    }
    if (details.dilution) {
      await this.page.fill('[data-testid="fertilizer-dilution"]', details.dilution);
    }
    if (details.amount) {
      await this.page.fill('[data-testid="fertilizer-amount"]', details.amount);
    }
    if (details.notes) {
      await this.page.fill('[data-testid="activity-notes"]', details.notes);
    }
  }

  async fillWateringForm(details: {
    amount?: string;
    method?: string;
    notes?: string;
  }) {
    if (details.amount) {
      await this.page.fill('[data-testid="watering-amount"]', details.amount);
    }
    if (details.method) {
      await this.page.selectOption('[data-testid="watering-method"]', details.method);
    }
    if (details.notes) {
      await this.page.fill('[data-testid="activity-notes"]', details.notes);
    }
  }

  async submitActivity() {
    await this.page.click('[data-testid="submit-activity"]');
  }

  async useSmartSuggestion(suggestionType: string) {
    await this.page.click(`[data-testid="smart-suggestion-${suggestionType}"]`);
  }

  // Plant management helpers
  async openReminderSettings() {
    await this.page.click('[data-testid="reminder-settings-button"]');
  }

  async toggleReminder(reminderType: string, enabled: boolean) {
    const checkbox = this.page.locator(`[data-testid="reminder-${reminderType}"]`);
    if (enabled) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async saveReminderSettings() {
    await this.page.click('[data-testid="save-reminders"]');
  }

  // Task management helpers
  async expandTaskGroup(taskType: string) {
    await this.page.click(`[data-testid="expand-${taskType}-tasks"]`);
  }

  async completeTask(taskId: string) {
    await this.page.click(`[data-testid="complete-task-${taskId}"]`);
  }

  async viewTaskDetails(taskId: string) {
    await this.page.click(`[data-testid="task-${taskId}-details"]`);
  }

  // Plant visibility helpers
  async hidePlant(plantId: string) {
    await this.page.click(`[data-testid="hide-plant-${plantId}"]`);
  }

  async showHiddenPlants() {
    await this.page.click('[data-testid="show-hidden-plants"]');
  }

  async unhidePlant(plantId: string) {
    await this.page.click(`[data-testid="unhide-plant-${plantId}"]`);
  }

  // Bulk operations helpers
  async selectMultiplePlants(plantIds: string[]) {
    for (const plantId of plantIds) {
      await this.page.check(`[data-testid="select-plant-${plantId}"]`);
    }
  }

  async openBulkActivityModal() {
    await this.page.click('[data-testid="bulk-activity-button"]');
  }

  async submitBulkActivity() {
    await this.page.click('[data-testid="submit-bulk-activity"]');
  }

  // Verification helpers
  async expectSuccessMessage(message?: string) {
    const successLocator = this.page.locator('[data-testid="success-message"]');
    await successLocator.waitFor({ state: 'visible' });
    if (message) {
      await this.page.locator(`text=${message}`).waitFor();
    }
  }

  async expectErrorMessage(message?: string) {
    const errorLocator = this.page.locator('[data-testid="error-message"]');
    await errorLocator.waitFor({ state: 'visible' });
    if (message) {
      await this.page.locator(`text=${message}`).waitFor();
    }
  }

  async expectPlantCount(count: number) {
    await this.page.locator(`[data-testid="plant-count"]:has-text("${count}")`).waitFor();
  }

  async expectTaskCount(taskType: string, count: number) {
    await this.page.locator(`[data-testid="${taskType}-task-count"]:has-text("${count}")`).waitFor();
  }

  async expectActivityInHistory(activityType: string, plantName?: string) {
    const historyItem = plantName 
      ? `[data-testid="activity-${activityType}-${plantName}"]`
      : `[data-testid="activity-${activityType}"]`;
    
    await this.page.locator(historyItem).waitFor({ state: 'visible' });
  }
}

/**
 * Mock Data Setup Utilities
 */
export class E2EMockSetup {
  constructor(private page: Page) {}

  async setupAuthenticatedUser() {
    await this.page.route('**/auth/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { 
            uid: 'test-user-123', 
            email: 'test@example.com',
            displayName: 'Test User'
          },
        }),
      });
    });
  }

  async mockPlants(plants: TestPlant[]) {
    await this.page.route('**/plants**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(plants),
      });
    });
  }

  async mockActivities(activities: TestActivity[]) {
    await this.page.route('**/activities**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json', 
        body: JSON.stringify(activities),
      });
    });
  }

  async mockVarieties() {
    const varieties = [
      {
        id: 'strawberry-albion',
        name: 'Albion Strawberries',
        category: 'berries',
        protocols: {
          fertilization: {
            ongoingProduction: {
              schedule: [
                {
                  taskName: 'Apply Neptune\'s Harvest',
                  startDays: 120,
                  frequencyDays: 7,
                  repeatCount: 20,
                }
              ]
            }
          }
        }
      },
      {
        id: 'cherry-tomato', 
        name: 'Cherry Tomato',
        category: 'tomatoes',
      },
      {
        id: 'may-queen-lettuce',
        name: 'May Queen Lettuce', 
        category: 'leafy-greens',
      }
    ];

    await this.page.route('**/varieties**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(varieties),
      });
    });
  }

  async mockSmartDefaults() {
    await this.page.route('**/smart-defaults**', (route) => {
      const url = new URL(route.request().url());
      const activityType = url.searchParams.get('activityType');
      const plantId = url.searchParams.get('plantId');
      
      let suggestions = [];
      
      if (activityType === 'water') {
        suggestions = [
          {
            type: 'water',
            amount: '1-2 cups',
            confidence: 'high',
            reasoning: 'Based on plant size and last watering'
          }
        ];
      } else if (activityType === 'fertilize') {
        suggestions = [
          {
            type: 'fertilize',
            product: 'Neptune\'s Harvest',
            dilution: '1 tbsp/gallon',
            amount: '1-2 quarts',
            confidence: 'high',
            reasoning: 'Recommended for strawberries in ongoing production'
          }
        ];
      }

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(suggestions),
      });
    });
  }
}