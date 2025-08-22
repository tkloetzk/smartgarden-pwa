# E2E vs Component Testing Boundaries

Clear guidelines for what to test at each layer to avoid duplication and ensure comprehensive coverage.

## Testing Layer Responsibilities

### 🎭 **E2E Tests** (`tests/e2e/`)
**What they test:** Complete user workflows and system integration

#### ✅ **E2E SHOULD Test:**
- **Complete user journeys** from start to finish
- **Cross-component integration** (form → API → database → UI)
- **Navigation flows** between pages
- **Authentication and authorization** workflows
- **Data persistence** across page reloads
- **Error handling** from external systems (API failures)
- **Browser-specific behavior** (file uploads, local storage)
- **Critical business workflows** that provide user value

#### ❌ **E2E Should NOT Test:**
- Internal component state management
- Unit-level business logic calculations
- Component prop variations
- Detailed form validation logic
- UI component edge cases
- Performance of individual functions

### 🧩 **Component Tests** (`src/__tests__/components/`)
**What they test:** Component behavior and user interface interactions

#### ✅ **Component Tests SHOULD Test:**
- **Component rendering** with different props
- **User interactions** (clicks, typing, selections)
- **Form behavior** and client-side validation
- **Component state management** 
- **Event handling** and callbacks
- **Conditional rendering** based on props
- **Accessibility features** (ARIA labels, keyboard navigation)
- **Component contract** (props in, events out)

#### ❌ **Component Tests Should NOT Test:**
- External API integration
- Database operations
- Complex business calculations
- Cross-component workflows
- Authentication flows
- Full page navigation

### ⚙️ **Business Logic Tests** (`src/__tests__/**/*.businessLogic.test.*`)
**What they test:** Pure business rules and calculations

#### ✅ **Business Logic SHOULD Test:**
- **Data transformations** and calculations
- **Validation rules** and constraints
- **Algorithm correctness** and edge cases
- **Business rule enforcement**
- **Data structure validation**
- **Error handling for business scenarios**

#### ❌ **Business Logic Should NOT Test:**
- UI rendering or interactions
- External system integration
- Component lifecycle methods

## Practical Examples

### Example 1: Care Activity Logging

#### 🎭 **E2E Test** - Complete Workflow
```typescript
test('User logs fertilization with smart defaults', async ({ page }) => {
  // Given: User has a strawberry plant
  await page.goto('/log-care/plant-123');
  
  // When: User selects fertilization and uses smart suggestion
  await page.selectOption('[data-testid="activity-type"]', 'fertilize');
  await page.click('[data-testid="use-smart-suggestion"]');
  await page.click('[data-testid="submit-activity"]');
  
  // Then: Activity is saved and user sees success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  await expect(page).toHaveURL('/plants/plant-123');
  
  // And: Activity appears in plant history (persistence verified)
  await expect(page.locator('[data-testid="recent-fertilization"]')).toBeVisible();
});
```

#### 🧩 **Component Test** - Form Behavior
```typescript
test('CareLogForm populates fields when smart suggestion is used', async () => {
  const suggestions = [{ type: 'fertilize', product: 'Neptune\'s Harvest' }];
  
  render(<CareLogForm smartSuggestions={suggestions} onSubmit={jest.fn()} />);
  
  await user.click(screen.getByRole('button', { name: /Use Suggestion/ }));
  
  expect(screen.getByDisplayValue('Neptune\'s Harvest')).toBeInTheDocument();
});
```

#### ⚙️ **Business Logic Test** - Smart Defaults Calculation
```typescript
test('should calculate appropriate fertilizer for strawberry in ongoing production', () => {
  const suggestion = smartDefaultsService.getFertilizerSuggestion({
    varietyId: 'strawberry-albion',
    plantAge: 155,
    lastFertilization: daysAgo(7),
    currentStage: 'ongoingProduction'
  });
  
  expect(suggestion.product).toBe('Neptune\'s Harvest');
  expect(suggestion.dilution).toBe('1 tbsp/gallon');
  expect(suggestion.confidence).toBe('high');
});
```

### Example 2: Plant Reminder Settings

#### 🎭 **E2E Test** - Settings Persistence
```typescript
test('User changes reminder settings and they persist', async ({ page }) => {
  await page.goto('/plants/plant-123');
  
  // Change settings
  await page.click('[data-testid="reminder-settings"]');
  await page.check('[data-testid="reminder-fertilizing"]');
  await page.click('[data-testid="save-settings"]');
  
  // Verify persistence by reloading
  await page.reload();
  await page.click('[data-testid="reminder-settings"]');
  
  await expect(page.locator('[data-testid="reminder-fertilizing"]')).toBeChecked();
});
```

#### 🧩 **Component Test** - Settings UI Behavior
```typescript
test('ReminderSettings toggles checkboxes and calls onChange', async () => {
  const onChange = jest.fn();
  const preferences = { watering: true, fertilizing: false };
  
  render(<ReminderSettings preferences={preferences} onChange={onChange} />);
  
  await user.click(screen.getByLabelText('Fertilizing'));
  
  expect(onChange).toHaveBeenCalledWith({ watering: true, fertilizing: true });
});
```

#### ⚙️ **Business Logic Test** - Reminder Calculation
```typescript
test('should generate reminders only for enabled types', () => {
  const preferences = { watering: true, fertilizing: false, observation: true };
  const upcomingTasks = [
    { taskType: 'water', dueDate: tomorrow },
    { taskType: 'fertilize', dueDate: tomorrow },
    { taskType: 'observe', dueDate: tomorrow }
  ];
  
  const activeReminders = generateReminders(upcomingTasks, preferences);
  
  expect(activeReminders).toHaveLength(2);
  expect(activeReminders.map(r => r.taskType)).toEqual(['water', 'observe']);
});
```

## Migration Strategy

### Phase 1: Identify Test Categories
For each existing test file, ask:
1. **Is this testing a complete user workflow?** → Move to E2E
2. **Is this testing component behavior?** → Keep as Component test
3. **Is this testing calculations/business logic?** → Extract to Business Logic test

### Phase 2: Apply the Boundaries

#### Integration Tests to Migrate:

**`smartDefaultsIntegration.test.tsx`**
- **E2E**: Complete care logging workflow with smart defaults
- **Component**: CareLogForm behavior and suggestion display
- **Business Logic**: Smart defaults calculation algorithms

**`plantDetailReminderSettings.test.tsx`**
- **E2E**: Plant settings persistence and navigation
- **Component**: Settings form behavior
- **Business Logic**: Reminder generation rules

**`taskGrouping.test.tsx`**
- **E2E**: Dashboard task management workflow
- **Component**: Task display components
- **Business Logic**: Task grouping and filtering algorithms

### Phase 3: Test File Organization

```
tests/
├── e2e/                              # User workflows
│   ├── care-logging.spec.ts          # Complete care logging journeys
│   ├── plant-management.spec.ts      # Plant CRUD and settings
│   ├── task-management.spec.ts       # Dashboard task workflows
│   └── bulk-operations.spec.ts       # Multi-plant operations
│
src/__tests__/
├── components/                       # Component behavior
│   ├── CareLogForm.test.tsx         # Form interactions
│   ├── PlantDetail.test.tsx         # Plant display behavior
│   ├── TaskCard.test.tsx            # Individual task behavior
│   └── BulkActivityModal.ui.test.tsx # Modal interactions
│
├── businessLogic/                    # Pure business logic
│   ├── smartDefaults.test.ts        # Suggestion calculations
│   ├── taskGrouping.test.ts         # Grouping algorithms  
│   ├── reminderGeneration.test.ts   # Reminder logic
│   └── plantValidation.test.ts      # Plant data rules
│
└── integration/                      # Keep only when necessary
    └── complexDataFlow.test.tsx      # Only for complex data flows
```

## Decision Framework

When writing a new test, ask these questions:

### 🎭 **Write an E2E test if:**
- **User story**: "As a user, I want to..."
- **Cross-page navigation** is involved
- **Data persistence** needs verification
- **External systems** (APIs, databases) are involved
- **Authentication** is required
- **Critical business value** would be lost if this breaks

### 🧩 **Write a Component test if:**
- **Component behavior**: "When user clicks X, Y should happen"
- **Props and state**: "When prop A changes, UI should show B"
- **User interactions**: "When user types in field..."
- **Accessibility**: "Screen reader should announce..."
- **Form validation**: "Error should show when..."

### ⚙️ **Write a Business Logic test if:**
- **Pure functions**: "Given input X, function should return Y"
- **Calculations**: "Algorithm should compute correct result"
- **Validation rules**: "Data should be valid/invalid when..."
- **Edge cases**: "When unusual data is provided..."
- **Performance**: "Function should handle large datasets"

## Benefits of Clear Boundaries

### ✅ **Faster Feedback**
- Component tests run in milliseconds
- Business logic tests have no setup overhead
- E2E tests run only for critical flows

### ✅ **Better Maintainability**  
- Each test type has focused responsibility
- Changes affect minimal test files
- Clear intent makes debugging easier

### ✅ **Comprehensive Coverage**
- No gaps between testing layers
- No redundant testing across layers
- Each layer tests what it does best

### ✅ **Efficient Test Suite**
- Fast unit tests for quick feedback
- Focused component tests for UI behavior
- Strategic E2E tests for user confidence

## Success Metrics

### Before Clear Boundaries
```
❌ Mixed Concerns:
- 15 integration tests (5-10 seconds each)
- Complex mocking in component tests
- Business logic tested through UI
- Redundant coverage across layers
Total: ~2 minutes test time
```

### After Clear Boundaries
```
✅ Focused Testing:
- 5 E2E tests (critical workflows only)
- 20 fast component tests (<100ms each)
- 15 business logic tests (<50ms each)  
- Clear responsibility boundaries
Total: Component/Logic ~3 seconds, E2E as needed
```

This separation creates a maintainable, fast, and comprehensive test suite that provides confidence at each layer without redundancy or coupling.