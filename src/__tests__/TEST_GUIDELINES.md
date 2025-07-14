# Test Guidelines - SmartGarden App

This document outlines the standardized testing patterns for the SmartGarden application. Follow these guidelines to ensure consistent, maintainable tests.

## 🎯 Quick Start

For new tests, always use:
```typescript
import { renderComponent, TestScenarios, useTestLifecycle } from "../utils/testSetup";
import { testMocks, setupComponentTest } from "../utils/mockServices";
```

## 📁 File Structure

```
src/__tests__/
├── utils/
│   ├── testSetup.ts          # ✅ USE: Unified rendering & scenarios
│   ├── testDataFactories.ts  # ✅ USE: Mock data creation
│   ├── mockServices.ts       # ✅ USE: Service mocking
│   ├── testHelpers.tsx       # ❌ DEPRECATED: Legacy utilities
│   └── serviceMockHelpers.ts # ❌ DEPRECATED: Old service mocks
├── components/               # Component tests
├── integration/              # Integration tests
├── examples/                 # Example test patterns
└── TEST_GUIDELINES.md        # This file
```

## 🏗️ Test Structure

### Standard Test Template

```typescript
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { 
  renderComponent, 
  TestScenarios, 
  useTestLifecycle 
} from "../utils/testSetup";
import { testMocks, setupComponentTest } from "../utils/mockServices";
import { YourComponent } from "@/components/YourComponent";

// Mock hooks at module level
jest.mock("@/hooks/useFirebaseAuth");
jest.mock("@/hooks/useFirebasePlants");

describe("YourComponent", () => {
  useTestLifecycle(); // Standard setup/teardown

  beforeEach(() => {
    setupComponentTest();
  });

  afterEach(() => {
    testMocks.reset();
  });

  // Your tests here...
});
```

## 🎭 Mock Patterns

### ✅ DO: Use Unified Scenarios

```typescript
// Pre-configured scenarios
TestScenarios.authenticatedUserWithPlants();
TestScenarios.unauthenticatedUser();
TestScenarios.loadingStates();
TestScenarios.errorStates("Custom error message");
TestScenarios.emptyStates();
```

### ✅ DO: Use Custom Scenarios

```typescript
testMocks.configureScenario({
  user: createMockFirebaseUser(),
  plants: [createMockPlant({ name: "Test Plant" })],
  loading: false,
  error: null,
});
```

### ❌ DON'T: Mix Mock Patterns

```typescript
// Don't do this in the same test file
jest.mock("@/hooks/useFirebasePlants");
const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
// ... manual mock setup
```

## 🎨 Rendering Patterns

### ✅ DO: Use Unified Rendering

```typescript
// Standard rendering with router and providers
renderComponent(<YourComponent />);

// Custom router configuration
renderComponent(<YourComponent />, {
  initialEntries: ["/custom-route"],
  routerType: 'memory',
});

// Without router (for isolated testing)
renderComponent(<YourComponent />, {
  withRouter: false,
});
```

### ❌ DON'T: Create Custom Wrappers

```typescript
// Don't create custom render functions
const renderWithCustomWrapper = (ui) => {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        {ui}
      </QueryClientProvider>
    </MemoryRouter>
  );
};
```

## 🏭 Data Factory Patterns

### ✅ DO: Use Standardized Factories

```typescript
import { 
  createMockPlant, 
  createMockVariety, 
  createMockUser,
  createMockPlantWithVariety 
} from "../utils/testSetup";

// Use real varieties for realistic tests
const basil = createMockPlantWithVariety("Greek Dwarf Basil");

// Use factories with overrides
const plant = createMockPlant({
  name: "Custom Plant Name",
  plantedDate: new Date('2024-01-01'),
});
```

### ❌ DON'T: Create Inline Mock Data

```typescript
// Don't create mock data inline
const mockPlant = {
  id: 'test-id',
  name: 'Test Plant',
  // ... lots of boilerplate
};
```

## 🗄️ Database Patterns

### ✅ DO: Use Unified Database Utilities

```typescript
import { setupTestEnvironment, clearTestDatabase } from "../utils/testSetup";

// For tests that need seeded data
beforeEach(async () => {
  await setupTestEnvironment();
});

// For tests that need clean database
beforeEach(async () => {
  await clearTestDatabase();
});
```

### ✅ DO: Use Test Lifecycle Helper

```typescript
// Automatic setup/teardown
useTestLifecycle();
```

## 🎪 Test Categories

### Component Tests
- Focus on component behavior
- Use `TestScenarios` for state management
- Test user interactions with `userEvent`
- Verify UI changes with `screen` queries

### Integration Tests
- Test component interactions
- Use `setupTestEnvironment()` for data
- Test complete user workflows
- Verify service integrations

### Hook Tests
- Test custom hook behavior
- Use `renderHook` from React Testing Library
- Mock dependencies consistently
- Test loading, error, and success states

## 📋 Common Patterns

### Testing Loading States

```typescript
it("shows loading state", () => {
  TestScenarios.loadingStates();
  renderComponent(<YourComponent />);
  expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
});
```

### Testing Error States

```typescript
it("handles network errors", () => {
  testMocks.configureErrorScenario('network', 'Connection failed');
  renderComponent(<YourComponent />);
  expect(screen.getByText(/network error/i)).toBeInTheDocument();
});
```

### Testing User Interactions

```typescript
it("handles user interactions", async () => {
  TestScenarios.authenticatedUserWithPlants();
  const user = userEvent.setup();
  
  renderComponent(<YourComponent />);
  
  const button = screen.getByRole("button", { name: /click me/i });
  await user.click(button);
  
  expect(screen.getByText(/button clicked/i)).toBeInTheDocument();
});
```

### Testing Navigation

```typescript
it("navigates to correct route", async () => {
  const { mockNavigate } = setupComponentTest();
  const user = userEvent.setup();
  
  renderComponent(<YourComponent />);
  
  const link = screen.getByRole("link", { name: /go somewhere/i });
  await user.click(link);
  
  expect(mockNavigate).toHaveBeenCalledWith("/expected-route");
});
```

### Testing Forms

```typescript
it("submits form with valid data", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  
  renderComponent(<YourForm onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText(/name/i), "Test Name");
  await user.click(screen.getByRole("button", { name: /submit/i }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    name: "Test Name",
  });
});
```

## 🚫 Anti-Patterns

### ❌ Don't Mix Mock Approaches
```typescript
// Don't mix global mocks with local mocks
jest.mock("@/hooks/useFirebasePlants");
// ... later in the same file
mockUseFirebasePlants.mockImplementation(() => ({ ... }));
```

### ❌ Don't Create Duplicate Factories
```typescript
// Don't create component-specific factories
const createComponentSpecificMockPlant = () => { ... };
```

### ❌ Don't Skip Test Lifecycle
```typescript
// Don't manually manage setup/teardown
beforeEach(() => {
  // Manual mock setup
});
afterEach(() => {
  // Manual cleanup
});
```

### ❌ Don't Test Implementation Details
```typescript
// Don't test internal state or private methods
expect(component.state.internalValue).toBe(true);
```

## 📖 Migration Guide

### Migrating Existing Tests

1. **Replace rendering utilities:**
   ```typescript
   // Old
   import { renderWithProviders } from "../utils/testHelpers";
   
   // New
   import { renderComponent } from "../utils/testSetup";
   ```

2. **Replace mock setup:**
   ```typescript
   // Old
   jest.mock("@/hooks/useFirebasePlants");
   const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
   mockUseFirebasePlants.mockReturnValue({ ... });
   
   // New
   TestScenarios.authenticatedUserWithPlants();
   ```

3. **Replace data factories:**
   ```typescript
   // Old
   import { createMockPlant } from "../utils/serviceMockHelpers";
   
   // New
   import { createMockPlant } from "../utils/testSetup";
   ```

4. **Add lifecycle management:**
   ```typescript
   // Add this to the describe block
   useTestLifecycle();
   ```

## 🔍 Debugging Tests

### Common Issues

1. **Mock not working:** Check if hooks are mocked at module level
2. **Data not appearing:** Verify TestScenarios configuration
3. **Router errors:** Ensure component needs router or disable with `withRouter: false`
4. **Async issues:** Use `waitFor` for async operations

### Debug Utilities

```typescript
// View current mock configuration
console.log(testMocks.getCurrentConfig());

// Debug component tree
screen.debug();

// View queries
screen.logTestingPlaygroundURL();
```

## 📚 Resources

- [Testing Library Docs](https://testing-library.com/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [User Event API](https://testing-library.com/docs/user-event/intro/)
- [Example Test File](./examples/unifiedTestExample.test.tsx)

## ✅ Checklist for New Tests

- [ ] Uses `renderComponent` for rendering
- [ ] Uses `TestScenarios` or `testMocks.configureScenario` for state
- [ ] Uses `useTestLifecycle` for setup/teardown
- [ ] Imports factories from `testSetup.ts`
- [ ] Tests user behavior, not implementation details
- [ ] Uses semantic queries (`getByRole`, `getByLabelText`, etc.)
- [ ] Includes loading, error, and success states
- [ ] Has meaningful test names and descriptions