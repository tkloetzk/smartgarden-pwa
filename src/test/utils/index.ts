/**
 * Test Utilities Index
 *
 * Central export point for all testing utilities, factories, and helpers.
 * Import from this file to get everything you need for testing.
 */

// ============================================================================
// FACTORIES
// ============================================================================

export {
  PlantFactory,
  VarietyFactory,
  BedFactory,
  CareActivityFactory,
  ScheduledTaskFactory,
  TestDataBuilder,
} from "../factories/plantFactory";

// ============================================================================
// RENDER UTILITIES
// ============================================================================

export {
  // Custom render functions
  renderWithRouter,
  renderWithQueryClient,
  renderWithProviders,
  renderSmart,

  // Specialized render functions
  renderDashboard,
  renderForm,
  renderPlantDetail,
  renderInPage,

  // Mock data utilities
  createMockUser,
  mockUser,

  // Testing utilities
  waitForAsyncOperations,
  createTestQueryClient,
  setupTest,
  cleanupTest,

  // Re-exported testing library utilities
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
  act,
  userEvent,

  // Types
  type CustomRenderOptions,
} from "./renderUtils";

// ============================================================================
// MOCK DATA UTILITIES
// ============================================================================

export {
  setMockData,
  clearMockData,
} from "../mocks/server";

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Complete test setup with data and providers
 * Use this for comprehensive test scenarios
 */
export const setupCompleteTest = () => {
  setupTest();
  TestDataBuilder.resetAllCounters();
  clearMockData();

  return {
    queryClient: createTestQueryClient(),
    mockUser: createMockUser(),
    testData: TestDataBuilder.simpleGarden(),
  };
};

/**
 * Quick setup for component testing
 * Use this for simple component tests
 */
export const setupComponentTest = () => {
  setupTest();
  return {
    render: renderWithProviders,
    mockUser: createMockUser(),
    queryClient: createTestQueryClient(),
  };
};

/**
 * Setup for form testing
 * Includes form-specific utilities and data
 */
export const setupFormTest = () => {
  const setup = setupComponentTest();
  const varieties = [
    VarietyFactory.lettuce(),
    VarietyFactory.tomato(),
  ];

  return {
    ...setup,
    render: renderForm,
    varieties,
  };
};

/**
 * Setup for dashboard testing
 * Includes dashboard-specific data and utilities
 */
export const setupDashboardTest = () => {
  const setup = setupCompleteTest();

  return {
    ...setup,
    render: renderDashboard,
  };
};

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Common assertion patterns for testing
 */
export const assertions = {
  /**
   * Assert that an element exists and is visible
   */
  isVisible: (element: HTMLElement) => {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  },

  /**
   * Assert that text content is present and visible
   */
  hasVisibleText: (text: string | RegExp) => {
    const element = screen.getByText(text);
    assertions.isVisible(element);
    return element;
  },

  /**
   * Assert that a form field is present and has the expected value
   */
  formFieldValue: (labelText: string | RegExp, expectedValue: string) => {
    const field = screen.getByLabelText(labelText) as HTMLInputElement;
    assertions.isVisible(field);
    expect(field.value).toBe(expectedValue);
    return field;
  },

  /**
   * Assert that a button is present and clickable
   */
  clickableButton: (buttonText: string | RegExp) => {
    const button = screen.getByRole("button", { name: buttonText });
    assertions.isVisible(button);
    expect(button).not.toBeDisabled();
    return button;
  },

  /**
   * Assert that a list has the expected number of items
   */
  listLength: (listRole: string, expectedLength: number) => {
    const list = screen.getByRole(listRole);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(expectedLength);
    return { list, items };
  },
};

// ============================================================================
// TEST PATTERNS
// ============================================================================

/**
 * Common test patterns that can be reused
 */
export const testPatterns = {
  /**
   * Test basic component rendering
   */
  basicRendering: (component: React.ReactElement, expectedElements: string[]) => {
    renderWithProviders(component);

    expectedElements.forEach(elementText => {
      assertions.hasVisibleText(elementText);
    });
  },

  /**
   * Test form field interaction
   */
  formInteraction: async (
    component: React.ReactElement,
    fieldLabel: string | RegExp,
    inputValue: string
  ) => {
    renderForm(component);

    const field = screen.getByLabelText(fieldLabel);
    assertions.isVisible(field);

    await userEvent.clear(field);
    await userEvent.type(field, inputValue);

    expect(field).toHaveValue(inputValue);
    return field;
  },

  /**
   * Test navigation
   */
  navigation: async (
    component: React.ReactElement,
    linkText: string | RegExp,
    expectedPath: string
  ) => {
    const { container } = renderWithRouter(component, {
      initialEntries: ["/"],
    });

    const link = screen.getByRole("link", { name: linkText });
    await userEvent.click(link);

    // In a real app, you'd check the URL or route state
    // This is a simplified example
    expect(link).toHaveAttribute("href", expectedPath);
  },
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export with the most commonly used utilities
 */
export default {
  // Factories
  PlantFactory,
  TestDataBuilder,

  // Render utilities
  render: renderWithProviders,
  renderDashboard,
  renderForm,

  // Setup utilities
  setupCompleteTest,
  setupComponentTest,

  // Assertions
  assertions,

  // Mock utilities
  mockUser,
  createMockUser,

  // Testing library exports
  screen,
  waitFor,
  userEvent,
};