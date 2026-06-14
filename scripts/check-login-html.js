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

  console.log("Navigating to https://healthsuryalaunch.vercel.app/login?nocache=1...");
  const response = await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'load' });
  console.log("Response status:", response.status());

  await page.waitForTimeout(5000);

  const html = await page.content();
  console.log("Page HTML content length:", html.length);
  
  // check if spinner or loader is present
  const spinnerExists = await page.evaluate(() => {
    return !!document.querySelector('.animate-spin');
  });
  console.log("Spinner exists:", spinnerExists);
  console.log("Body inner text length:", (await page.evaluate(() => document.body.innerText)).length);
  console.log("Body inner text:", await page.evaluate(() => document.body.innerText));

  await browser.close();
}

run();
