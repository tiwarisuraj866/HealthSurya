const { chromium } = require('playwright');

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen to console events
  page.on('console', msg => {
    console.log(`[Browser Console - ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[Uncaught Page Error]: ${err.message}`);
    console.log(err.stack);
  });

  console.log("Navigating to https://healthsuryalaunch.vercel.app/login?nocache=1...");
  await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'load' });

  console.log("Waiting 5 seconds for initialization...");
  await page.waitForTimeout(5000);

  // Evaluate Clerk presence
  const clerkStatus = await page.evaluate(() => {
    return {
      hasClerk: typeof window.Clerk !== 'undefined',
      clerkLoaded: typeof window.Clerk !== 'undefined' && window.Clerk.isReady ? window.Clerk.isReady() : false,
      publishableKey: typeof window.Clerk !== 'undefined' ? window.Clerk.publishableKey : null,
      version: typeof window.Clerk !== 'undefined' ? window.Clerk.version : null,
    };
  });

  console.log("Clerk Status on Page:", clerkStatus);

  // Dump HTML of main content area
  const mainHtml = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerHTML.slice(0, 1000) : 'Main element not found';
  });

  console.log("Main element HTML (first 1000 chars):");
  console.log(mainHtml);

  await browser.close();
}

run();
