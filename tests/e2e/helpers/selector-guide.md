# Playwright Selector Strategy Guide

## Overview
This guide outlines the standardized approach for selecting elements in Playwright tests to ensure reliability and maintainability.

## Hierarchy of Selector Strategies

### 1. **Use Reliable Selector Helpers (Preferred)**
Always use the helpers from `reliable-selectors.ts` when available:

```typescript
// ✅ Good - Using reliable selector helpers
const navigationLink = await getNavigationLink(page, "/plants");
const formInput = await getFormInput(page, 'plant-name');
const submitButton = await getSubmitButton(page, SELECTORS.FORMS.PLANT_REGISTRATION);
const firstVisible = await getFirstVisible(page.locator('.multiple-elements'));
```

### 2. **Use Constants from test-constants.ts**
When reliable helpers aren't available, use predefined selector constants:

```typescript
// ✅ Good - Using predefined constants
const form = page.locator(SELECTORS.FORMS.PLANT_REGISTRATION);
const root = page.locator(SELECTORS.APP.ROOT);
```

### 3. **Specific Selectors with Context**
Use specific, context-aware selectors:

```typescript
// ✅ Good - Specific and contextual
const mobileNavLink = page.locator(SELECTORS.NAV.MOBILE.DASHBOARD_LINK);
const quantityInput = page.locator(SELECTORS.FORMS.QUANTITY_INPUT);
```

### 4. **Fallback Patterns**
When all else fails, use defensive selector patterns:

```typescript
// ✅ Acceptable - With defensive patterns
const buttons = page.locator('button[type="submit"], button:has-text("Save")');
const count = await buttons.count();
if (count > 0) {
  const visibleButton = await getFirstVisible(buttons);
}
```

## Anti-Patterns to Avoid

### ❌ Using .first() Without Context
```typescript
// ❌ Bad - Can break when layout changes
const link = page.locator('a').first();
```

### ❌ Using Generic Selectors
```typescript
// ❌ Bad - Too generic, unreliable
const input = page.locator('input');
const button = page.locator('button');
```

### ❌ Hard-coded Element Indices
```typescript
// ❌ Bad - Brittle when elements are added/removed
const thirdButton = page.locator('button').nth(2);
```

### ❌ CSS Selectors That Depend on Styling
```typescript
// ❌ Bad - Breaks when styles change
const redButton = page.locator('.text-red-500');
```

## Best Practices

### 1. **Prefer Data Attributes**
```typescript
// ✅ Good - Stable and semantic
page.locator('[data-testid="plant-registration-form"]')
page.locator('[data-testid="submit-button"]')
```

### 2. **Use Semantic HTML Attributes**
```typescript
// ✅ Good - Leverages semantic meaning
page.locator('button[type="submit"]')
page.locator('input[name="plantName"]')
page.locator('select[id="varietyId"]')
```

### 3. **Chain Selectors for Specificity**
```typescript
// ✅ Good - Scoped and specific
page.locator('[data-testid="plant-form"]').locator('button[type="submit"]')
page.locator('nav').locator('a[href="/plants"]')
```

### 4. **Handle Multiple Elements Properly**
```typescript
// ✅ Good - Handles multiple elements safely
const buttons = page.locator('button[type="submit"]');
const count = await buttons.count();

if (count === 1) {
  return buttons;
} else if (count > 1) {
  // Use helper to find first visible
  return getFirstVisible(buttons);
} else {
  throw new Error('No submit buttons found');
}
```

### 5. **Use Timeout Strategies**
```typescript
// ✅ Good - Appropriate timeouts for different operations
await page.waitForSelector('#root', { timeout: TIMEOUTS.FORM_LOAD });
await element.isVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
```

## Migration Checklist

When updating existing tests:

- [ ] Replace `.first()` calls with context-aware alternatives
- [ ] Replace `.last()` calls with explicit element targeting
- [ ] Replace generic selectors with specific ones
- [ ] Add timeout configurations where missing
- [ ] Use reliable selector helpers where possible
- [ ] Test multiple element scenarios
- [ ] Verify selectors work across different screen sizes (mobile/desktop)

## Available Reliable Selector Helpers

### Navigation
- `getNavigationLink(page, path, context)` - Context-aware navigation links

### Forms
- `getFormInput(page, inputType)` - Form inputs with fallbacks
- `getSubmitButton(page, formSelector?)` - Submit buttons with multiple strategies
- `getDropdownOption(page, selectSelector, optionIndex)` - Dropdown options with safety checks

### General
- `getFirstVisible(locator)` - First visible element from multiple matches
- `waitForAnyVisible(page, selectors)` - Wait for any of multiple selectors

## Testing Your Selectors

Always test selectors in multiple scenarios:

1. **Different screen sizes** (mobile vs desktop navigation)
2. **Different states** (loading, loaded, error states)
3. **Multiple elements** (ensure correct element is selected)
4. **Dynamic content** (elements that appear/disappear)
5. **Slow networks** (appropriate timeouts)