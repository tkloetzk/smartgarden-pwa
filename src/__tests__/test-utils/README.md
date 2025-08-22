# Consolidated Test Utilities

This directory contains all test utilities, builders, and setup functions for the SmartGarden test suite. Use these instead of scattered utility imports.

## Quick Start

```typescript
import { renderComponent, PlantBuilder, createMockUser } from '@/__tests__/test-utils';

// Component testing
const { getByText } = renderComponent(<MyComponent />, {
  initialEntries: ['/plants'],
  withRouter: true
});

// Test data creation
const plant = PlantBuilder
  .strawberry()
  .withAge(155)
  .planted("2024-01-01")
  .inContainer("Greenhouse A")
  .build();

const user = createMockUser({ email: 'custom@test.com' });
```

## Files Structure

### 📁 `index.ts`
**Single import point for all utilities**
- Import everything from here: `import { ... } from '@/__tests__/test-utils'`
- Re-exports all utilities with consistent interface

### 📁 `setup.tsx` 
**Component rendering and test environment**
- `renderComponent()` - Unified rendering with router/React Query support
- `createTestQueryClient()` - Optimized QueryClient for tests
- Replaces all `renderWithRouter`, `renderWithProviders` patterns

### 📁 `factories.ts`
**Simple data creation functions**
- `createMockUser()`, `createMockPlant()`, `createMockVariety()`
- Quick factory functions with override support
- Use for simple test data needs

### 📁 `builders.ts`
**Fluent interface builders for complex scenarios**
- `PlantBuilder` - Complex plant creation with fluent interface
- `CareActivityBuilder` - Care activity creation with chaining
- `TaskBuilder` - Scheduled task creation
- Use for complex test scenarios requiring specific configurations

### 📁 `constants.ts`
**Centralized test constants**
- `TEST_DATES` - Standard dates for consistent testing
- `TEST_VARIETIES` - Common plant varieties
- `TEST_LOCATIONS` - Standard containers and locations

## Usage Guidelines

### ✅ **Do Use**
```typescript
// ✅ Single import from consolidated utilities
import { renderComponent, PlantBuilder, TEST_DATES } from '@/__tests__/test-utils';

// ✅ Use builders for complex scenarios
const maturePlant = PlantBuilder
  .strawberry()
  .withAge(155)
  .planted(TEST_DATES.STRAWBERRY_155_DAYS)
  .build();

// ✅ Use factories for simple cases
const user = createMockUser();
const plant = createMockPlant({ name: 'My Plant' });

// ✅ Consistent component rendering
const { getByText } = renderComponent(<Component />, {
  initialEntries: ['/plants/123'],
  withRouter: true
});
```

### ❌ **Don't Use**
```typescript
// ❌ Don't import from scattered locations
import { renderWithRouter } from '../utils/old-helpers';
import { createMockData } from '../utils/factories';

// ❌ Don't create custom rendering functions
const customRender = (ui) => render(ui, { wrapper: MyWrapper });

// ❌ Don't duplicate test data setup
const plant = {
  id: 'test-id',
  name: 'test plant',
  // ... lots of boilerplate
};
```

## Migration from Legacy Patterns

### Component Tests
```typescript
// Before
import { renderWithRouter } from '../utils/componentTestBuilders';
import { createMockPlant } from '../utils/testDataFactories';

// After  
import { renderComponent, createMockPlant } from '../test-utils';
```

### Business Logic Tests
```typescript
// Before
const plant = {
  id: 'plant-123',
  varietyName: 'Strawberry',
  plantedDate: new Date(Date.now() - 155 * 24 * 60 * 60 * 1000),
  // ... lots of setup
};

// After
import { PlantBuilder } from '../test-utils';
const plant = PlantBuilder.strawberry().withAge(155).build();
```

## Common Patterns

### Testing Component with Plants
```typescript
import { renderComponent, PlantBuilder } from '@/__tests__/test-utils';

test('displays plant information', () => {
  const plant = PlantBuilder
    .tomato()
    .withName('My Tomato')
    .planted('2024-01-01')
    .build();
    
  const { getByText } = renderComponent(
    <PlantCard plant={plant} />,
    { withRouter: true }
  );
  
  expect(getByText('My Tomato')).toBeInTheDocument();
});
```

### Testing Care Activities  
```typescript
import { CareActivityBuilder, TEST_DATES } from '@/__tests__/test-utils';

test('processes watering activity', () => {
  const activity = CareActivityBuilder
    .watering()
    .forPlant('plant-123')
    .on(TEST_DATES.ACTIVITY_DEFAULT)
    .withAmount(250, 'ml')
    .build();
    
  expect(processActivity(activity)).toEqual(expectedResult);
});
```

### Testing Task Generation
```typescript
import { TaskBuilder } from '@/__tests__/test-utils';

test('creates fertilization tasks', () => {
  const task = TaskBuilder
    .fertilization()
    .forPlant('plant-123')
    .dueIn(7)
    .fromStage('vegetative')
    .build();
    
  expect(task.dueDate).toBeInstanceOf(Date);
  expect(task.status).toBe('pending');
});
```

## Benefits

1. **Single Import Point** - One place to import all test utilities
2. **Consistent Patterns** - Standardized across all test files  
3. **Type Safety** - Full TypeScript support with proper types
4. **Readable Tests** - Fluent builders make test intent clear
5. **Maintainable** - Centralized utilities reduce duplication
6. **Fast Tests** - Optimized QueryClient and rendering setup