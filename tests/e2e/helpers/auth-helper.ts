import { Page } from "@playwright/test";

export interface TestUser {
  email: string;
  password: string;
  name?: string;
}

export const TEST_USER: TestUser = {
  email: "test123@example.com", // Updated to match your test user
  password: "testpassword123",
  name: "Test User",
};

export class AuthHelper {
  constructor(private page: Page) {}

  async login(user: TestUser = TEST_USER): Promise<void> {
    await this.page.goto("/"); // Go to login page directly

    // Use more flexible selectors since we don't know if data-testid exists
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);
    await this.page.click('button[type="submit"]');

    // Wait for redirect (adjust based on your actual success page)
    await this.page.waitForTimeout(5000);

    // More flexible success check
    const currentUrl = this.page.url();
    if (!currentUrl.includes("/")) {
      console.log("✅ Login successful, redirected to:", currentUrl);
    }
  }

  async logout(): Promise<void> {
    // Use more flexible selectors
    const userMenuSelector =
      '[data-testid="user-menu"], .user-menu, text="Logout", text="Sign Out"';
    await this.page.click(userMenuSelector);

    const logoutSelector =
      '[data-testid="logout-button"], text="Logout", text="Sign Out"';
    await this.page.click(logoutSelector);

    await this.page.waitForURL("**/");
  }

  async ensureLoggedIn(): Promise<void> {
    // Check if we're already logged in by looking for login-specific elements
    const isOnLoginPage = this.page.url().includes("/login");
    const hasLoginForm =
      (await this.page.locator('input[type="password"]').count()) > 0;

    if (isOnLoginPage || hasLoginForm) {
      await this.login();
    }
  }

  async createTestAccount(user: TestUser): Promise<void> {
    await this.page.goto("/register");

    if (user.name) {
      await this.page.fill('input[type="text"]', user.name);
    }
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);

    // Look for confirm password field
    const passwordInputs = this.page.locator('input[type="password"]');
    if ((await passwordInputs.count()) > 1) {
      await passwordInputs.nth(1).fill(user.password);
    }

    await this.page.click('button[type="submit"]');

    // Wait for successful registration
    await this.page.waitForTimeout(5000);
  }
}
