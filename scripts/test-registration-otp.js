const { chromium } = require('playwright');
const path = require('path');

async function run() {
  console.log("Launching headless browser...");
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

  // Listen to response details
  page.on('response', async response => {
    if (response.url().includes('/auth/v1/')) {
      console.log(`[Supabase Auth API] Response: ${response.status()} ${response.url()}`);
      try {
        const text = await response.text();
        console.log(`[Supabase Auth API] Response Body: ${text}`);
      } catch (e) {}
    }
  });

  console.log("Navigating to live Register page...");
  try {
    await page.goto('https://healthsurya.com/register?nocache=1', { waitUntil: 'load' });
    await page.waitForSelector('form', { timeout: 15000 });
    console.log("Register page loaded.");

    // Fill form
    await page.fill('#reg-name', 'Live Test User');
    const randomEmail = `live_test_${Date.now()}@healthsurya.com`;
    await page.fill('#reg-email', randomEmail);
    await page.fill('#reg-phone', '9876543210');

    // Agree to terms
    console.log("Checking agreement checkboxes...");
    await page.check('#terms-consent');
    await page.check('#privacy-consent');

    // Extract captcha code
    console.log("Extracting captcha code...");
    const captchaSelector = 'div.font-mono.text-lg.font-bold';
    await page.waitForSelector(captchaSelector);
    const captchaCode = await page.$eval(captchaSelector, el => el.innerText.trim());
    console.log(`Found captcha code: "${captchaCode}"`);

    await page.fill('#login-captcha', captchaCode);

    // Submit form
    console.log("Submitting form...");
    await page.click('button[type="submit"]');

    // Wait 5 seconds to see results
    console.log("Waiting for network responses and toasts...");
    await page.waitForTimeout(5000);

    // Take screenshot of state
    const screenshotPath = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\6cd011ca-5f1a-4112-bb53-6a57a7bffb77\\live_register_submit_result.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to ${screenshotPath}`);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    console.log("\nConsole Logs captured during session:");
    console.log("-------------------------------------");
    consoleLogs.forEach(log => console.log(log));
    
    await browser.close();
    console.log("Done.");
  }
}

run();
