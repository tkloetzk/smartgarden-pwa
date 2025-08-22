# Test Refactoring Guide

This guide shows how to transform mock-heavy, implementation-focused tests into maintainable, behavior-focused tests.

## The Transformation

### ❌ Before: Implementation Testing
```typescript
// Mock-heavy test (scheduledTaskService.test.ts)
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  // ... 20+ more mocks
}));

describe("createTask", () => {
  it("should call Firebase with correct parameters", async () => {
    await service.createTask(mockTask, userId);
    
    // Testing implementation details
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        plantId: mockTask.plantId,
        // ... specific Firebase document structure
      })
    );
  });
});
```

### ✅ After: Business Logic Testing
```typescript
// Behavior-focused test (scheduledTaskService.refactored.test.ts)
import { TaskBuilder } from "@/test-utils/testDataBuilders";

describe("Task Data Validation", () => {
  it("should create valid task data structure", () => {
    const task = TaskBuilder.neptunes()
      .forPlant("plant-123")
      .dueIn(7)
      .build();

    // Testing business rules and data structure
    expect(task.plantId).toBe("plant-123");
    expect(task.taskType).toBe("fertilize");
    expect(task.details.product).toContain("Neptune");
    expect(task.status).toBe("pending");
  });
});
```

## Key Improvements

### 1. Removed Implementation Coupling
**Before**: 50+ lines of Firebase mocking, brittle to API changes
**After**: Zero mocking, focuses on business logic

### 2. Test Data Builders
**Before**: Inline object creation, inconsistent test data
**After**: Fluent builders with domain-specific methods

### 3. Behavior vs Implementation
**Before**: `expect(mockService.method).toHaveBeenCalledWith(...)`
**After**: `expect(result.property).toBe(expectedValue)`

## Refactoring Steps

### Step 1: Identify Target Tests
Look for these patterns:
- Heavy `jest.mock()` usage
- Many `toHaveBeenCalledWith` assertions
- Firebase/database service mocking
- Implementation detail testing

### Step 2: Extract Business Logic
Ask: "What business rules is this test verifying?"
- Data validation
- Business calculations
- State transitions
- Domain rules

### Step 3: Use Test Data Builders
Replace inline object creation:
```typescript
// Before
const mockTask = {
  id: "task-1",
  plantId: "plant-1", 
  taskName: "Apply Neptune's Harvest",
  // ... 15 more properties
};

// After  
const task = TaskBuilder.neptunes().forPlant("plant-1").build();
```

### Step 4: Focus on Outcomes
```typescript
// Before: Testing implementation
expect(mockService.createTask).toHaveBeenCalledWith(specificArgs);

// After: Testing behavior
expect(createdTask.status).toBe("pending");
expect(createdTask.dueDate).toBeInstanceOf(Date);
```

## Test Data Builders Usage

### Basic Builders
```typescript
// Plants
const strawberry = PlantBuilder.strawberry().withAge(120).build();
const lettuce = PlantBuilder.lettuce().planted("2024-01-01").build();

// Tasks
const overdue = TaskBuilder.neptunes().overdue(7).build();
const upcoming = TaskBuilder.fertilizer930().dueIn(14).build();

// Activities  
const recentWatering = CareActivityBuilder.watering()
  .forPlant("plant-1")
  .onDate(DateHelpers.daysAgo(3))
  .build();
```

### Collections
```typescript
// Multiple plants at different ages
const plants = TestData.strawberryPlantsAtAges([30, 60, 120, 155]);

// Fertilization task schedule
const tasks = TestData.fertilizationTasksForPlant("plant-1", [-7, -3, 0, 7, 14]);

// Care history
const history = TestData.fertilizationHistory("plant-1", [7, 14, 21, 28]);
```

## Migration Priority

### Phase 1: High-Impact, Low-Risk
- Service layer business logic tests
- Utility function tests
- Data transformation tests

### Phase 2: Component Logic
- Extract business logic from component tests
- Focus on state management, not rendering

### Phase 3: Integration Tests  
- Keep critical user journey tests
- Convert component integration to E2E
- Remove infrastructure-heavy tests

## Benefits Achieved

### ✅ Maintainability
- Tests survive refactoring
- Less coupling to implementation
- Clear business rule documentation

### ✅ Performance
- Faster test execution (no mocking overhead)
- Simpler test setup/teardown
- Better test isolation

### ✅ Reliability
- Less test flakiness
- Fewer false negatives
- More meaningful failures

## Examples in Codebase

### Successfully Refactored
- `features/dashboard/dashboard.fertilizationNotifications.test.tsx`
- `features/fertilization/fertilizationTaskFlow.test.tsx`
- `features/strawberry/155DayStrawberryWorkflow.test.tsx`
- `services/firebase/plantService.taskGeneration.test.ts`

### Ready for Refactoring
- `services/firebase/scheduledTaskService.test.ts` (26 toHaveBeenCalledWith)
- `services/firebase/careActivityService.test.ts` (27 toHaveBeenCalledWith)
- `integration/careLogging.test.tsx` (20 toHaveBeenCalledWith)

## Next Steps

1. **Apply to remaining Firebase service tests**
2. **Extract business logic from component tests** 
3. **Create domain-specific test utilities**
4. **Document business rules through tests**
5. **Move UI testing to E2E layer**

The goal is tests that document business behavior clearly and survive implementation changes gracefully.