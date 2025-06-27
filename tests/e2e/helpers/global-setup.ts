import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../../playwright/.auth/user.json");

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log("🔧 Setting up authentication...");

    await page.goto("http://localhost:5173/", { timeout: 10000 });
    console.log("✅ Dev server is running");

    // Navigate to login page
    await page.goto("http://localhost:5173/login");
    console.log("✅ Found login form at: /login");

    // Fill login form
    console.log("📝 Filling login form...");
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill("test@example.com");
    await passwordInput.fill("testpassword123");

    console.log("📧 Email and password filled");

    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    console.log("🔄 Login submitted, waiting for Firebase auth...");

    // Wait a moment for any immediate feedback
    await page.waitForTimeout(2000);

    // Check for validation errors first
    const errorSelectors = [
      '[data-testid*="error"]',
      ".error",
      '[role="alert"]',
      'text="Invalid"',
      'text="incorrect"',
      'text="not found"',
      'text="failed"',
      ".text-red-500", // Tailwind error text
      ".text-destructive", // shadcn error text
    ];

    let hasErrors = false;
    for (const selector of errorSelectors) {
      try {
        const errorElement = page.locator(selector);
        if ((await errorElement.count()) > 0) {
          const errorText = await errorElement.first().textContent();
          console.log(`❌ Found error: ${errorText}`);
          hasErrors = true;
        }
      } catch (error) {
        console.log(error);
        // Ignore, try next selector
      }
    }

    if (hasErrors) {
      console.log("🔧 Errors found, attempting to create test user...");
      await createTestUser(page);
      return;
    }

    // Wait for Firebase auth to complete (can be slow)
    console.log("⏳ Waiting for Firebase authentication...");

    // Try multiple success detection strategies
    const maxWaitTime = 15000; // 15 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Check URL change
      const currentUrl = page.url();
      if (!currentUrl.includes("/login")) {
        console.log(`✅ URL changed to: ${currentUrl}`);
        break;
      }

      // Check for dashboard/authenticated content
      const authIndicators = [
        '[data-testid*="dashboard"]',
        '[data-testid*="user"]',
        'text="Dashboard"',
        'text="Welcome"',
        'text="Plants"',
        'text="Add Plant"',
        'text="Logout"',
        'text="Sign Out"',
      ];

      for (const indicator of authIndicators) {
        try {
          const element = page.locator(indicator);
          if ((await element.count()) > 0) {
            console.log(`✅ Found auth indicator: ${indicator}`);
            await page.context().storageState({ path: authFile });
            console.log("💾 Authentication state saved");
            return;
          }
        } catch (error) {
          console.log(error);
          // Continue checking
        }
      }

      // Wait a bit before next check
      await page.waitForTimeout(1000);
    }

    // If we get here, try one more time to check current state
    console.log("🔍 Final verification...");
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);

    // Take a screenshot for debugging
    await page.screenshot({ path: "debug-login-state.png" });
    console.log("📸 Debug screenshot saved as debug-login-state.png");

    // Check if we're actually logged in by looking at the page content
    const pageContent = await page.content();
    if (
      pageContent.includes("dashboard") ||
      pageContent.includes("plants") ||
      !pageContent.includes("password")
    ) {
      console.log("✅ Appears to be logged in based on page content");
      await page.context().storageState({ path: authFile });
      console.log("💾 Authentication state saved");
      return;
    }

    // If still failing, try to create user
    console.log(
      "🔧 Login verification inconclusive, attempting to create test user..."
    );
    await createTestUser(page);
  } catch (error) {
    console.error("❌ Authentication setup failed:", error);

    // Take a screenshot for debugging
    try {
      await page.screenshot({ path: "debug-auth-error.png" });
      console.log("📸 Error screenshot saved as debug-auth-error.png");
    } catch (screenshotError) {
      console.error(screenshotError);
      // Ignore screenshot errors
    }

    throw error;
  } finally {
    await browser.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createTestUser(page: any) {
  try {
    console.log("👤 Attempting to create test user...");

    // First try to find a registration/signup link
    const signupSelectors = [
      'text="Sign up"',
      'text="Create account"',
      'text="Register"',
      'a[href*="register"]',
      'a[href*="signup"]',
      'a[href*="sign-up"]',
    ];

    let foundSignupLink = false;
    for (const selector of signupSelectors) {
      try {
        const element = page.locator(selector);
        if ((await element.count()) > 0) {
          await element.click();
          foundSignupLink = true;
          console.log(`✅ Found and clicked signup link: ${selector}`);
          break;
        }
      } catch (error) {
        console.error(error);
        // Try next selector
      }
    }

    if (!foundSignupLink) {
      // Try navigating directly to common signup routes
      const signupRoutes = ["/register", "/signup", "/sign-up"];
      for (const route of signupRoutes) {
        try {
          await page.goto(`http://localhost:5173${route}`);
          await page.waitForTimeout(1000);

          // Check if this looks like a signup page
          const hasEmailInput =
            (await page.locator('input[type="email"]').count()) > 0;
          const hasPasswordInput =
            (await page.locator('input[type="password"]').count()) > 0;

          if (hasEmailInput && hasPasswordInput) {
            console.log(`✅ Found signup page at: ${route}`);
            foundSignupLink = true;
            break;
          }
        } catch (error) {
          console.error(error);
          // Try next route
        }
      }
    }

    if (!foundSignupLink) {
      console.log("❌ No signup page found, cannot create test user");
      throw new Error("Cannot create test user - no signup page found");
    }

    // Fill signup form
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    const nameInput = page.locator('input[type="text"]').first();

    // Fill name if exists
    if ((await nameInput.count()) > 0) {
      await nameInput.fill("Test User");
      console.log("📝 Name filled");
    }

    await emailInput.fill("test@example.com");
    await passwordInput.fill("testpassword123");

    // Fill confirm password if exists
    if ((await confirmPasswordInput.count()) > 0) {
      await confirmPasswordInput.fill("testpassword123");
      console.log("🔒 Confirm password filled");
    }

    console.log("📝 Signup form filled");

    // Submit signup form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    console.log("🔄 Signup submitted, waiting for completion...");

    // Wait for signup to complete
    await page.waitForTimeout(5000);

    // Check if signup was successful
    const currentUrl = page.url();
    if (!currentUrl.includes("register") && !currentUrl.includes("signup")) {
      console.log("✅ Signup appears successful");
      await page.context().storageState({ path: authFile });
      console.log("💾 Authentication state saved after signup");
      return;
    }

    // If signup didn't redirect, check for success indicators
    const successIndicators = [
      '[data-testid*="dashboard"]',
      'text="Welcome"',
      'text="Dashboard"',
    ];

    for (const indicator of successIndicators) {
      if ((await page.locator(indicator).count()) > 0) {
        console.log("✅ Found success indicator after signup");
        await page.context().storageState({ path: authFile });
        console.log("💾 Authentication state saved");
        return;
      }
    }

    console.log("⚠️ Signup completed but verification uncertain");
    await page.context().storageState({ path: authFile });
    console.log("💾 Authentication state saved anyway");
  } catch (error) {
    console.error("❌ Failed to create test user:", error);
    throw error;
  }
}

export default globalSetup;
