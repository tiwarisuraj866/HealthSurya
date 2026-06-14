const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to live login...");
  await page.goto('https://healthsuryalaunch.vercel.app/login?nocache=1', { waitUntil: 'load' });
  await page.waitForTimeout(5000);

  const mainHtml = await page.evaluate(() => {
    const main = document.querySelector('main');
    return main ? main.innerHTML : 'No main element found';
  });

  console.log("Main element HTML:");
  console.log("------------------");
  console.log(mainHtml);
  console.log("------------------");

  await browser.close();
}

run();
