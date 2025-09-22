/**
 * Reliable Selector Helpers
 *
 * Provides robust selector strategies with fallback mechanisms
 * to improve test reliability when layout changes occur.
 */

import { Page, Locator } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from './test-constants';

export type NavigationContext = 'mobile' | 'desktop' | 'auto';

/**
 * Get navigation link with context-aware selector and fallback strategy
 * @param page Playwright page instance
 * @param path Link path ("/", "/plants", "/add-plant")
 * @param context Navigation context preference
 */
export async function getNavigationLink(
  page: Page,
  path: string,
  context: NavigationContext = 'auto'
): Promise<Locator> {
  const pathKey = path === '/' ? 'DASHBOARD_LINK'
    : path === '/plants' ? 'PLANTS_LINK'
    : path === '/add-plant' ? 'ADD_PLANT_LINK'
    : null;

  if (!pathKey) {
    throw new Error(`Unsupported navigation path: ${path}`);
  }

  // Define selector priority based on context
  const getSelectorsByContext = (ctx: NavigationContext) => {
    switch (ctx) {
      case 'mobile':
        return [
          SELECTORS.NAV.MOBILE[pathKey as keyof typeof SELECTORS.NAV.MOBILE],
          SELECTORS.NAV.ANY[pathKey as keyof typeof SELECTORS.NAV.ANY]
        ];
      case 'desktop':
        return [
          SELECTORS.NAV.DESKTOP[pathKey as keyof typeof SELECTORS.NAV.DESKTOP],
          SELECTORS.NAV.ANY[pathKey as keyof typeof SELECTORS.NAV.ANY]
        ];
      case 'auto':
      default:
        return [
          SELECTORS.NAV.MOBILE[pathKey as keyof typeof SELECTORS.NAV.MOBILE],
          SELECTORS.NAV.DESKTOP[pathKey as keyof typeof SELECTORS.NAV.DESKTOP],
          `nav a[href="${path}"]`, // Generic nav selector
          `navigation a[href="${path}"]`, // Navigation element selector
          SELECTORS.NAV.ANY[pathKey as keyof typeof SELECTORS.NAV.ANY]
        ];
    }
  };

  const selectors = getSelectorsByContext(context);

  // Try each selector until we find a visible element
  for (const selector of selectors) {
    const element = page.locator(selector);
    const count = await element.count();

    if (count > 0) {
      // If multiple elements, try to find the visible one
      if (count === 1) {
        // Check if the single element is visible
        if (await element.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
          return element;
        }
      } else {
        // Multiple elements found, return the first visible one
        for (let i = 0; i < count; i++) {
          const nth = element.nth(i);
          if (await nth.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
            return nth;
          }
        }
      }
    }
  }

  throw new Error(`Navigation link for ${path} not found with any selector strategy`);
}

/**
 * Get form input with type-safe fallback
 * @param page Playwright page instance
 * @param inputType Type of input to find
 */
export async function getFormInput(
  page: Page,
  inputType: 'plant-name' | 'planting-date' | 'quantity'
): Promise<Locator> {
  const selectorMap = {
    'plant-name': [
      SELECTORS.FORMS.PLANT_NAME_INPUT,
      'input[name="name"]',
      'input[type="text"]' // Fallback to generic
    ],
    'planting-date': [
      SELECTORS.FORMS.PLANTING_DATE_INPUT,
      'input[name="plantedDate"]',
      'input[type="date"]' // Fallback to generic
    ],
    'quantity': [
      SELECTORS.FORMS.QUANTITY_INPUT,
      '[data-testid="quantity-input"]',
      'input[type="number"]' // Fallback to generic
    ]
  };

  const selectors = selectorMap[inputType];

  for (const selector of selectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      return element;
    }
  }

  throw new Error(`Form input ${inputType} not found with any selector strategy`);
}

/**
 * Get dropdown option with safe indexing
 * @param page Playwright page instance
 * @param selectSelector Selector for the select element
 * @param optionIndex Index of option (0 = placeholder, 1 = first real option, etc.)
 */
export async function getDropdownOption(
  page: Page,
  selectSelector: string,
  optionIndex: number
): Promise<Locator> {
  const select = page.locator(selectSelector);
  const options = select.locator('option');

  const optionCount = await options.count();

  if (optionIndex >= optionCount) {
    throw new Error(`Option index ${optionIndex} exceeds available options (${optionCount})`);
  }

  return options.nth(optionIndex);
}

/**
 * Wait for any of multiple selectors to be visible
 * @param page Playwright page instance
 * @param selectors Array of selectors to try
 * @param timeout Timeout for the operation
 */
export async function waitForAnyVisible(
  page: Page,
  selectors: string[],
  timeout: number = TIMEOUTS.ELEMENT_VISIBLE
): Promise<Locator> {
  const promises = selectors.map(selector =>
    page.locator(selector).waitFor({ state: 'visible', timeout }).then(() => selector)
  );

  try {
    const visibleSelector = await Promise.race(promises);
    return page.locator(visibleSelector);
  } catch (error) {
    throw new Error(`None of the selectors became visible: ${selectors.join(', ')}`);
  }
}

/**
 * Get the first visible element from a locator that matches multiple elements
 * @param locator Playwright locator that may match multiple elements
 * @param timeout Timeout for checking visibility
 */
export async function getFirstVisible(
  locator: Locator,
  timeout: number = TIMEOUTS.ELEMENT_VISIBLE
): Promise<Locator> {
  const count = await locator.count();

  if (count === 0) {
    throw new Error('No elements found for locator');
  }

  if (count === 1) {
    return locator;
  }

  // Multiple elements found, return the first visible one
  for (let i = 0; i < count; i++) {
    const element = locator.nth(i);
    if (await element.isVisible({ timeout }).catch(() => false)) {
      return element;
    }
  }

  throw new Error('No visible elements found');
}

/**
 * Get submit button with fallback strategies
 * @param page Playwright page instance
 * @param formSelector Optional form selector to scope the search
 */
export async function getSubmitButton(
  page: Page,
  formSelector?: string
): Promise<Locator> {
  const scope = formSelector ? page.locator(formSelector) : page;

  const selectors = [
    'button[type="submit"]',
    'button:has-text("Save")',
    'button:has-text("Add")',
    'button:has-text("Register")',
    'button:has-text("Submit")',
    'input[type="submit"]',
  ];

  for (const selector of selectors) {
    const buttons = scope.locator(selector);
    const count = await buttons.count();

    if (count > 0) {
      return getFirstVisible(buttons);
    }
  }

  throw new Error('No submit button found with any selector strategy');
}