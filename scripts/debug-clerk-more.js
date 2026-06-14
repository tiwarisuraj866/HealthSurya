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
    console.log(err.stack);
  });

  console.log("Navigating to https://healthsuryalaunch.vercel.app/login?nocache=1...");
  await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'load' });

  console.log("Waiting 10 seconds for Clerk to settle...");
  await page.waitForTimeout(10000);

  const debugInfo = await page.evaluate(() => {
    const info = {
      clerkExists: typeof window.Clerk !== 'undefined',
      clerkKeys: [],
      clerkInstanceDetails: {},
      cookies: document.cookie,
      bodyClasses: document.body.className,
      clerkCookie: null,
    };

    if (window.Clerk) {
      info.clerkKeys = Object.keys(window.Clerk);
      try {
        info.clerkInstanceDetails = {
          isReady: typeof window.Clerk.isReady === 'function' ? window.Clerk.isReady() : 'no isReady fn',
          publishableKey: window.Clerk.publishableKey,
          frontendApi: window.Clerk.frontendApi,
          instance: window.Clerk.instance ? Object.keys(window.Clerk.instance) : null,
          user: window.Clerk.user ? { id: window.Clerk.user.id } : null,
          session: window.Clerk.session ? { id: window.Clerk.session.id } : null,
        };
      } catch (err) {
        info.clerkInstanceDetails = { error: err.message };
      }
    }
    return info;
  });

  console.log("\nExtended Clerk Debug Info:");
  console.log("---------------------------");
  console.log(JSON.stringify(debugInfo, null, 2));

  await browser.close();
}

run();
