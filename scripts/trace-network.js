const { chromium } = require('playwright');

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const requests = [];

  page.on('request', req => {
    requests.push({
      url: req.url(),
      method: req.method(),
      status: 'PENDING',
    });
  });

  page.on('requestfinished', req => {
    const entry = requests.find(r => r.url === req.url());
    if (entry) {
      try {
        const resp = req.response();
        if (resp) {
          entry.status = typeof resp.status === 'function' ? resp.status() : resp.status;
        } else {
          entry.status = 'FINISHED_NO_RESPONSE';
        }
      } catch (e) {
        entry.status = 'FINISHED_ERROR_GETTING_RESPONSE';
      }
    }
  });

  page.on('requestfailed', req => {
    const entry = requests.find(r => r.url === req.url());
    if (entry) {
      entry.status = `FAILED: ${req.failure().errorText}`;
    }
  });

  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.text()}`);
  });

  console.log("Navigating to https://healthsuryalaunch.vercel.app/login?nocache=1...");
  try {
    await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    console.log("Navigation error / timeout:", e.message);
  }

  console.log("Waiting 10 seconds for background requests to settle...");
  await page.waitForTimeout(10000);

  console.log("\nAll Requests Status:");
  console.log("--------------------");
  requests.forEach(r => {
    console.log(`${r.method} [${r.status}] ${r.url.slice(0, 120)}`);
  });

  await browser.close();
}

run();
