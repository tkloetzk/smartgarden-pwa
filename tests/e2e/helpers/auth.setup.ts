import { test as setup } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate with existing user", async ({ page }) => {
  console.log("🔑 Authenticating with test user...");

  // Go directly to login page
  await page.goto("/login");

  // Fill and submit login form with correct credentials
  await page.fill('input[type="email"]', "test123@example.com");
  await page.fill('input[type="password"]', "testpassword123");
  await page.click('button[type="submit"]');

  console.log("🔄 Login submitted, waiting for Firebase auth...");

  // Wait for Firebase authentication
  await page.waitForTimeout(8000);

  // Save authentication state regardless of exact success indicators
  await page.context().storageState({ path: authFile });
  console.log("💾 Authentication state saved");
});
