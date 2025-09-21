# E2E Testing with Playwright

This directory contains end-to-end tests for the SmartGarden PWA using Playwright.

## Getting Started

### Prerequisites

1. Ensure you have all dependencies installed:

   ```bash
   npm install
   ```

2. Install Playwright browsers (if not already done):
   ```bash
   npx playwright install
   ```

### Running Tests

1. **Start the development server** (required):

   ```bash
   npm run dev
   ```

2. **Run E2E tests** in another terminal:

   ```bash
   # Run all E2E tests
   npm run test:e2e

   # Run tests with UI
   npm run test:e2e:ui

   # Run specific test file
   npx playwright test dashboard.spec.ts

   # Run tests in headed mode (see browser)
   npx playwright test --headed

   # Run tests in debug mode
   npx playwright test --debug
   ```

## Test Structure

### Current Tests

- **dashboard.spec.ts**: Basic smoke tests for the dashboard page
  - Verifies page loads successfully
  - Checks for proper authentication flow
  - Tests responsive design
  - Validates basic accessibility
  - Monitors console errors

### Test Utilities

- **helpers/test-utils.ts**: Common utilities and fixtures

  - `waitForAppLoad()`: Wait for React app to fully load
  - `isOnAuthPage()`: Check if on authentication page
  - `isOnDashboard()`: Check if on dashboard page
  - `checkBasicAccessibility()`: Basic a11y validation

- **helpers/global-setup.ts**: Global test setup
  - Verifies dev server is running
  - Sets up test environment

## Writing New Tests

### Best Practices

1. **Use test utilities** for common operations
2. **Be explicit about waits** - use proper timeouts and conditions
3. **Test user journeys** rather than implementation details
4. **Use data-testid attributes** for reliable element selection
5. **Test across different viewports** for responsive behavior

### Example Test Structure

```typescript
import { test, expect, testUtils } from "./helpers/test-utils";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/feature-path");
    await testUtils.waitForAppLoad(page);
  });

  test("should do something", async ({ page }) => {
    // Arrange
    const element = page.locator('[data-testid="my-element"]');

    // Act
    await element.click();

    // Assert
    await expect(element).toHaveText("Expected Text");
  });
});
```

## Debugging Tests

### Visual Debugging

```bash
# Run with browser UI
npx playwright test --headed

# Debug specific test
npx playwright test --debug dashboard.spec.ts

# Generate and view test report
npx playwright show-report
```

### Screenshots and Videos

- Screenshots are automatically taken on test failures
- Videos are recorded for failed tests
- Files are saved in `test-results/` directory

### Trace Viewer

```bash
# Generate traces (already enabled on retry)
npx playwright test --trace on

# View traces
npx playwright show-trace trace.zip
```

## Configuration

The main configuration is in `playwright.config.ts`:

- **Test directory**: `./tests/e2e`
- **Base URL**: `http://localhost:5173`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel execution**: Enabled (except on CI)
- **Retries**: 2 retries on CI only

## Environment Variables

The tests run with mock Firebase configuration:

- `VITE_TEST_MODE=true`
- Mock Firebase credentials (see `playwright.config.ts`)

## Troubleshooting

### Common Issues

1. **Dev server not running**:

   ```
   Error: Dev server not responding at http://localhost:5173
   ```

   Solution: Start dev server with `npm run dev`

2. **Port conflicts**:

   - Change port in `vite.config.ts` and `playwright.config.ts`

3. **Firebase connection errors**:

   - Normal in test mode, tests account for this

4. **Timeout errors**:
   - Increase timeouts in test utilities
   - Check if app is loading properly

### Getting Help

- Check the [Playwright documentation](https://playwright.dev/docs/intro)
- Review existing tests for patterns
- Use debug mode to step through tests
- Check browser console for errors during test runs
