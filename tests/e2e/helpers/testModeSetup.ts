import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      (window as any).__TEST_MODE = true;
      (window as any).__VITE_TEST_MODE = "true";
    });
    await use(page);
  },
});
