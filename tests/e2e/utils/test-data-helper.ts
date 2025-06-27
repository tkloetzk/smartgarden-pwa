import { Page } from "@playwright/test";

export class TestDataHelper {
  constructor(private page: Page) {}

  async clearUserData(): Promise<void> {
    // Clear IndexedDB or any local storage if needed
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();

      // Clear IndexedDB if you're using it
      if ("indexedDB" in window) {
        indexedDB.deleteDatabase("SmartGardenDB");
      }
    });
  }

  async createTestPlant(name: string = "Test Plant"): Promise<void> {
    await this.page.goto("/dashboard");
    await this.page.click('[data-testid="add-plant-button"]');
    await this.page.fill('[data-testid="plant-name-input"]', name);
    await this.page.selectOption(
      '[data-testid="variety-select"]',
      "basil-genovese"
    );
    await this.page.click('[data-testid="save-plant-button"]');
  }
}
