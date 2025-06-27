import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, "../../playwright/.auth/user.json");

async function globalSetup() {
  const browser = await chromium.launch({ headless: false }); // Run in headed mode to see what happens
  const page = await browser.newPage();

  try {
    console.log("🔧 Setting up authentication with existing user...");

    // Go to login page instead of root
    await page.goto("http://localhost:5173/");

    // Fill and submit login form with correct credentials
    await page.fill('input[type="email"]', "test123@example.com");
    await page.fill('input[type="password"]', "testpassword123");
    await page.click('button[type="submit"]');

    console.log("🔄 Login submitted, waiting...");

    // Wait longer for Firebase
    await page.waitForTimeout(3000); // 3 seconds

    // Save whatever state we have
    await page.context().storageState({ path: authFile });
    console.log("💾 Authentication state saved");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
