# Component Test Separation Guide

This guide demonstrates how to separate business logic from UI concerns in component tests for better maintainability and focused testing.

## The Problem with Mixed Component Tests

Traditional component tests often mix business logic validation with UI interaction testing:

```typescript
// ❌ PROBLEMATIC: Mixed concerns in one test
it("should calculate fertilization amounts correctly and display them", async () => {
  render(<BulkActivityModal selectedPlants={plants} />);
  
  // Business logic testing mixed with UI
  await user.click(screen.getByText("Fertilize"));
  await user.type(screen.getByLabelText("Product"), "Neptune's Harvest");
  
  // Complex calculations tested through UI
  expect(screen.getByText("2 quarts per plant")).toBeInTheDocument();
  
  // More business logic through UI interactions...
});
```

**Problems:**
- Slow execution (DOM rendering for logic tests)
- Brittle (UI changes break business logic tests)
- Mixed concerns (hard to understand what's being tested)
- Complex mocking (need to mock UI dependencies for logic tests)

## The Separation Solution

Split component tests into two focused files:

### 1. Business Logic Tests (`*.businessLogic.test.tsx`)
Tests the **data processing, calculations, and business rules** without UI rendering.

### 2. UI Interaction Tests (`*.ui.test.tsx`)
Tests the **component rendering, user interactions, and accessibility** without complex business logic.

## Implementation Pattern

### File Structure
```
components/
  BulkActivityModal.tsx                    # The component
__tests__/components/
  BulkActivityModal.businessLogic.test.tsx # Business logic tests
  BulkActivityModal.ui.test.tsx           # UI interaction tests
```

### Business Logic Test Example

```typescript
// ✅ GOOD: Pure business logic testing
describe("Bulk Activity Modal - Business Logic", () => {
  describe("Plant Selection Logic", () => {
    it("should filter selectable plants correctly", () => {
      const plants = [
        PlantBuilder.strawberry().build(),
        PlantBuilder.lettuce().inactive().build(), // Inactive
        PlantBuilder.raspberry().build(),
      ];

      // Pure business logic - no rendering
      const selectablePlants = plants.filter(plant => plant.isActive);
      
      expect(selectablePlants).toHaveLength(2);
      expect(selectablePlants.map(p => p.id)).toEqual(["plant-1", "plant-3"]);
    });
  });

  describe("Bulk Activity Generation", () => {
    it("should generate activities for all selected plants", () => {
      const plants = TestData.strawberryPlantsAtAges([90, 120, 155]);
      const selectedPlantIds = plants.map(p => p.id);
      
      const bulkActivities = selectedPlantIds.map(plantId => 
        CareActivityBuilder.fertilization()
          .forPlant(plantId)
          .withProduct("Neptune's Harvest")
          .build()
      );

      // Test business logic directly
      expect(bulkActivities).toHaveLength(3);
      bulkActivities.forEach(activity => {
        expect(activity.activityType).toBe("fertilize");
        expect(activity.details.product).toBe("Neptune's Harvest");
      });
    });
  });
});
```

### UI Interaction Test Example

```typescript
// ✅ GOOD: Focused UI testing
describe("BulkActivityModal - UI Interactions", () => {
  describe("Activity Type Selection", () => {
    it("should switch to fertilization view when selected", async () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          selectedPlants={["plant-1", "plant-2"]}
        />
      );

      // Focus on UI behavior
      const fertilizeTab = screen.getByText(/🌱.*Fertilize/i);
      await user.click(fertilizeTab);

      expect(screen.getByText("🌱 Fertilize Plant")).toBeInTheDocument();
      expect(screen.getByLabelText("Fertilizer Product")).toBeInTheDocument();
    });
  });

  describe("Form Validation UI", () => {
    it("should disable submit button when required fields are empty", async () => {
      render(<BulkActivityModal {...props} />);

      const submitButton = screen.getByRole("button", { name: /Submit/i });
      
      // Test UI state, not business calculation
      expect(submitButton).toBeDisabled();
    });
  });
});
```

## Key Principles

### Business Logic Tests Should:
- **✅ Test data transformations and calculations**
- **✅ Validate business rules and constraints**
- **✅ Test error handling and edge cases**
- **✅ Use test data builders for consistency**
- **✅ Run fast (no DOM operations)**

### Business Logic Tests Should NOT:
- **❌ Render components**
- **❌ Test user interactions**
- **❌ Test visual appearance**
- **❌ Mock complex UI dependencies**

### UI Tests Should:
- **✅ Test component rendering**
- **✅ Test user interaction flows**
- **✅ Test form behavior and validation**
- **✅ Test accessibility features**
- **✅ Test loading and error states**

### UI Tests Should NOT:
- **❌ Test complex business calculations**
- **❌ Test data processing logic**
- **❌ Duplicate business logic validation**
- **❌ Test implementation details**

## Test Data Builders for Components

Use the component-specific builders for consistent test data:

```typescript
// Component-specific test data
const modalTestData = BulkActivityModalBuilder
  .withTwoTomatoPlants()
  .forFertilization()
  .build();

// Reusable across both test types
const { plants, selectedPlants, expectedActivities } = modalTestData;
```

## Benefits Achieved

### ✅ **Performance**
- Business logic tests run 10x faster (no DOM operations)
- UI tests focus on interactions, not calculations

### ✅ **Maintainability**
- Business logic tests survive UI refactoring
- UI tests survive business logic changes
- Clear separation of concerns

### ✅ **Reliability**
- Less brittle tests (focused scope)
- Better error messages (specific to concern)
- Easier debugging (isolated concerns)

### ✅ **Coverage**
- Better business logic coverage (no UI complexity)
- Better UI coverage (no calculation complexity)
- Complementary, not overlapping

## Migration Strategy

### Phase 1: Identify Candidates
Look for component tests with:
- Complex business calculations
- Data processing logic
- Mixed UI + logic assertions
- Heavy mocking for non-UI concerns

### Phase 2: Extract Business Logic
1. Create `*.businessLogic.test.tsx`
2. Move data processing tests
3. Use test builders instead of component rendering
4. Focus on pure functions and logic

### Phase 3: Simplify UI Tests
1. Keep existing `*.test.tsx` for UI
2. Remove business logic assertions
3. Focus on user interactions
4. Simplify mocking (UI concerns only)

### Phase 4: Optimize
1. Remove duplicate coverage
2. Ensure complementary testing
3. Document component contracts
4. Add accessibility testing

## Examples in Codebase

### Successfully Separated
- **BulkActivityModal**: 14 business logic tests + UI interaction tests
- **Business logic**: Plant filtering, activity generation, validation
- **UI interactions**: Modal behavior, form interactions, accessibility

### Ready for Separation
- **PlantInfoCard**: Plant display logic + card interactions  
- **CareLogForm**: Activity validation + form behavior
- **Dashboard**: Task filtering logic + dashboard UI
- **PlantRegistrationForm**: Plant data validation + form workflow

## Best Practices

### 1. Use Descriptive File Names
- `Component.businessLogic.test.tsx` - Clear intent
- `Component.ui.test.tsx` - Focused scope
- `Component.integration.test.tsx` - End-to-end flows (if needed)

### 2. Share Test Data Builders
```typescript
// Both files can use same builders
const testData = PlantInfoCardBuilder.strawberry().withAge(120).build();
```

### 3. Document Test Boundaries
```typescript
/**
 * BUSINESS LOGIC TESTS - Focus: Data processing and validation
 * UI TESTS are in PlantInfoCard.ui.test.tsx
 */
```

### 4. Avoid Duplication
- Don't test the same business rule in both files
- Business logic = data and calculations
- UI logic = interactions and display

### 5. Use Appropriate Tools
- Business logic: Pure assertions, test builders
- UI: render(), screen, userEvent, accessibility testing

## Measuring Success

### Before Separation (Example)
- 1 test file with 25 tests
- 15 seconds execution time
- Complex mocking setup
- Mixed concerns in assertions

### After Separation
- 2 focused test files
- Business logic: 14 tests, 0.4 seconds
- UI interactions: 11 tests, 2 seconds  
- Clear test intent and faster feedback

The separation approach leads to more maintainable, faster, and focused tests that provide better coverage of both business logic and user experience.