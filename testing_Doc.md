# Comprehensive React/TypeScript Testing Standards for AI Coding Assistants (2025)

## Core Testing Philosophy for AI Agents

**Primary Directive**: Always test user-observable behavior, never implementation details but make sure you're not testing mock behavior. Focus on what users see, interact with, and experience. Generate tests that provide confidence while remaining maintainable and readable.

**TypeScript-First Approach**: Leverage TypeScript's type system for test safety, better IDE support, and self-documenting test code. Every test should be properly typed to catch errors early and improve maintainability.

**Modern Stack Alignment**: Embrace 2025 standards with Vitest's lightning-fast execution, Storybook 9's enhanced testing capabilities, and MSW 2.0's improved developer experience.

## Testing Framework Integration Patterns

### React Testing Library with TypeScript Best Practices

**Modern User Event Setup (2025 Standard)**

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ Always use userEvent.setup() for optimal interactions
test("modern user interaction pattern", async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText(/email/i), "user@example.com");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });
});
```

**TypeScript-Safe Component Testing**

```typescript
interface ButtonProps {
  variant: "primary" | "secondary";
  size: "sm" | "md" | "lg";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

const renderButton = (props: Partial<ButtonProps> = {}) => {
  const defaultProps: ButtonProps = {
    variant: "primary",
    size: "md",
    children: "Click me",
  };
  return render(<Button {...defaultProps} {...props} />);
};

// Test with proper typing enforcement
test("handles click events with type safety", async () => {
  const handleClick = vi.fn<[MouseEvent<HTMLButtonElement>], void>();
  renderButton({ onClick: handleClick });

  await user.click(screen.getByRole("button"));
  expect(handleClick).toHaveBeenCalledWith(
    expect.objectContaining({ type: "click" })
  );
});
```

### Vitest Configuration for Maximum Performance

**Production-Ready Setup**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],

    // Performance optimizations
    pool: "threads",
    poolOptions: {
      threads: { maxThreads: 4, minThreads: 1 },
    },

    // Coverage with meaningful thresholds
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

### MSW 2.0 Handler Patterns

**Modern API Mocking with TypeScript**

```typescript
// handlers.ts
import { http, HttpResponse } from "msw";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ApiResponse<T> {
  data: T;
  status: "success" | "error";
  message?: string;
}

export const handlers = [
  http.get<never, never, ApiResponse<User[]>>("/api/users", () => {
    return HttpResponse.json({
      data: [
        { id: "1", name: "John Doe", email: "john@example.com" },
        { id: "2", name: "Jane Smith", email: "jane@example.com" },
      ],
      status: "success",
    });
  }),

  // Error scenario handler
  http.get("/api/users/error", () => {
    return HttpResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }),
];
```

## Advanced Testing Strategies

### Performance Testing with Vitest Benchmarks

```typescript
import { bench } from "vitest";

// Component performance benchmarking
bench(
  "large list rendering",
  async () => {
    const { container } = render(
      <DataTable data={generateLargeDataset(1000)} />
    );
    await findByTestId(container, "data-table-rendered");
  },
  { time: 1000, iterations: 10 }
);

// Hook performance testing
bench("useOptimizedSearch performance", () => {
  const { result } = renderHook(() => useOptimizedSearch(largeDataset));
  act(() => {
    result.current.search("complex query");
  });
});
```

### Accessibility Testing Integration

**Comprehensive A11y Test Pattern**

```typescript
import { axe } from "jest-axe";

describe("Accessible Component Tests", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(<InteractiveComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<ModalComponent />);

    // Test focus management
    await user.tab();
    expect(screen.getByRole("dialog")).toHaveFocus();

    // Test escape functionality
    await user.keyboard("{Escape}");
    expect(screen.getByText("Open Modal")).toHaveFocus();
  });
});
```

### Visual Regression Testing with Chromatic

**Storybook Visual Testing Setup**

```typescript
// Button.stories.ts
export const AllVariants: Story = {
  parameters: {
    chromatic: {
      viewports: [320, 768, 1200], // Multi-viewport testing
      delay: 300, // Wait for animations
      modes: {
        "dark-theme": { theme: "dark" },
        "high-contrast": { theme: "high-contrast" },
      },
    },
  },
  render: () => (
    <div className="variant-grid">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant} Button
        </Button>
      ))}
    </div>
  ),
};
```

### Async Testing Patterns and Race Condition Prevention

```typescript
describe("Async Component Tests", () => {
  it("prevents race conditions in rapid requests", async () => {
    const user = userEvent.setup();
    render(<SearchComponent />);

    const searchInput = screen.getByRole("textbox");

    // Simulate rapid typing
    await user.type(searchInput, "john");
    await user.clear(searchInput);
    await user.type(searchInput, "jane");

    // Only latest result should be shown
    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });
});
```

## Storybook 9 Advanced Testing Patterns

### Interaction Testing with Play Functions

```typescript
export const ComplexInteraction: Story = {
  args: { onSubmit: fn(), onError: fn() },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step("Fill form with validation errors", async () => {
      await userEvent.click(canvas.getByRole("button", { name: /submit/i }));
      await expect(canvas.getByText(/email is required/i)).toBeInTheDocument();
    });

    await step("Complete successful submission", async () => {
      await userEvent.type(canvas.getByLabelText(/email/i), "user@example.com");
      await userEvent.click(canvas.getByRole("button", { name: /submit/i }));

      await expect(args.onSubmit).toHaveBeenCalledWith({
        email: "user@example.com",
      });
    });
  },
};
```

### Component vs Integration vs E2E Testing Boundaries

**Enhanced Decision Matrix for AI Agents (2025)**

| Test Type            | Use When                          | Tools                     | Speed  | Mock Level | Example                                |
| -------------------- | --------------------------------- | ------------------------- | ------ | ---------- | -------------------------------------- |
| **Component Unit**   | Single component logic, UI states | Vitest + Real Components  | Fast   | Services   | Button click handlers, form validation |
| **Component Visual** | Component states, design system   | Storybook + MSW          | Fast   | API        | All button variants, loading states    |
| **Integration**      | Component interactions, data flow | Vitest + Real Components | Medium | Services   | Hook coordination, business logic      |
| **E2E**             | Complete user workflows           | Playwright                | Slow   | None       | Full user journeys across pages       |

**Key Principle**: Test **real components** with **service-level mocking**, not **mock components** with real services.

```typescript
// Component Test Example
test("button handles loading state correctly", () => {
  render(<Button loading={true}>Submit</Button>);
  expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
});

// Integration Test Example
cy.mount(<CheckoutForm />);
cy.get('[data-cy="credit-card"]').type("4111111111111111");
cy.get('[data-cy="submit"]').click();
cy.get('[data-cy="success-message"]').should("be.visible");

// E2E Test Example
cy.visit("/checkout");
cy.completeCheckoutFlow(testUser, testPayment);
cy.url().should("include", "/order-confirmation");
```

## Enhanced Component Testing Strategy (2025)

### The Component Mocking Problem

**❌ AVOID: Component Mocking (False Confidence Anti-Pattern)**

```typescript
// DON'T: Mock the entire component you're testing
vi.mock("@/components/Dashboard", () => ({
  Dashboard: () => <div>Fake Dashboard</div>
}));

// This tests your mock, not your real component!
test("dashboard renders", () => {
  render(<Dashboard />);
  expect(screen.getByText("Fake Dashboard")).toBeInTheDocument();
});
```

**Problems with Component Mocking:**
- ✅ Tests pass but real component might be completely broken
- ✅ False confidence in component functionality
- ✅ Tests become maintenance burden when component changes
- ✅ Missing integration issues between component parts

### ✅ SOLUTION: Service-Level Mocking with Real Components

**The Right Approach: Mock External Dependencies, Test Real Components**

```typescript
// ✅ DO: Mock external services, test real components
vi.mock("@/services/firebase/plantService", () => ({
  FirebasePlantService: {
    getPlants: vi.fn().mockResolvedValue([mockPlant1, mockPlant2]),
    subscribeToPlantsChanges: vi.fn(() => vi.fn()), // Return unsubscribe function
    createPlant: vi.fn().mockResolvedValue("new-plant-id"),
  }
}));

vi.mock("@/services/firebase/authService", () => ({
  FirebaseAuthService: {
    getCurrentUser: vi.fn().mockReturnValue(mockUser),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
}));

// Test the REAL Dashboard component
test("dashboard displays plants correctly", async () => {
  render(<Dashboard />);

  // Test real component behavior
  expect(await screen.findByText("My Tomato Plant")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
});
```

### Component Testing Strategy Decision Tree

```
Complex Component Testing Decision Tree:

1. Is the component slow/hanging in tests?
   YES → Mock external services (Firebase, APIs, etc.)
   NO → Test with real dependencies

2. Does the component have multiple visual states?
   YES → Add Storybook stories for visual testing
   NO → Standard unit tests sufficient

3. Does the component coordinate multiple sub-components?
   YES → Test composition + test sub-components separately
   NO → Single component testing sufficient

4. Are there complex user interaction flows?
   YES → Add integration tests in separate file
   NO → Unit test interactions sufficient

5. Does the component handle errors/edge cases?
   YES → Mock service failures and test error states
   NO → Focus on happy path testing
```

### Storybook Component State Testing

**Use Storybook for Visual Component Testing**

```typescript
// Dashboard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { Dashboard } from './Dashboard';

const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Test empty state
export const EmptyDashboard: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/plants/:userId', () => {
          return HttpResponse.json({ data: [] });
        }),
      ],
    },
  },
};

// Test populated state
export const PopulatedDashboard: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/plants/:userId', () => {
          return HttpResponse.json({
            data: [
              { id: '1', name: 'Tomato', varietyName: 'Cherry Tomato' },
              { id: '2', name: 'Basil', varietyName: 'Sweet Basil' },
            ]
          });
        }),
      ],
    },
  },
};

// Test error state
export const ErrorDashboard: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/plants/:userId', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      ],
    },
  },
};

// Test loading state with delay
export const LoadingDashboard: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/plants/:userId', async () => {
          await delay(2000); // 2 second delay
          return HttpResponse.json({ data: [] });
        }),
      ],
    },
  },
};
```

### Component Composition Testing

**Strategy: Test Composition + Sub-components Separately**

```typescript
// Dashboard.test.tsx - Test the composition
describe('Dashboard Component Composition', () => {
  beforeEach(() => {
    // Mock external services only
    vi.mocked(FirebasePlantService.getPlants).mockResolvedValue(mockPlants);
    vi.mocked(FirebaseAuthService.getCurrentUser).mockReturnValue(mockUser);
  });

  it('renders all dashboard sections correctly', async () => {
    render(<Dashboard />);

    // Test that real component renders real sub-components
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
    expect(screen.getByTestId('plant-garden')).toBeInTheDocument();
  });

  it('coordinates data flow between sections', async () => {
    render(<Dashboard />);

    // Test real data coordination
    expect(await screen.findByText('Plants: 2')).toBeInTheDocument();
    expect(screen.getByText('Groups needing care: 1')).toBeInTheDocument();
  });
});

// SummaryCards.test.tsx - Test sub-component in isolation
describe('SummaryCards Sub-component', () => {
  it('displays plant count correctly', () => {
    render(<SummaryCards plantCount={5} careGroups={2} />);
    expect(screen.getByText('Plants: 5')).toBeInTheDocument();
  });
});
```

## Testing Anti-Patterns and Solutions (Enhanced 2025)

### Critical Anti-Patterns to Avoid

**❌ CRITICAL: Component Mocking Anti-Pattern**

```typescript
// DON'T: Mock the component you're testing
vi.mock("@/components/Dashboard", () => ({
  Dashboard: () => <div data-testid="fake-dashboard">Mocked Dashboard</div>
}));

test("dashboard renders", () => {
  render(<Dashboard />);
  expect(screen.getByTestId("fake-dashboard")).toBeInTheDocument();
  // ❌ This tests the MOCK, not the real component!
});
```

**❌ Shallow Component Testing**

```typescript
// DON'T: Overly mock sub-components
vi.mock("@/components/SummaryCards", () => () => <div>Fake Summary</div>);
vi.mock("@/components/PlantGarden", () => () => <div>Fake Garden</div>);

// ❌ Now you're testing a frankenstein component
render(<Dashboard />);
```

**❌ Testing Implementation Details**

```typescript
// DON'T: Test internal state or props
expect(component.instance().state.isVisible).toBe(true);

// ✅ DO: Test user-observable behavior
expect(screen.getByText("Content is visible")).toBeInTheDocument();
```

**❌ Testing Mock Interactions**

```typescript
// DON'T: Test that mocks are called correctly
const mockFunction = vi.fn();
mockFunction("test");
expect(mockFunction).toHaveBeenCalledWith("test");
// ❌ This just tests that vi.fn() works (it does!)

// ✅ DO: Test real user interactions
await user.click(screen.getByRole("button", { name: /submit/i }));
expect(screen.getByText("Form submitted successfully")).toBeInTheDocument();
```

**❌ Using fireEvent Instead of userEvent**

```typescript
// DON'T: Direct DOM events
fireEvent.change(input, { target: { value: "hello" } });

// ✅ DO: User-like interactions
await userEvent.type(input, "hello");
```

**❌ Arbitrary Waits**

```typescript
// DON'T: Hard-coded delays
await new Promise((resolve) => setTimeout(resolve, 1000));

// ✅ DO: Wait for specific conditions
await waitFor(() => expect(element).toBeVisible());
```

## Optimal Test Structure and Organization (Enhanced 2025)

### Enhanced Project Structure Template

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── Dashboard.test.tsx           // Real component unit tests
│   │   ├── Dashboard.integration.test.tsx // Complex user flows
│   │   ├── Dashboard.stories.tsx        // Visual state testing
│   │   └── index.ts
│   ├── SummaryCards/
│   │   ├── SummaryCards.tsx
│   │   ├── SummaryCards.test.tsx        // Sub-component unit tests
│   │   ├── SummaryCards.stories.tsx
│   │   └── index.ts
├── hooks/
│   ├── useApi/
│   │   ├── useApi.ts
│   │   ├── useApi.test.ts
│   │   └── index.ts
├── services/
│   ├── firebase/
│   │   ├── plantService.ts
│   │   ├── plantService.test.ts         // Service unit tests
│   │   └── __mocks__/
│   │       └── plantService.ts          // Service mocks
├── test/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── handlers.ts                  // MSW handlers
│   │   ├── data/                        // Mock data factories
│   │   │   ├── plants.ts
│   │   │   └── users.ts
│   │   └── services/                    // Service mocks
│   │       ├── firebase.ts
│   │       └── api.ts
│   └── utils/
│       ├── test-utils.tsx               // Custom render functions
│       └── storybook-utils.ts           // Storybook test utilities
```

### Testing File Naming Conventions

| File Type | Purpose | Example |
|-----------|---------|---------|
| `Component.test.tsx` | Real component unit tests with service mocking | `Dashboard.test.tsx` |
| `Component.integration.test.tsx` | Complex user flows, multi-component interactions | `Dashboard.integration.test.tsx` |
| `Component.stories.tsx` | Visual state testing, design system validation | `Dashboard.stories.tsx` |
| `service.test.ts` | Service/utility unit tests | `plantService.test.ts` |
| `hook.test.ts` | Custom hook testing | `usePlants.test.ts` |

### Test Naming Conventions for AI Generation

```typescript
describe("ComponentName", () => {
  describe("Rendering", () => {
    it("renders with default props", () => {});
    it("renders with custom variants", () => {});
  });

  describe("User Interactions", () => {
    it("handles click events correctly", async () => {});
    it("supports keyboard navigation", async () => {});
  });

  describe("Edge Cases", () => {
    it("handles loading states gracefully", () => {});
    it("displays error states appropriately", () => {});
  });

  describe("Accessibility", () => {
    it("meets WCAG 2.1 standards", async () => {});
    it("provides proper ARIA labels", () => {});
  });
});
```

## CI/CD Integration Patterns

### GitHub Actions Testing Pipeline

```yaml
name: Testing Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run Storybook tests
        run: npm run test-storybook

      - name: Run E2E tests
        uses: cypress-io/github-action@v6
        with:
          start: npm start
          wait-on: "http://localhost:3000"

      - name: Visual regression tests
        run: npx chromatic --project-token=${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## AI-Optimized Testing Templates for Continue.dev

### Enhanced Component Test Generation Template (2025)

```typescript
/**
 * AI TEMPLATE: Generate comprehensive REAL component tests with service mocking
 *
 * USAGE: Apply this template when generating tests for React components
 * CONTEXT REQUIRED: Component props interface, external services, expected behaviors
 * PRINCIPLE: Test REAL components with SERVICE-LEVEL mocking
 */

// Mock external services, NOT the component being tested
vi.mock('@/services/[serviceName]', () => ({
  [ServiceName]: {
    [method]: vi.fn().mockResolvedValue([mockData]),
    [subscriptionMethod]: vi.fn(() => vi.fn()), // Return unsubscribe function
  }
}))

describe('[ComponentName] Component - Real Component Tests', () => {
  // Setup with typed props and service mocks
  const defaultProps: [ComponentProps] = {
    // Define sensible defaults for required props
  }

  const render[ComponentName] = (props: Partial<[ComponentProps]> = {}) => {
    return render(<[ComponentName] {...defaultProps} {...props} />)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Configure service mocks for each test
    vi.mocked([ServiceName].[method]).mockResolvedValue([mockData])
  })

  describe('Real Component Rendering', () => {
    it('renders real component with mocked services', async () => {
      render[ComponentName]()

      // Test real component behavior, not mock behavior
      expect(await screen.findByRole('[expected-role]')).toBeInTheDocument()
      expect(screen.getByText('[expected-text]')).toBeInTheDocument()
    })

    it('handles different service data states', async () => {
      // Test empty state
      vi.mocked([ServiceName].[method]).mockResolvedValue([])
      render[ComponentName]()
      expect(await screen.findByText('[empty-state-text]')).toBeInTheDocument()

      // Test populated state
      vi.mocked([ServiceName].[method]).mockResolvedValue([mockData])
      render[ComponentName]()
      expect(await screen.findByText('[populated-state-text]')).toBeInTheDocument()
    })
  })

  describe('Real User Interactions', () => {
    it('handles real user interactions with service calls', async () => {
      const user = userEvent.setup()
      render[ComponentName]()

      await user.click(screen.getByRole('button', { name: /[action]/i }))

      // Verify real service was called
      expect([ServiceName].[method]).toHaveBeenCalledWith([expectedArgs])

      // Verify real UI response
      expect(await screen.findByText('[success-message]')).toBeInTheDocument()
    })
  })

  describe('Service Error Handling', () => {
    it('handles service errors gracefully', async () => {
      vi.mocked([ServiceName].[method]).mockRejectedValue(new Error('Service failed'))

      render[ComponentName]()

      expect(await screen.findByText('[error-message]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper accessibility in real component', async () => {
      render[ComponentName]()
      expect(await screen.findByRole('[role]')).toHaveAccessibleName()
    })
  })
})
```

### Storybook Story Generation Template

```typescript
/**
 * AI TEMPLATE: Generate Storybook stories for visual component testing
 */

import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { [ComponentName] } from './[ComponentName]'

const meta: Meta<typeof [ComponentName]> = {
  title: '[Category]/[ComponentName]',
  component: [ComponentName],
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Test different component states visually
export const [State1]: Story = {
  args: {
    [prop]: [value1],
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/[endpoint]', () => {
          return HttpResponse.json({ data: [mockData1] })
        }),
      ],
    },
  },
}

export const [State2]: Story = {
  args: {
    [prop]: [value2],
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/[endpoint]', () => {
          return HttpResponse.json({ data: [mockData2] })
        }),
      ],
    },
  },
}

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/[endpoint]', () => {
          return new HttpResponse(null, { status: 500 })
        }),
      ],
    },
  },
}
```

### Custom Hook Testing Template

```typescript
/**
 * AI TEMPLATE: Custom hook testing
 *
 * Use this pattern for testing React hooks with proper TypeScript integration
 */

describe('use[HookName]', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => use[HookName]())

    expect(result.current.[property]).toBe([expectedValue])
    expectTypeOf(result.current.[method]).toBeFunction()
  })

  it('updates state correctly when [action] occurs', () => {
    const { result } = renderHook(() => use[HookName]())

    act(() => {
      result.current.[method]([argument])
    })

    expect(result.current.[property]).toBe([newValue])
  })

  it('handles edge cases appropriately', () => {
    const { result } = renderHook(() => use[HookName]([problematicInput]))
    expect(result.current.[property]).toBe([fallbackValue])
  })
})
```

### API Integration Testing Template

```typescript
/**
 * AI TEMPLATE: API integration testing
 *
 * Use for components that interact with external APIs
 */

describe('[ComponentName] API Integration', () => {
  beforeEach(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('displays data when API call succeeds', async () => {
    server.use(
      http.get('/api/[endpoint]', () => HttpResponse.json([mockData]))
    )

    render(<[ComponentName] />)
    expect(await screen.findByText('[expected-content]')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    server.use(
      http.get('/api/[endpoint]', () => new HttpResponse(null, { status: 500 }))
    )

    render(<[ComponentName] />)
    expect(await screen.findByText(/error/i)).toBeInTheDocument()
  })

  it('shows loading state during API calls', () => {
    server.use(
      http.get('/api/[endpoint]', async () => {
        await delay(1000)
        return HttpResponse.json([mockData])
      })
    )

    render(<[ComponentName] />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
```

## Error Boundary and Error Scenario Coverage

```typescript
describe("ErrorBoundary", () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => consoleSpy.mockClear());
  afterAll(() => consoleSpy.mockRestore());

  it("catches and displays errors appropriately", () => {
    render(
      <ErrorBoundary fallback="Something went wrong">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("provides error recovery mechanisms", async () => {
    const user = userEvent.setup();
    render(
      <RetryableErrorBoundary>
        <BuggyComponent />
      </RetryableErrorBoundary>
    );

    await user.click(screen.getByText("Retry"));
    expect(screen.getByText("Component working")).toBeInTheDocument();
  });
});
```

## Snapshot Testing Guidelines

### When to Use Snapshots

```typescript
// ✅ GOOD: Error messages and data transformations
it("formats error messages correctly", () => {
  const error = validateUserInput(invalidData);
  expect(error).toMatchSnapshot();
});

// ✅ GOOD: Complex data transformations with custom serializers
it("transforms API response correctly", () => {
  const result = transformApiData(mockApiResponse);
  expect(result).toMatchSnapshot();
});
```

### When to Avoid Snapshots

```typescript
// ❌ AVOID: Large DOM snapshots
// Instead of: expect(container).toMatchSnapshot()
expect(screen.getByRole("heading")).toHaveTextContent("Expected Title");
expect(screen.getByRole("button")).toBeEnabled();
```

## Mock Data Management and Organization

```typescript
// factories/user.factory.ts
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  role: "user",
  ...overrides,
});

// Test usage with proper isolation
beforeEach(() => {
  // Reset mock data for each test
  resetAllFactories();
});

test("displays user profile correctly", () => {
  const testUser = createUser({ name: "John Doe", role: "admin" });
  render(<UserProfile user={testUser} />);

  expect(screen.getByText("John Doe")).toBeInTheDocument();
  expect(screen.getByText("Admin")).toBeInTheDocument();
});
```

## Custom Testing Utilities and Helpers

```typescript
// test-utils.tsx
interface CustomRenderOptions extends RenderOptions {
  preloadedState?: Partial<RootState>;
  user?: ReturnType<typeof userEvent.setup>;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    preloadedState = {},
    user = userEvent.setup(),
    ...renderOptions
  } = options;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <Provider store={setupStore(preloadedState)}>{children}</Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    user,
    ...render(ui, { wrapper, ...renderOptions }),
  };
};

// Usage in tests
test("component with full provider setup", async () => {
  const { user } = renderWithProviders(<MyComponent />, {
    preloadedState: { auth: { user: testUser } },
  });

  await user.click(screen.getByRole("button"));
  expect(screen.getByText("Action completed")).toBeInTheDocument();
});
```

## Test Coverage Strategies and Meaningful Metrics

### Beyond Line Coverage Configuration

```typescript
// vitest.config.ts coverage with meaningful thresholds
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'cobertura'],
  thresholds: {
    global: {
      branches: 80,    // Decision coverage
      functions: 85,   // Function coverage
      lines: 80,      // Line coverage
      statements: 80   // Statement coverage
    }
  },
  exclude: [
    'src/**/*.test.{ts,tsx}',
    'src/**/*.stories.{ts,tsx}',
    'src/test/**/*'
  ]
}
```

### Mutation Testing Integration

```bash
# Install Stryker for mutation testing
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner

# stryker.conf.json
{
  "mutate": ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}"],
  "testRunner": "vitest",
  "reporters": ["html", "progress"],
  "thresholds": { "high": 90, "low": 70, "break": 60 }
}
```

## Debugging Strategies for Flaky Tests

### Common Issues and Solutions

```typescript
// ❌ Race condition in async operations
test("flaky async test", async () => {
  render(<AsyncComponent />);
  await waitFor(() => expect(screen.getByText("loaded")).toBeInTheDocument());
  // Race condition: component might still be updating
  fireEvent.click(screen.getByRole("button"));
});

// ✅ Proper async handling
test("reliable async test", async () => {
  const user = userEvent.setup();
  render(<AsyncComponent />);

  // Wait for component to be fully ready
  const button = await screen.findByRole("button", { name: /action/i });
  await user.click(button);

  expect(await screen.findByText("success")).toBeInTheDocument();
});
```

### Test Isolation Patterns

```typescript
beforeEach(() => {
  // Complete state reset
  vi.clearAllMocks();
  cleanup();
  server.resetHandlers();

  // Reset any global state
  resetGlobalStore();

  // Clear any side effects
  document.body.innerHTML = "";
});
```

## Continue.dev System Prompt Optimization

### Enhanced Core Directives for AI Test Generation (2025)

```
ENHANCED TESTING PHILOSOPHY:
- Test REAL components with SERVICE-LEVEL mocking, never mock components
- Always test user-observable behavior, never implementation details
- Use semantic queries (getByRole, getByLabelText) over test IDs
- Prioritize async patterns with proper waiting strategies
- Generate TypeScript-safe tests with explicit typing

CRITICAL COMPONENT TESTING RULES:
- NEVER mock the component being tested (use real components)
- Mock external services (Firebase, APIs, etc.) not components
- Use Storybook for visual state testing with MSW integration
- Test component composition AND sub-components separately
- Include integration tests for complex user flows

REQUIRED PATTERNS:
- Use userEvent.setup() for all user interactions
- Mock services: vi.mock('@/services/firebase/plantService')
- Include accessibility testing for interactive components
- Structure tests: Real Component Rendering, User Interactions, Service Errors
- Create Storybook stories for visual testing

CRITICAL ANTI-PATTERNS TO AVOID:
- NEVER mock entire components: vi.mock('@/components/Dashboard')
- Never use fireEvent instead of userEvent
- Never test component internal state or props directly
- Never use arbitrary timeouts or delays
- Never create interdependent tests
- Never test mock behavior instead of real component behavior

REQUIRED FILE STRUCTURE:
- Component.test.tsx: Real component unit tests with service mocking
- Component.integration.test.tsx: Complex user flows
- Component.stories.tsx: Visual state testing with MSW
- service.test.ts: Service unit tests

OUTPUT REQUIREMENTS:
- Complete, runnable test files with proper imports
- Real component rendering with mocked external services
- TypeScript types for all test data and mocks
- Clear test descriptions explaining expected behavior
- Appropriate cleanup and setup patterns
- Storybook stories for visual component state testing
```

### Decision Tree for Test Type Selection

```
Component Testing Decision Tree for AI:

1. Does component handle user interactions?
   YES → Include userEvent interaction tests
   NO → Focus on rendering and prop tests

2. Does component make API calls?
   YES → Add MSW handlers and async testing patterns
   NO → Skip network-related tests

3. Does component manage complex state?
   YES → Test state transitions and edge cases
   NO → Basic prop validation sufficient

4. Are there accessibility requirements?
   YES → Include a11y tests with axe-core
   NO → Standard semantic testing sufficient

5. Does component handle errors?
   YES → Include error boundary and error state tests
   NO → Focus on happy path scenarios
```

## Updated Testing Strategy Implementation (2025)

### Three-Tier Testing Approach

Based on our analysis and refactoring of the Dashboard component tests, we now implement a three-tier testing strategy:

#### 1. **Integration Tests (Vitest + Real Components)**
Focus on business logic and data flow between hooks and components:

```typescript
describe("Dashboard Integration Tests", () => {
  describe("Business Logic Integration", () => {
    it("calculates plant grouping correctly", () => {
      // Test real business logic without mocking components
      const plants = [
        { id: "1", container: "pot-a", varietyName: "tomato" },
        { id: "2", container: "pot-a", varietyName: "tomato" },
      ];

      const grouped = plants.reduce((acc, plant) => {
        const key = `${plant.container}-${plant.varietyName}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(plant);
        return acc;
      }, {} as Record<string, typeof plants>);

      expect(grouped["pot-a-tomato"]).toHaveLength(2);
    });
  });
});
```

#### 2. **Visual Component Tests (Storybook + MSW)**
Document and test different component states:

```typescript
// Dashboard.stories.tsx
export const EmptyGarden: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/plants', () => HttpResponse.json([])),
      ],
    },
  },
};

export const PopulatedGarden: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('*/plants', () => HttpResponse.json(mockPlants)),
      ],
    },
  },
};
```

#### 3. **End-to-End Tests (Playwright)**
Test complete user workflows across multiple pages:

```typescript
test('complete plant management workflow', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-testid="add-plant-button"]');
  await page.fill('[data-testid="plant-name"]', 'New Tomato');
  await page.click('[data-testid="save-plant"]');
  await expect(page.locator('text=New Tomato')).toBeVisible();
});
```

### Implementation Guidelines

1. **For Dashboard-like complex components:**
   - Use integration tests for business logic and hook coordination
   - Use Storybook for visual state documentation
   - Use Playwright for complete user workflows

2. **Service layer mocking:**
   - Mock at the service level (`@/services/firebase/plantService`)
   - Never mock the component being tested
   - Use MSW for API mocking in Storybook

3. **Test focus areas:**
   - Data flow between hooks
   - Business logic calculations
   - Error handling patterns
   - User interaction workflows

### Tools Configuration

- **Vitest**: Integration and unit tests with service mocking
- **Storybook**: Visual component state testing with MSW
- **Playwright**: End-to-end user workflows
- **MSW**: API mocking for both Vitest and Storybook

This comprehensive framework provides AI coding assistants with the structure, patterns, and guidelines needed to generate high-quality, maintainable tests for React/TypeScript applications in 2025. The emphasis on TypeScript safety, modern testing patterns, and accessibility ensures that generated tests are both reliable and future-proof.
