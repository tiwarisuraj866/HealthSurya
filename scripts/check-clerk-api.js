const { chromium } = require('playwright');

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('clerk.accounts.dev/v1/')) {
      console.log(`\nURL: ${url}`);
      console.log(`Status: ${response.status()}`);
      try {
        const text = await response.text();
        console.log(`Response Body (first 500 chars): ${text.slice(0, 500)}`);
      } catch (e) {
        console.log(`Could not read response text: ${e.message}`);
      }
    }
  });

  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.text()}`);
  });

  console.log("Navigating to https://healthsuryalaunch.vercel.app/login?nocache=1...");
  await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'load' });
  await page.waitForTimeout(6000);

  await browser.close();
  console.log("\nDone.");
}

run();
