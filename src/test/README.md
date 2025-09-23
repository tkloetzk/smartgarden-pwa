# SmartGarden Test Utilities

This directory contains comprehensive testing utilities designed to reduce boilerplate and improve test consistency across the SmartGarden application.

## 📁 Directory Structure

```
src/test/
├── factories/           # Test data factories
│   └── plantFactory.ts  # Plant-related test data factories
├── utils/              # Testing utilities and helpers
│   ├── renderUtils.tsx # Custom render functions and providers
│   └── index.ts        # Main export for all test utilities
├── mocks/              # MSW mock handlers
│   ├── handlers.ts     # API mock handlers
│   └── server.ts       # MSW server setup
└── README.md           # This file
```

## 🏭 Test Data Factories

Test data factories provide consistent, realistic test data. Use these instead of manually creating test objects.

### Basic Usage

```typescript
import { PlantFactory, TestDataBuilder } from "@/test/utils";

// Create individual plants
const tomatoPlant = PlantFactory.tomato();
const lettucePlant = PlantFactory.lettuce();

// Create plants with custom properties
const maturePlant = PlantFactory.mature({
  name: "My Tomato Plant",
  container: "Large Pot"
});

// Create collections of plants
const multipleLettuceHeads = PlantFactory.createMany(4, {
  varietyName: "Butterhead Lettuce"
});

// Create complex scenarios
const gardenData = TestDataBuilder.simpleGarden();
// Returns: { bed, plants, activities, tasks }
```

### Available Factories

#### PlantFactory
- `PlantFactory.create(overrides)` - Basic plant with sensible defaults
- `PlantFactory.tomato(overrides)` - Cherry tomato plant
- `PlantFactory.lettuce(overrides)` - Butterhead lettuce
- `PlantFactory.basil(overrides)` - Sweet basil plant
- `PlantFactory.mature(overrides)` - 2-month-old plant
- `PlantFactory.newlyPlanted(overrides)` - 3-day-old plant
- `PlantFactory.withSection(section, overrides)` - Plant with specific section
- `PlantFactory.succession(waves, interval)` - Succession planting scenario
- `PlantFactory.createMany(count, overrides)` - Multiple plants

#### VarietyFactory
- `VarietyFactory.create(overrides)` - Basic variety
- `VarietyFactory.lettuce(overrides)` - Lettuce variety
- `VarietyFactory.tomato(overrides)` - Tomato variety

#### BedFactory
- `BedFactory.create(overrides)` - Basic raised bed
- `BedFactory.raisedBed(overrides)` - Cedar raised bed
- `BedFactory.container(overrides)` - Container/pot

#### CareActivityFactory
- `CareActivityFactory.create(plantId, overrides)` - Basic care activity
- `CareActivityFactory.watering(plantId, overrides)` - Watering activity
- `CareActivityFactory.fertilization(plantId, overrides)` - Fertilization activity
- `CareActivityFactory.observation(plantId, overrides)` - Observation activity
- `CareActivityFactory.harvest(plantId, overrides)` - Harvest activity

#### ScheduledTaskFactory
- `ScheduledTaskFactory.create(plantId, overrides)` - Basic scheduled task
- `ScheduledTaskFactory.watering(plantId, overrides)` - Watering task
- `ScheduledTaskFactory.fertilization(plantId, overrides)` - Fertilization task
- `ScheduledTaskFactory.overdue(plantId, overrides)` - Overdue task

#### TestDataBuilder
- `TestDataBuilder.simpleGarden()` - Complete garden with plants, beds, activities
- `TestDataBuilder.successionGarden()` - Succession planting scenario
- `TestDataBuilder.resetAllCounters()` - Reset all factory counters

## 🎨 Custom Render Functions

Custom render functions provide consistent test setup and reduce boilerplate code.

### Basic Usage

```typescript
import { renderWithProviders, screen, assertions } from "@/test/utils";

// Render with all providers (router + query client)
const { container } = renderWithProviders(<MyComponent />);

// Render with specific providers
renderWithRouter(<MyComponent />);
renderWithQueryClient(<MyComponent />);

// Smart render (automatically chooses providers)
renderSmart(<MyComponent />, {
  withRouter: true,
  withQueryClient: false
});
```

### Specialized Render Functions

```typescript
import { renderDashboard, renderForm, renderPlantDetail } from "@/test/utils";

// Render dashboard at root route
renderDashboard(<Dashboard />);

// Render form at /add-plant route
renderForm(<AddPlantForm />);

// Render plant detail page with specific plant ID
renderPlantDetail(<PlantDetailPage />, "plant-123");

// Render at custom route
renderInPage(<MyComponent />, "/custom/path");
```

### Setup Functions

```typescript
import { setupCompleteTest, setupComponentTest, setupFormTest } from "@/test/utils";

describe("My Component", () => {
  it("should work", () => {
    // Complete setup with data and providers
    const { render, mockUser, testData, queryClient } = setupCompleteTest();

    render(<MyComponent />);
    // Test implementation...
  });
});
```

## ✅ Assertion Helpers

Assertion helpers provide common patterns for cleaner test code.

### Basic Assertions

```typescript
import { assertions } from "@/test/utils";

// Assert element exists and is visible
const button = screen.getByRole("button");
assertions.isVisible(button);

// Assert text is present and visible
assertions.hasVisibleText("Welcome to SmartGarden");
assertions.hasVisibleText(/welcome.*/i);

// Assert form field has expected value
assertions.formFieldValue("Plant Name", "My Tomato");

// Assert button is clickable
const submitButton = assertions.clickableButton("Submit");

// Assert list has expected length
const { list, items } = assertions.listLength("list", 3);
```

### Test Patterns

```typescript
import { testPatterns } from "@/test/utils";

// Test basic component rendering
testPatterns.basicRendering(<MyComponent />, [
  "Expected Text 1",
  "Expected Text 2"
]);

// Test form interaction
await testPatterns.formInteraction(
  <MyForm />,
  "Plant Name",
  "Test Plant"
);

// Test navigation
await testPatterns.navigation(
  <MyComponent />,
  "Plants",
  "/plants"
);
```

## 🎭 Mock Data Management

### MSW Integration

```typescript
import { setMockData, clearMockData } from "@/test/utils";

beforeEach(() => {
  // Clear any existing mock data
  clearMockData();

  // Set up fresh test data
  const testData = TestDataBuilder.simpleGarden();
  setMockData({
    plants: testData.plants,
    careActivities: testData.activities,
    scheduledTasks: testData.tasks
  });
});
```

### User Authentication

```typescript
import { createMockUser, mockUser } from "@/test/utils";

// Use default mock user
const user = mockUser;

// Create custom mock user
const customUser = createMockUser({
  displayName: "Custom User",
  email: "custom@example.com"
});
```

## 📋 Best Practices

### 1. Use Factories for Test Data

**❌ Don't do this:**
```typescript
const plant = {
  id: "test-plant",
  varietyId: "variety-1",
  varietyName: "Tomato",
  name: "Test Plant",
  plantedDate: new Date("2024-01-01"),
  location: "Garden",
  container: "Pot",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

**✅ Do this:**
```typescript
const plant = PlantFactory.tomato({
  name: "Test Plant"
});
```

### 2. Use Custom Render Functions

**❌ Don't do this:**
```typescript
const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MyComponent />
      </MemoryRouter>
    </QueryClientProvider>
  );
};
```

**✅ Do this:**
```typescript
const { render } = setupComponentTest();
render(<MyComponent />);
```

### 3. Use Assertion Helpers

**❌ Don't do this:**
```typescript
const button = screen.getByRole("button", { name: "Submit" });
expect(button).toBeInTheDocument();
expect(button).toBeVisible();
expect(button).not.toBeDisabled();
```

**✅ Do this:**
```typescript
const button = assertions.clickableButton("Submit");
```

### 4. Reset Factory Counters for Predictable Tests

```typescript
describe("My Component", () => {
  beforeEach(() => {
    PlantFactory.resetCounter();
    // or
    TestDataBuilder.resetAllCounters();
  });

  it("should work with predictable data", () => {
    const plant1 = PlantFactory.create(); // Will have id "test-plant-1"
    const plant2 = PlantFactory.create(); // Will have id "test-plant-2"
  });
});
```

### 5. Use Setup Functions for Complex Tests

```typescript
describe("Dashboard", () => {
  it("should display plants correctly", () => {
    const { render, testData, mockUser } = setupDashboardTest();

    render(<Dashboard />);

    // testData contains: { bed, plants, activities, tasks }
    expect(screen.getByText(testData.plants[0].name)).toBeInTheDocument();
  });
});
```

## 🔧 Advanced Usage

### Custom Test Scenarios

```typescript
// Create custom test scenario
const createLargeGardenScenario = () => {
  const beds = [
    BedFactory.raisedBed({ name: "Bed 1" }),
    BedFactory.raisedBed({ name: "Bed 2" }),
    BedFactory.container({ name: "Container 1" })
  ];

  const plants = [
    ...PlantFactory.createMany(5, { container: "Bed 1" }),
    ...PlantFactory.createMany(3, { container: "Bed 2" }),
    ...PlantFactory.createMany(2, { container: "Container 1" })
  ];

  return { beds, plants };
};
```

### Custom Assertions

```typescript
// Extend assertion helpers
const customAssertions = {
  ...assertions,

  hasPlantCard: (plantName: string) => {
    const card = screen.getByTestId(`plant-card-${plantName}`);
    assertions.isVisible(card);
    return card;
  },

  hasSuccessToast: (message: string) => {
    const toast = screen.getByRole("alert");
    assertions.isVisible(toast);
    expect(toast).toHaveTextContent(message);
    return toast;
  }
};
```

### TypeScript Support

All utilities are fully typed with TypeScript. Use the exported types for custom implementations:

```typescript
import type { CustomRenderOptions } from "@/test/utils";

const myCustomRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  // Custom render implementation
};
```

## 🚀 Migration Guide

### From Manual Test Data

**Before:**
```typescript
const mockPlants = [
  {
    id: "plant-1",
    varietyName: "Tomato",
    // ... many more fields
  }
];
```

**After:**
```typescript
const mockPlants = [
  PlantFactory.tomato()
];
```

### From Manual Render Setup

**Before:**
```typescript
const renderDashboard = () => {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
};
```

**After:**
```typescript
import { renderDashboard } from "@/test/utils";
// renderDashboard is already available
```

### From Manual Assertions

**Before:**
```typescript
const title = await screen.findByTestId("title");
expect(title).toBeInTheDocument();
expect(title).toBeVisible();
```

**After:**
```typescript
const title = await screen.findByTestId("title");
assertions.isVisible(title);
```

This testing infrastructure provides a solid foundation for maintainable, consistent tests across the SmartGarden application.