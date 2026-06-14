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

  page.on('request', req => {
    // Only trace Clerk or API requests to keep log clean
    const url = req.url();
    if (url.includes('clerk') || url.includes('supabase') || url.includes('api')) {
      console.log(`[Request] -> ${req.method()} ${url}`);
    }
  });

  page.on('response', res => {
    const url = res.url();
    if (url.includes('clerk') || url.includes('supabase') || url.includes('api')) {
      console.log(`[Response] <- ${res.status()} ${url}`);
    }
  });

  console.log("Navigating to https://healthsuryalaunch.vercel.app/login?nocache=1...");
  await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'load' });

  console.log("Waiting 10 seconds...");
  await page.waitForTimeout(10000);

  await browser.close();
  console.log("Done.");
}

run();
