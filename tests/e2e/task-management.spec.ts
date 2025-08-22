/**
 * E2E Test: Dashboard Task Management Workflows
 * 
 * Tests end-to-end user journeys for managing plant care tasks on the dashboard,
 * including task grouping, completion, filtering, and bulk operations.
 * 
 * Replaces complex integration test: taskGrouping.test.tsx
 */

import { test, expect } from '@playwright/test';
import { 
  PlantCarePageObjects, 
  E2EPlantFactory, 
  E2EActivityFactory,
  E2EMockSetup 
} from './fixtures/plantCareFixtures';

test.describe('Dashboard Task Management', () => {
  let pageObjects: PlantCarePageObjects;
  let mockSetup: E2EMockSetup;

  test.beforeEach(async ({ page }) => {
    pageObjects = new PlantCarePageObjects(page);
    mockSetup = new E2EMockSetup(page);

    // Setup authenticated user
    await mockSetup.setupAuthenticatedUser();
    await mockSetup.mockVarieties();
  });

  test.describe('Task Grouping Display', () => {
    test('User sees grouped fertilization tasks for identical plants on dashboard', async ({ page }) => {
      // Given: User has 10 identical strawberry plants all needing the same fertilization
      const identicalStrawberries = Array.from({ length: 10 }, (_, i) => 
        E2EPlantFactory.strawberryPlant({
          id: `strawberry-${i + 1}`,
          name: `Strawberry Plant ${i + 1}`,
          plantedDate: new Date(Date.now() - 155 * 24 * 60 * 60 * 1000).toISOString() // 155 days old
        })
      );

      await mockSetup.mockPlants(identicalStrawberries);

      // Mock grouped fertilization tasks from the backend
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'grouped-fertilization-task',
              taskType: 'fertilize',
              taskName: 'Apply Neptune\'s Harvest',
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              plantCount: 10,
              plantIds: identicalStrawberries.map(p => p.id),
              varietyName: 'Albion Strawberries',
              details: {
                product: 'Neptune\'s Harvest',
                dilution: '1 tbsp/gallon',
                amount: '1-2 quarts per plant'
              },
              affectedPlants: identicalStrawberries.map(p => ({
                id: p.id,
                name: p.name,
                varietyName: p.varietyName
              })),
              isGrouped: true
            }
          ]),
        });
      });

      // When: User navigates to dashboard
      await pageObjects.goToDashboard();

      // Then: Dashboard shows 1 grouped task instead of 10 individual tasks
      await expect(page.locator('[data-testid="task-count"]')).toHaveText('1 task');
      
      // And: Grouped task displays correct information
      await expect(page.locator('[data-testid="grouped-task-fertilization"]')).toBeVisible();
      await expect(page.locator('text=Apply Neptune\'s Harvest')).toBeVisible();
      await expect(page.locator('text=10 plants')).toBeVisible();
      await expect(page.locator('text=Albion Strawberries')).toBeVisible();
      
      // And: Task shows it affects multiple plants
      await expect(page.locator('[data-testid="task-plant-count"]')).toHaveText('10');
    });

    test('User can expand grouped task to see individual plants affected', async ({ page }) => {
      const identicalStrawberries = Array.from({ length: 5 }, (_, i) => 
        E2EPlantFactory.strawberryPlant({
          id: `strawberry-${i + 1}`,
          name: `Strawberry Plant ${i + 1}`
        })
      );

      await mockSetup.mockPlants(identicalStrawberries);

      // Mock grouped task
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'grouped-watering-task',
              taskType: 'water',
              taskName: 'Deep watering',
              dueDate: new Date().toISOString(),
              plantCount: 5,
              affectedPlants: identicalStrawberries.map(p => ({
                id: p.id,
                name: p.name,
                varietyName: p.varietyName
              })),
              isGrouped: true
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // When: User expands the grouped task
      await pageObjects.expandTaskGroup('water');

      // Then: Individual plants in the group are displayed
      for (const plant of identicalStrawberries) {
        await expect(page.locator(`text=${plant.name}`)).toBeVisible();
      }

      // And: User can see all affected plants listed
      await expect(page.locator('[data-testid="affected-plants-list"]')).toBeVisible();
    });

    test('User sees separate tasks for different varieties even with same care type', async ({ page }) => {
      // Given: User has different plant varieties needing fertilization
      const mixedPlants = [
        ...Array.from({ length: 3 }, (_, i) => 
          E2EPlantFactory.strawberryPlant({
            id: `strawberry-${i + 1}`,
            name: `Strawberry ${i + 1}`
          })
        ),
        ...Array.from({ length: 2 }, (_, i) => 
          E2EPlantFactory.tomatoPlant({
            id: `tomato-${i + 1}`,
            name: `Tomato ${i + 1}`
          })
        )
      ];

      await mockSetup.mockPlants(mixedPlants);

      // Mock tasks that should be grouped separately by variety
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'strawberry-fertilization-group',
              taskType: 'fertilize',
              taskName: 'Apply Neptune\'s Harvest',
              varietyName: 'Albion Strawberries',
              plantCount: 3,
              isGrouped: true
            },
            {
              id: 'tomato-fertilization-group',
              taskType: 'fertilize', 
              taskName: 'Apply Tomato Fertilizer',
              varietyName: 'Cherry Tomato',
              plantCount: 2,
              isGrouped: true
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // Then: User sees 2 separate grouped tasks (one per variety)
      await expect(page.locator('[data-testid="task-count"]')).toHaveText('2 tasks');
      
      await expect(page.locator('text=Apply Neptune\'s Harvest')).toBeVisible();
      await expect(page.locator('text=3 plants')).toBeVisible();
      
      await expect(page.locator('text=Apply Tomato Fertilizer')).toBeVisible();
      await expect(page.locator('text=2 plants')).toBeVisible();
    });
  });

  test.describe('Task Completion Workflows', () => {
    test('User completes grouped task and logs care for all affected plants', async ({ page }) => {
      const strawberries = Array.from({ length: 3 }, (_, i) => 
        E2EPlantFactory.strawberryPlant({
          id: `strawberry-${i + 1}`,
          name: `Strawberry ${i + 1}`
        })
      );

      await mockSetup.mockPlants(strawberries);

      // Mock grouped fertilization task
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'grouped-fertilization',
              taskType: 'fertilize',
              taskName: 'Weekly Fertilization',
              plantCount: 3,
              plantIds: strawberries.map(p => p.id),
              details: {
                product: 'Neptune\'s Harvest',
                dilution: '1 tbsp/gallon'
              },
              isGrouped: true
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // When: User clicks complete on the grouped task
      await pageObjects.completeTask('grouped-fertilization');

      // Then: Bulk activity modal opens pre-populated with task details
      await expect(page.locator('[data-testid="bulk-activity-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-type"]')).toHaveValue('fertilize');
      await expect(page.locator('[data-testid="fertilizer-product"]')).toHaveValue('Neptune\'s Harvest');
      await expect(page.locator('[data-testid="fertilizer-dilution"]')).toHaveValue('1 tbsp/gallon');

      // And: All affected plants are pre-selected
      for (const plant of strawberries) {
        await expect(page.locator(`[data-testid="select-plant-${plant.id}"]`)).toBeChecked();
      }

      // When: User adds notes and submits
      await page.fill('[data-testid="bulk-activity-notes"]', 'Weekly fertilization completed for all strawberries');

      // Mock successful bulk activity creation
      await page.route('**/activities/bulk', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              activitiesCreated: 3,
              activities: strawberries.map(p => ({
                id: `activity-${p.id}`,
                plantId: p.id,
                activityType: 'fertilize'
              }))
            }),
          });
        }
      });

      await pageObjects.submitBulkActivity();

      // Then: Success message shows activities logged for all plants
      await pageObjects.expectSuccessMessage('Fertilization logged for 3 plants');
      
      // And: Task is removed from dashboard (completed)
      await expect(page.locator('[data-testid="grouped-fertilization"]')).not.toBeVisible();
      
      // And: Dashboard shows updated task count
      await expect(page.locator('[data-testid="task-count"]')).toHaveText('0 tasks');
    });

    test('User can complete individual plants within a grouped task', async ({ page }) => {
      const strawberries = Array.from({ length: 4 }, (_, i) => 
        E2EPlantFactory.strawberryPlant({
          id: `strawberry-${i + 1}`,
          name: `Strawberry ${i + 1}`
        })
      );

      await mockSetup.mockPlants(strawberries);

      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'grouped-watering',
              taskType: 'water',
              taskName: 'Daily watering',
              plantCount: 4,
              affectedPlants: strawberries.map(p => ({
                id: p.id,
                name: p.name
              })),
              isGrouped: true
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();
      await pageObjects.expandTaskGroup('water');

      // When: User completes care for 2 individual plants
      await page.check('[data-testid="select-plant-strawberry-1"]');
      await page.check('[data-testid="select-plant-strawberry-2"]');
      await page.click('[data-testid="complete-selected-plants"]');

      // Mock partial completion
      await page.route('**/activities/bulk', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              activitiesCreated: 2
            }),
          });
        }
      });

      // Mock updated task with reduced plant count
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'grouped-watering',
              taskType: 'water', 
              taskName: 'Daily watering',
              plantCount: 2, // Reduced from 4 to 2
              affectedPlants: strawberries.slice(2).map(p => ({
                id: p.id,
                name: p.name
              })),
              isGrouped: true
            }
          ]),
        });
      });

      await pageObjects.submitBulkActivity();

      // Then: Success message for partial completion
      await pageObjects.expectSuccessMessage('Watering logged for 2 plants');
      
      // And: Grouped task still shows but with reduced count
      await expect(page.locator('text=2 plants')).toBeVisible();
      
      // And: Only remaining plants are shown in the group
      await expect(page.locator('text=Strawberry 3')).toBeVisible();
      await expect(page.locator('text=Strawberry 4')).toBeVisible();
      await expect(page.locator('text=Strawberry 1')).not.toBeVisible();
      await expect(page.locator('text=Strawberry 2')).not.toBeVisible();
    });
  });

  test.describe('Task Filtering and Organization', () => {
    test('User can filter tasks by care type to focus on specific activities', async ({ page }) => {
      const mixedPlants = [
        E2EPlantFactory.strawberryPlant({ id: 'strawberry-1' }),
        E2EPlantFactory.tomatoPlant({ id: 'tomato-1' })
      ];

      await mockSetup.mockPlants(mixedPlants);

      // Mock various task types
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'watering-task',
              taskType: 'water',
              taskName: 'Deep watering',
              plantCount: 2,
              isGrouped: true
            },
            {
              id: 'fertilization-task',
              taskType: 'fertilize',
              taskName: 'Apply fertilizer',
              plantCount: 1,
              isGrouped: false
            },
            {
              id: 'observation-task',
              taskType: 'observe',
              taskName: 'Weekly check',
              plantCount: 2,
              isGrouped: true
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // Then: All task types are initially visible
      await expect(page.locator('[data-testid="task-count"]')).toHaveText('3 tasks');
      
      await expect(page.locator('text=Deep watering')).toBeVisible();
      await expect(page.locator('text=Apply fertilizer')).toBeVisible(); 
      await expect(page.locator('text=Weekly check')).toBeVisible();

      // When: User filters to only fertilization tasks
      await page.selectOption('[data-testid="task-filter"]', 'fertilize');

      // Then: Only fertilization tasks are shown
      await expect(page.locator('text=Apply fertilizer')).toBeVisible();
      await expect(page.locator('text=Deep watering')).not.toBeVisible();
      await expect(page.locator('text=Weekly check')).not.toBeVisible();

      // And: Filter count updates
      await expect(page.locator('[data-testid="filtered-task-count"]')).toHaveText('1 task');

      // When: User clears filter
      await page.selectOption('[data-testid="task-filter"]', 'all');

      // Then: All tasks are shown again
      await expect(page.locator('[data-testid="task-count"]')).toHaveText('3 tasks');
    });

    test('User can sort tasks by due date and priority to manage workflow', async ({ page }) => {
      const plants = [E2EPlantFactory.strawberryPlant()];
      await mockSetup.mockPlants(plants);

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Mock tasks with different due dates and priorities
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'overdue-task',
              taskName: 'Overdue watering',
              dueDate: yesterday.toISOString(),
              priority: 'high',
              isOverdue: true
            },
            {
              id: 'today-task',
              taskName: 'Today fertilization',
              dueDate: now.toISOString(),
              priority: 'medium'
            },
            {
              id: 'future-task',
              taskName: 'Upcoming observation',
              dueDate: nextWeek.toISOString(),
              priority: 'low'
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // When: User sorts by due date (default)
      await page.selectOption('[data-testid="task-sort"]', 'dueDate');

      // Then: Tasks are ordered by urgency (overdue first)
      const taskElements = page.locator('[data-testid^="task-"]');
      await expect(taskElements.nth(0)).toContainText('Overdue watering');
      await expect(taskElements.nth(0)).toHaveClass(/overdue/);
      
      await expect(taskElements.nth(1)).toContainText('Today fertilization');
      await expect(taskElements.nth(2)).toContainText('Upcoming observation');

      // When: User sorts by priority
      await page.selectOption('[data-testid="task-sort"]', 'priority');

      // Then: Tasks are ordered by priority (high first)
      await expect(taskElements.nth(0)).toContainText('Overdue watering');
      await expect(taskElements.nth(1)).toContainText('Today fertilization');
      await expect(taskElements.nth(2)).toContainText('Upcoming observation');
    });
  });

  test.describe('Bulk Task Operations', () => {
    test('User can select multiple grouped tasks for bulk completion', async ({ page }) => {
      const strawberries = Array.from({ length: 6 }, (_, i) => 
        E2EPlantFactory.strawberryPlant({
          id: `strawberry-${i + 1}`,
          name: `Strawberry ${i + 1}`
        })
      );

      await mockSetup.mockPlants(strawberries);

      // Mock multiple grouped tasks of same type
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'group-watering-1',
              taskType: 'water',
              taskName: 'Morning watering',
              plantCount: 3,
              plantIds: ['strawberry-1', 'strawberry-2', 'strawberry-3'],
              isGrouped: true
            },
            {
              id: 'group-watering-2',
              taskType: 'water',
              taskName: 'Evening watering',
              plantCount: 3,
              plantIds: ['strawberry-4', 'strawberry-5', 'strawberry-6'],
              isGrouped: true
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // When: User selects multiple task groups
      await page.check('[data-testid="select-task-group-watering-1"]');
      await page.check('[data-testid="select-task-group-watering-2"]'); 

      await expect(page.locator('[data-testid="selected-task-count"]')).toHaveText('2 task groups selected');

      // And: Clicks bulk complete
      await page.click('[data-testid="bulk-complete-tasks"]');

      // Then: Bulk activity modal opens with all plants from both groups
      await expect(page.locator('[data-testid="bulk-activity-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-type"]')).toHaveValue('water');

      // And: All 6 plants are pre-selected
      for (let i = 1; i <= 6; i++) {
        await expect(page.locator(`[data-testid="select-plant-strawberry-${i}"]`)).toBeChecked();
      }

      // When: User submits bulk activity
      await page.fill('[data-testid="bulk-activity-notes"]', 'Daily watering completed for all plants');

      // Mock successful bulk completion
      await page.route('**/activities/bulk', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              activitiesCreated: 6,
              tasksCompleted: 2
            }),
          });
        }
      });

      await pageObjects.submitBulkActivity();

      // Then: Success message shows both groups completed
      await pageObjects.expectSuccessMessage('Watering logged for 6 plants (2 task groups completed)');
      
      // And: Dashboard shows no watering tasks remaining
      await expect(page.locator('[data-testid="watering-tasks"]')).not.toBeVisible();
    });
  });

  test.describe('Task Status and Progress Tracking', () => {
    test('User sees task progress updates as individual plants are completed', async ({ page }) => {
      const strawberries = Array.from({ length: 5 }, (_, i) => 
        E2EPlantFactory.strawberryPlant({
          id: `strawberry-${i + 1}`,
          name: `Strawberry ${i + 1}`
        })
      );

      await mockSetup.mockPlants(strawberries);

      // Mock task with some plants already completed
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'partial-completion-task',
              taskType: 'fertilize',
              taskName: 'Weekly fertilization',
              plantCount: 5,
              completedCount: 2, // 2 of 5 already done
              remainingPlantIds: ['strawberry-3', 'strawberry-4', 'strawberry-5'],
              completedPlantIds: ['strawberry-1', 'strawberry-2'],
              isGrouped: true,
              progress: 0.4 // 40% complete
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // Then: Task shows progress indicator
      await expect(page.locator('[data-testid="task-progress"]')).toHaveText('2 of 5 completed');
      await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '40');

      // And: Progress bar shows visual completion
      const progressBar = page.locator('[data-testid="progress-bar-fill"]');
      await expect(progressBar).toHaveCSS('width', '40%');

      // And: Task shows remaining count in title
      await expect(page.locator('[data-testid="task-title"]')).toContainText('3 plants remaining');

      // When: User expands to see detail
      await pageObjects.expandTaskGroup('fertilize');

      // Then: Completed plants are visually distinct
      await expect(page.locator('[data-testid="plant-strawberry-1"]')).toHaveClass(/completed/);
      await expect(page.locator('[data-testid="plant-strawberry-2"]')).toHaveClass(/completed/);
      
      // And: Remaining plants are actionable
      await expect(page.locator('[data-testid="plant-strawberry-3"]')).not.toHaveClass(/completed/);
      await expect(page.locator('[data-testid="plant-strawberry-4"]')).not.toHaveClass(/completed/);
      await expect(page.locator('[data-testid="plant-strawberry-5"]')).not.toHaveClass(/completed/);
    });
  });

  test.describe('Plant Hiding and Visibility Management', () => {
    test('User can hide plants and see updated dashboard counts', async ({ page }) => {
      // Given: User has several plants visible on dashboard
      const plants = [
        E2EPlantFactory.strawberryPlant({ id: 'strawberry-1', name: 'Test Strawberry' }),
        E2EPlantFactory.tomatoPlant({ id: 'tomato-1', name: 'Test Tomato' })
      ];

      await mockSetup.mockPlants(plants);

      // Mock initial dashboard data
      await page.route('**/dashboard-summary**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalPlants: 2,
            plantCareStatusCount: 2,
            fertilizationTasksCount: 3
          }),
        });
      });

      await pageObjects.goToDashboard();

      // Then: Initial counts reflect all plants
      await expect(page.locator('[data-testid="total-plants-count"]')).toHaveText('2');
      await expect(page.locator('[data-testid="care-status-count"]')).toHaveText('2');
      await expect(page.locator('[data-testid="fertilization-tasks-count"]')).toHaveText('3');

      // And: Both plants are visible
      await expect(page.locator('text=Test Strawberry')).toBeVisible();
      await expect(page.locator('text=Test Tomato')).toBeVisible();

      // When: User hides the strawberry plant
      await page.click('[data-testid="hide-plant-strawberry-1"]');

      // Mock updated dashboard data after hiding one plant
      await page.route('**/dashboard-summary**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalPlants: 1, // Reduced by 1
            plantCareStatusCount: 1, // Reduced by 1
            fertilizationTasksCount: 1 // Reduced (no strawberry tasks)
          }),
        });
      });

      // Trigger dashboard refresh
      await page.reload();

      // Then: Counts are updated to reflect hidden plant
      await expect(page.locator('[data-testid="total-plants-count"]')).toHaveText('1');
      await expect(page.locator('[data-testid="care-status-count"]')).toHaveText('1');
      await expect(page.locator('[data-testid="fertilization-tasks-count"]')).toHaveText('1');

      // And: Hidden plant is no longer visible
      await expect(page.locator('text=Test Strawberry')).not.toBeVisible();
      await expect(page.locator('text=Test Tomato')).toBeVisible();
    });

    test('User sees empty state when all plants are hidden', async ({ page }) => {
      const plant = E2EPlantFactory.lettucePlant({ id: 'lettuce-1', name: 'Test Lettuce' });
      await mockSetup.mockPlants([plant]);

      await page.route('**/dashboard-summary**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalPlants: 1,
            plantCareStatusCount: 1,
            fertilizationTasksCount: 2
          }),
        });
      });

      await pageObjects.goToDashboard();

      // Initially plant is visible
      await expect(page.locator('text=Test Lettuce')).toBeVisible();

      // When: User hides the only plant
      await page.click('[data-testid="hide-plant-lettuce-1"]');

      // Mock empty dashboard state
      await page.route('**/dashboard-summary**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalPlants: 0,
            plantCareStatusCount: 0,
            fertilizationTasksCount: 0
          }),
        });
      });

      await page.reload();

      // Then: All counts show zero
      await expect(page.locator('[data-testid="total-plants-count"]')).toHaveText('0');
      await expect(page.locator('[data-testid="care-status-count"]')).toHaveText('0');
      await expect(page.locator('[data-testid="fertilization-tasks-count"]')).toHaveText('0');

      // And: Empty state is displayed
      await expect(page.locator('[data-testid="empty-plants-message"]')).toBeVisible();
      await expect(page.locator('text=No plants visible')).toBeVisible();
    });

    test('User can show/unhide previously hidden plants', async ({ page }) => {
      const plants = [E2EPlantFactory.strawberryPlant({ id: 'strawberry-1', name: 'Hidden Strawberry' })];
      await mockSetup.mockPlants(plants);

      await pageObjects.goToDashboard();

      // Hide the plant first
      await page.click('[data-testid="hide-plant-strawberry-1"]');
      await expect(page.locator('text=Hidden Strawberry')).not.toBeVisible();

      // When: User opens "Show Hidden Plants" menu
      await page.click('[data-testid="show-hidden-plants"]');

      // Then: Hidden plants are listed
      await expect(page.locator('[data-testid="hidden-plant-strawberry-1"]')).toBeVisible();
      await expect(page.locator('text=Hidden Strawberry')).toBeVisible();

      // When: User clicks to unhide the plant
      await page.click('[data-testid="unhide-plant-strawberry-1"]');

      // Then: Plant becomes visible again on main dashboard
      await expect(page.locator('[data-testid="plant-card-strawberry-1"]')).toBeVisible();
      await expect(page.locator('text=Hidden Strawberry')).toBeVisible();
    });
  });

  test.describe('Multi-Variety Task Grouping', () => {
    test('User sees separate grouped tasks for different plant varieties', async ({ page }) => {
      // Given: User has multiple plants of different varieties
      const mixedPlants = [
        ...Array.from({ length: 5 }, (_, i) => 
          E2EPlantFactory.tomatoPlant({
            id: `tomato-${i + 1}`,
            name: `Tomato Plant ${i + 1}`,
            varietyName: 'Beefsteak Tomato'
          })
        ),
        ...Array.from({ length: 3 }, (_, i) => 
          E2EPlantFactory.lettucePlant({
            id: `lettuce-${i + 1}`,
            name: `Lettuce Plant ${i + 1}`,
            varietyName: 'May Queen Lettuce'
          })
        ),
        ...Array.from({ length: 4 }, (_, i) => 
          E2EPlantFactory.strawberryPlant({
            id: `strawberry-${i + 1}`,
            name: `Strawberry Plant ${i + 1}`,
            varietyName: 'Albion Strawberries'
          })
        )
      ];

      await mockSetup.mockPlants(mixedPlants);

      // Mock variety-specific grouped fertilization tasks
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'tomato-fertilization-group',
              taskType: 'fertilize',
              taskName: 'Apply Tomato Fertilizer',
              varietyName: 'Beefsteak Tomato',
              plantCount: 5,
              details: {
                product: 'Tomato-Specific Fertilizer',
                dilution: '1 tsp/gallon'
              },
              isGrouped: true
            },
            {
              id: 'lettuce-fertilization-group',
              taskType: 'fertilize',
              taskName: 'Apply Lettuce Nutrients',
              varietyName: 'May Queen Lettuce', 
              plantCount: 3,
              details: {
                product: 'Leafy Green Fertilizer',
                dilution: '2 tsp/gallon'
              },
              isGrouped: true
            },
            {
              id: 'strawberry-fertilization-group',
              taskType: 'fertilize',
              taskName: 'Apply Neptune\'s Harvest',
              varietyName: 'Albion Strawberries',
              plantCount: 4,
              details: {
                product: 'Neptune\'s Harvest',
                dilution: '1 tbsp/gallon'
              },
              isGrouped: true
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // Then: User sees 3 separate grouped tasks (one per variety)
      await expect(page.locator('[data-testid="task-count"]')).toHaveText('3 tasks');

      // And: Each variety has its own grouped task with correct count
      await expect(page.locator('[data-testid="tomato-fertilization-group"]')).toBeVisible();
      await expect(page.locator('text=Apply Tomato Fertilizer')).toBeVisible();
      await expect(page.locator('text=Beefsteak Tomato')).toBeVisible();
      await expect(page.locator('text=5 plants')).toBeVisible();

      await expect(page.locator('[data-testid="lettuce-fertilization-group"]')).toBeVisible();
      await expect(page.locator('text=Apply Lettuce Nutrients')).toBeVisible();
      await expect(page.locator('text=May Queen Lettuce')).toBeVisible();
      await expect(page.locator('text=3 plants')).toBeVisible();

      await expect(page.locator('[data-testid="strawberry-fertilization-group"]')).toBeVisible();
      await expect(page.locator('text=Apply Neptune\'s Harvest')).toBeVisible();
      await expect(page.locator('text=Albion Strawberries')).toBeVisible();
      await expect(page.locator('text=4 plants')).toBeVisible();
    });

    test('User sees varieties kept separate even when using same fertilizer products', async ({ page }) => {
      // Given: Different varieties that happen to use the same fertilizer product
      const plants = [
        E2EPlantFactory.tomatoPlant({ id: 'tomato-1', varietyName: 'Beefsteak Tomato' }),
        E2EPlantFactory.lettucePlant({ id: 'lettuce-1', varietyName: 'May Queen Lettuce' })
      ];

      await mockSetup.mockPlants(plants);

      // Mock tasks with same fertilizer product but different varieties
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'tomato-general-fertilizer',
              taskType: 'fertilize',
              taskName: 'Apply Liquid Fertilizer',
              varietyName: 'Beefsteak Tomato',
              plantCount: 1,
              details: {
                product: 'General Fertilizer', // Same product
                dilution: '1 tsp/gallon'
              },
              dueDate: new Date('2025-09-01').toISOString(),
              isGrouped: false
            },
            {
              id: 'lettuce-general-fertilizer',
              taskType: 'fertilize',
              taskName: 'Apply Liquid Fertilizer', 
              varietyName: 'May Queen Lettuce',
              plantCount: 1,
              details: {
                product: 'General Fertilizer', // Same product, same date
                dilution: '1 tsp/gallon'
              },
              dueDate: new Date('2025-09-01').toISOString(),
              isGrouped: false
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // Then: Tasks remain separate despite same product (because different varieties)
      await expect(page.locator('[data-testid="task-count"]')).toHaveText('2 tasks');
      
      // And: Each variety shows its own task
      await expect(page.locator('text=Beefsteak Tomato')).toBeVisible();
      await expect(page.locator('text=May Queen Lettuce')).toBeVisible();
      
      // And: Both show the same fertilizer product but are not grouped
      const generalFertilizerElements = page.locator('text=General Fertilizer');
      await expect(generalFertilizerElements).toHaveCount(2); // Should appear twice
    });

    test('User can complete grouped tasks for specific varieties independently', async ({ page }) => {
      const mixedPlants = [
        E2EPlantFactory.tomatoPlant({ id: 'tomato-1' }),
        E2EPlantFactory.tomatoPlant({ id: 'tomato-2' }),
        E2EPlantFactory.lettucePlant({ id: 'lettuce-1' })
      ];

      await mockSetup.mockPlants(mixedPlants);

      // Mock variety-specific grouped tasks
      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'tomato-group-task',
              taskType: 'water',
              taskName: 'Deep watering',
              varietyName: 'Cherry Tomato',
              plantCount: 2,
              plantIds: ['tomato-1', 'tomato-2'],
              isGrouped: true
            },
            {
              id: 'lettuce-individual-task',
              taskType: 'water',
              taskName: 'Light watering',
              varietyName: 'May Queen Lettuce',
              plantCount: 1,
              plantIds: ['lettuce-1'],
              isGrouped: false
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();

      // When: User completes only the tomato group task
      await pageObjects.completeTask('tomato-group-task');

      // Mock successful completion for tomatoes only
      await page.route('**/activities/bulk', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              activitiesCreated: 2, // Only tomatoes
              varietyCompleted: 'Cherry Tomato'
            }),
          });
        }
      });

      await pageObjects.submitBulkActivity();

      // Then: Success message shows variety-specific completion
      await pageObjects.expectSuccessMessage('Watering logged for 2 Cherry Tomato plants');

      // And: Tomato task is removed but lettuce task remains
      await expect(page.locator('[data-testid="tomato-group-task"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="lettuce-individual-task"]')).toBeVisible();
    });
  });

  test.describe('Error Handling in Task Management', () => {
    test('User sees error when bulk task completion fails', async ({ page }) => {
      const plants = [E2EPlantFactory.strawberryPlant()];
      await mockSetup.mockPlants(plants);

      await page.route('**/tasks**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'test-task',
              taskType: 'water',
              taskName: 'Daily watering',
              plantCount: 1,
              isGrouped: false
            }
          ]),
        });
      });

      await pageObjects.goToDashboard();
      await pageObjects.completeTask('test-task');

      // Mock failed bulk activity creation
      await page.route('**/activities/bulk', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Failed to save activities'
            }),
          });
        }
      });

      await pageObjects.submitBulkActivity();

      // Then: Error message is displayed
      await pageObjects.expectErrorMessage('Failed to complete tasks. Please try again.');
      
      // And: Modal remains open for retry
      await expect(page.locator('[data-testid="bulk-activity-modal"]')).toBeVisible();
      
      // And: Tasks remain on dashboard (not removed)
      await page.click('[data-testid="close-modal"]');
      await expect(page.locator('[data-testid="test-task"]')).toBeVisible();
    });
  });
});

/**
 * KEY BENEFITS OF THIS E2E APPROACH FOR TASK MANAGEMENT:
 * 
 * ✅ REAL USER WORKFLOWS:
 * - Tests actual dashboard task management from user perspective
 * - Validates task grouping displays correctly in UI
 * - Tests bulk operations and partial completions
 * - Verifies progress tracking and visual feedback
 * 
 * ✅ COMPREHENSIVE TASK SCENARIOS:
 * - Task grouping by variety and care type
 * - Individual vs. grouped task completion
 * - Filtering and sorting workflows
 * - Bulk operations across multiple task groups
 * - Progress tracking for partially completed groups
 * 
 * ✅ BUSINESS VALUE VERIFICATION:
 * - Confirms task reduction benefit (10 → 1 grouped task)
 * - Tests workflow efficiency improvements
 * - Validates user can manage large plant collections
 * - Tests error scenarios for robust UX
 * 
 * This replaces the complex taskGrouping.test.tsx integration test that
 * mixed business logic calculations with UI concerns. The E2E tests focus
 * on user experience while business logic tests handle the calculations.
 */