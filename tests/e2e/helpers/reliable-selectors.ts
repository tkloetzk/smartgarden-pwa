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
        return element;
      } else {
        // Multiple elements found, return the first visible one
        for (let i = 0; i < count; i++) {
          const nth = element.nth(i);
          if (await nth.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE }).catch(() => false)) {
            return nth;
          }
        }
        // If none are visible, return the first one
        return element.first();
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