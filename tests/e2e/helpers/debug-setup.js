import { chromium } from "@playwright/test";

async function debugSetup() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("🔍 Debugging your app...");

    // Check if dev server is running
    await page.goto("http://localhost:5173/");
    await page.waitForTimeout(2000);

    console.log("📍 Current URL:", page.url());
    console.log("📋 Page title:", await page.title());

    // Try different possible login routes
    const routes = ["/login", "/auth", "/signin", "/sign-in", "/"];

    for (const route of routes) {
      try {
        console.log(`🚀 Trying route: ${route}`);
        await page.goto(`http://localhost:5173${route}`);
        await page.waitForTimeout(1000);

        const currentUrl = page.url();
        console.log(`📍 Result URL: ${currentUrl}`);

        // Look for form elements
        const emailInputs = await page.locator('input[type="email"]').count();
        const passwordInputs = await page
          .locator('input[type="password"]')
          .count();
        const allInputs = await page.locator("input").count();

        console.log(`📝 Email inputs found: ${emailInputs}`);
        console.log(`🔒 Password inputs found: ${passwordInputs}`);
        console.log(`🔢 Total inputs found: ${allInputs}`);

        if (emailInputs > 0 || passwordInputs > 0) {
          console.log("✅ Found form elements at:", route);

          // Get the actual HTML to see the structure
          const formHtml = await page
            .locator("form")
            .first()
            .innerHTML()
            .catch(() => "No form found");
          console.log("📄 Form HTML:", formHtml);

          break;
        }
      } catch (error) {
        console.log(`❌ Route ${route} failed:`, error.message);
      }
    }

    console.log("🔍 Debug complete. Check the console output above.");
  } catch (error) {
    console.error("❌ Debug setup failed:", error);
  } finally {
    await browser.close();
  }
}

// Run the debug function
debugSetup().catch(console.error);
