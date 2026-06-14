const { chromium } = require('playwright');

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[Browser Console - ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[Uncaught Page Error]: ${err.stack || err.message}`);
  });

  console.log("Navigating to http://localhost:3000/login...");
  try {
    const response = await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
    console.log("Response status:", response.status());

    console.log("Waiting 5 seconds...");
    await page.waitForTimeout(5000);

    const html = await page.content();
    console.log("Page HTML content length:", html.length);
    
    const spinnerExists = await page.evaluate(() => {
      return !!document.querySelector('.animate-spin');
    });
    console.log("Spinner exists:", spinnerExists);
    console.log("Body inner text:", await page.evaluate(() => document.body.innerText));
  } catch (err) {
    console.error("Navigation / execution failed:", err);
  }

  await browser.close();
}

run();
