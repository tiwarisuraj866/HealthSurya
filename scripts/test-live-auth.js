const { chromium } = require('playwright');
const path = require('path');

async function run() {
  console.log("Launching headless browser via Playwright...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console events
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Listen to failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()}: ${request.failure().errorText}`);
  });

  const brainDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\6cd011ca-5f1a-4112-bb53-6a57a7bffb77';

  // 1. Test Register page
  console.log("Navigating to live Register page...");
  try {
    await page.goto('https://healthsuryalaunch.vercel.app/register?nocache=1', { waitUntil: 'load' });
    // Wait for the form card to be visible (should clear the spinner)
    console.log("Waiting for registration form card...");
    await page.waitForSelector('form', { timeout: 15000 });
    console.log("✅ Register page loaded successfully!");
    
    const screenshotPath = path.join(brainDir, 'live_register_loaded.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to ${screenshotPath}`);
  } catch (err) {
    console.error("❌ Register page failed to load:", err.message);
    const screenshotPath = path.join(brainDir, 'live_register_error.png');
    await page.screenshot({ path: screenshotPath });
  }

  // 2. Test Login page
  console.log("\nNavigating to live Login page...");
  try {
    await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'networkidle' });
    console.log("Waiting for login form...");
    await page.waitForSelector('form', { timeout: 15000 });
    console.log("✅ Login page loaded successfully!");

    const screenshotPath = path.join(brainDir, 'live_login_loaded.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to ${screenshotPath}`);
  } catch (err) {
    console.error("❌ Login page failed to load:", err.message);
    const screenshotPath = path.join(brainDir, 'live_login_error.png');
    await page.screenshot({ path: screenshotPath });
  }

  console.log("\nConsole Logs captured during session:");
  console.log("-------------------------------------");
  consoleLogs.forEach(log => console.log(log));

  console.log("\nFailed Requests captured during session:");
  console.log("-----------------------------------------");
  failedRequests.forEach(req => console.log(req));

  await browser.close();
  console.log("Done.");
}

run();
