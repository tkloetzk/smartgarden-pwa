import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * 
 * This runs once before all tests to set up the test environment.
 */
async function globalSetup(config: FullConfig) {
  // Launch browser to verify setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Verify the dev server is running by making a simple request
    console.log('🔧 Checking if dev server is running...');
    const response = await page.goto(config.projects[0].use.baseURL || 'http://localhost:5173');
    
    if (!response || !response.ok()) {
      throw new Error(`Dev server not responding at ${config.projects[0].use.baseURL}. Make sure to run 'npm run dev' first.`);
    }
    
    console.log('✅ Dev server is running and responsive');
    
    // Optionally: Set up test database, clear caches, etc.
    // For now, we'll just verify the server is up
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
