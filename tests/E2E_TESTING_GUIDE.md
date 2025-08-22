# E2E Testing Guide for SmartGarden

This guide explains the E2E testing strategy and patterns used in the SmartGarden application, and how they replace complex integration tests.

## Overview

The SmartGarden app uses **Playwright** for End-to-End testing, focusing on real user workflows and cross-component integration. This approach replaces brittle integration tests that mocked services and focused on implementation details.

## Philosophy: E2E vs Integration Tests

### ❌ **Previous Integration Test Problems**
- **Extensive Mocking**: 60+ lines of Firebase and service mocking
- **Implementation Details**: Testing `toHaveBeenCalledWith` instead of user outcomes
- **Brittle**: Tests broke when implementation changed, even if behavior was correct
- **Complex Setup**: Required deep knowledge of internal service architecture
- **Slow Feedback**: Complex mocking made tests slow and unreliable

### ✅ **New E2E Test Benefits**
- **Real User Workflows**: Tests what users actually do
- **Cross-Component Integration**: Verifies entire feature flows work together
- **Data Persistence**: Tests real data storage and retrieval
- **Resilient**: Tests survive refactoring since they focus on user outcomes
- **Clear Feedback**: Failures indicate actual user-facing problems

## Test Architecture

### Test Organization
```
tests/
├── e2e/
│   ├── plant-registration.spec.ts    # Plant registration workflows
│   ├── plant-management.spec.ts      # Plant settings and management
│   ├── care-logging.spec.ts          # Care activity logging
│   ├── task-management.spec.ts       # Task completion workflows
│   └── fixtures/
│       └── plantCareFixtures.ts      # Shared test utilities
```

### Key Test Patterns

#### 1. **Page Object Model**
```typescript
// tests/e2e/fixtures/plantCareFixtures.ts
export class PlantCarePageObjects {
  constructor(private page: Page) {}

  async goToPlantDetail(plantId: string) {
    await this.page.goto(`/plants/${plantId}`);
  }

  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]'))
      .toContainText(message);
  }
}
```

#### 2. **Test Data Factories**
```typescript
export class E2EPlantFactory {
  static strawberryPlant(overrides = {}) {
    return {
      id: 'test-strawberry-1',
      varietyName: 'Albion Strawberries',
      name: 'Test Strawberry Plant',
      plantedDate: new Date().toISOString(),
      isActive: true,
      ...overrides
    };
  }
}
```

#### 3. **Mock Setup Utilities**
```typescript
export class E2EMockSetup {
  constructor(private page: Page) {}

  async setupAuthenticatedUser() {
    await this.page.route('**/auth/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          user: { uid: 'test-user', email: 'test@example.com' }
        })
      });
    });
  }
}
```

## Test Coverage Strategy

### 🎯 **What E2E Tests Cover**

#### Complete User Workflows
- **Plant Registration**: Full form → validation → submission → dashboard update
- **Care Logging**: Activity forms → data persistence → history display
- **Settings Management**: Preference changes → persistence across sessions
- **Task Management**: Task completion → activity creation → UI updates

#### Cross-Component Integration
- **Navigation Flows**: Form → submission → redirect → data display
- **Data Persistence**: Changes → storage → reload verification
- **Error Handling**: API failures → user feedback → retry capability
- **State Management**: Component A updates → Component B reflects changes

#### Real Data Operations
- **Form Validation**: Progressive validation as users fill forms
- **API Integration**: Real HTTP requests with mocked responses
- **Storage Persistence**: Data survives page reloads and navigation
- **Error Recovery**: Network failures handled gracefully

### 🚫 **What E2E Tests Don't Cover**

E2E tests focus on user workflows, not implementation details:

- **Internal State Management**: How components manage local state
- **Service Method Calls**: Which specific methods are called
- **Component Props**: Internal component communication
- **Business Logic**: Mathematical calculations and data transformations

*These are covered by focused unit and business logic tests.*

## E2E Test Examples

### Complete Workflow Test
```typescript
test('User registers a new plant with full workflow', async ({ page }) => {
  // Given: User is on the registration page
  await page.goto('/plants/add');
  
  // When: User fills and submits the form
  await page.selectOption('[data-testid="variety-select"]', 'astro-arugula');
  await page.fill('[data-testid="planting-date-input"]', today);
  await page.selectOption('[data-testid="bed-selector"]', 'test-bed-1');
  await page.click('[data-testid="mixture-card-leafy-greens-standard"]');
  
  // Mock successful API response
  await page.route('**/plants', route => {
    const requestBody = route.request().postDataJSON();
    expect(requestBody).toMatchObject({
      varietyId: 'astro-arugula',
      varietyName: 'Astro Arugula'
    });
    route.fulfill({ status: 201, body: JSON.stringify({ id: 'new-plant' }) });
  });
  
  await page.click('[data-testid="submit-registration"]');
  
  // Then: Success workflow completes
  await expect(page.locator('[data-testid="success-message"]'))
    .toContainText('Plant registered successfully');
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-testid="plant-card-new-plant"]')).toBeVisible();
});
```

### Error Handling Test
```typescript
test('User sees helpful error when registration fails', async ({ page }) => {
  // Setup: Fill valid form
  await page.goto('/plants/add');
  // ... fill form ...
  
  // Mock server error
  await page.route('**/plants', route => {
    route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
  });
  
  await page.click('[data-testid="submit-registration"]');
  
  // Then: Error is handled gracefully
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Failed to register plant. Please try again.');
  
  // And: Form remains intact for retry
  await expect(page.locator('[data-testid="variety-select"]')).toHaveValue('astro-arugula');
});
```

### Data Persistence Test
```typescript
test('User changes persist across sessions', async ({ page }) => {
  // Given: User makes changes
  await page.goto('/plants/plant-123');
  await page.click('[data-testid="edit-plant"]');
  await page.fill('[data-testid="plant-name"]', 'Updated Name');
  await page.click('[data-testid="save-changes"]');
  
  // When: User reloads page
  await page.reload();
  
  // Then: Changes persist
  await expect(page.locator('[data-testid="plant-name"]')).toHaveText('Updated Name');
});
```

## Migration from Integration Tests

### Replaced Integration Tests

| Old Integration Test | New E2E Test | Improvement |
|---------------------|--------------|-------------|
| `PlantRegistrationForm.integration.test.tsx` | `plant-registration.spec.ts` | Real form workflows vs mocked service calls |
| `careLogging.integration.test.tsx` | `care-logging.spec.ts` | Complete logging workflows vs implementation testing |
| `plantDetailReminderSettings.test.tsx` | `plant-management.spec.ts` | Cross-session persistence vs component state testing |

### Conversion Principles

When converting integration tests to E2E:

1. **Focus on User Actions**: Replace service method verification with user workflow testing
2. **Test Real Data Flow**: Replace mocked responses with realistic API interactions
3. **Verify UI Changes**: Replace state assertions with visible UI verification
4. **Cover Error Scenarios**: Replace exception testing with user error experience testing

### Example Conversion

**Before (Integration Test):**
```typescript
// 60+ lines of mocking
jest.mock('@/services/firebase/plantService');
jest.mock('@/hooks/useFirebasePlants');

test('creates plant with correct data', async () => {
  // Complex mock setup
  mockCreatePlant.mockResolvedValue('plant-id');
  
  // Render with mocks
  render(<PlantRegistrationForm />);
  
  // Fill form and submit
  // ...
  
  // Verify mock was called with correct arguments
  expect(mockCreatePlant).toHaveBeenCalledWith(
    expect.objectContaining({
      varietyId: 'astro-arugula',
      // 20+ more properties...
    })
  );
});
```

**After (E2E Test):**
```typescript
test('User registers plant and sees it in dashboard', async ({ page }) => {
  await page.goto('/plants/add');
  
  // Fill form (same user actions)
  await page.selectOption('[data-testid="variety-select"]', 'astro-arugula');
  // ...
  
  // Mock realistic API response
  await page.route('**/plants', route => {
    route.fulfill({ status: 201, body: JSON.stringify({ id: 'new-plant' }) });
  });
  
  await page.click('[data-testid="submit-registration"]');
  
  // Verify user outcome
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-testid="plant-card-new-plant"]')).toBeVisible();
});
```

## Best Practices

### Test Organization
- **Group by User Journey**: Plant registration, care logging, settings management
- **One Workflow per Test**: Each test covers a complete user workflow
- **Descriptive Names**: Test names describe user goals, not implementation details

### Data Management
- **Fresh State**: Each test starts with clean, known data state
- **Realistic Data**: Use factory functions that create realistic test data
- **Mock External APIs**: Mock Firebase/external services with realistic responses

### Error Testing
- **User-Focused Errors**: Test error messages and recovery workflows users experience
- **Network Scenarios**: Test offline, slow network, and server error scenarios
- **Form Validation**: Test progressive validation and error guidance

### Performance
- **Parallel Execution**: Tests run independently and can be parallelized
- **Selective Mocking**: Only mock external dependencies, not internal logic
- **Fast Feedback**: Tests provide quick feedback on user-facing issues

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI (for debugging)
npm run test:e2e:ui

# Run specific test file
npx playwright test plant-registration.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Generate test report
npx playwright show-report
```

## Debugging E2E Tests

### Using Playwright Inspector
```bash
# Debug specific test
npx playwright test plant-registration.spec.ts --debug
```

### Test Screenshots and Videos
```typescript
// Automatic screenshots on failure (configured in playwright.config.ts)
test('failing test', async ({ page }) => {
  // If this test fails, screenshot will be captured automatically
  await expect(page.locator('[data-testid="nonexistent"]')).toBeVisible();
});
```

### Browser Developer Tools
```typescript
test('debug with browser tools', async ({ page }) => {
  // Pause execution to inspect in browser
  await page.pause();
  
  // Or use console logging
  await page.evaluate(() => console.log('Debug info'));
});
```

## Benefits Summary

### For Developers
- **Faster Development**: Tests catch user-facing issues early
- **Confident Refactoring**: Tests survive implementation changes
- **Clear Requirements**: Tests document expected user workflows
- **Reduced Debugging**: Test failures clearly indicate user impact

### For Product Quality
- **Real User Coverage**: Tests verify actual user experiences
- **Cross-Browser Testing**: Playwright tests across different browsers
- **Visual Regression Testing**: Screenshots catch UI regressions
- **Performance Insights**: Tests can verify page load and interaction performance

### For Maintenance
- **Less Brittle**: Tests don't break when implementation details change
- **Easier Updates**: Changes to tests reflect actual feature changes
- **Self-Documenting**: Test workflows document application capabilities
- **Focused Debugging**: Test failures indicate specific user workflow problems

This E2E testing approach provides comprehensive coverage of user workflows while being more maintainable and reliable than complex integration tests with extensive mocking.