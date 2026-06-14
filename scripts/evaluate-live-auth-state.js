const { chromium } = require('playwright');

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[Browser Console - ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[Uncaught Page Error]: ${err.message}`);
  });

  console.log("Navigating to https://healthsuryalaunch.vercel.app/login?nocache=1...");
  await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'load' });

  console.log("Waiting 10 seconds for values to populate...");
  await page.waitForTimeout(10000);

  const variables = await page.evaluate(() => {
    return {
      __signInLoaded: typeof window.__signInLoaded !== 'undefined' ? window.__signInLoaded : 'undefined',
      __isClerkLoaded: typeof window.__isClerkLoaded !== 'undefined' ? window.__isClerkLoaded : 'undefined',
      __loadingProfile: typeof window.__loadingProfile !== 'undefined' ? window.__loadingProfile : 'undefined',
      __supabaseUser: typeof window.__supabaseUser !== 'undefined' ? !!window.__supabaseUser : 'undefined',
      __authLoading: typeof window.__authLoading !== 'undefined' ? window.__authLoading : 'undefined',
      __authProfile: typeof window.__authProfile !== 'undefined' ? !!window.__authProfile : 'undefined',
    };
  });

  console.log("\nExposed Auth State Variables:");
  console.log("------------------------------");
  console.log(JSON.stringify(variables, null, 2));

  await browser.close();
}

run();
