import { chromium } from 'playwright';

const SCREENSHOT_DIR = './screenshots';
const BASE_URL = 'http://localhost:3000';

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  console.log('📸 Capturing screenshots...\n');

  // 1. Home page - empty state
  console.log('1. Home page (empty state)');
  await page.goto(BASE_URL);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-home-empty.png`, fullPage: true });

  // 2. Create an event and go to event page
  console.log('2. Creating new event...');
  await page.click('button:has-text("Create New Event")');
  await page.waitForURL(/\/event\//);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-event-empty.png`, fullPage: true });

  // 3. Add some guests
  console.log('3. Adding guests...');
  const guests = [
    { name: 'Alice Johnson', dept: 'Engineering' },
    { name: 'Bob Smith', dept: 'Engineering' },
    { name: 'Carol White', dept: 'Design' },
    { name: 'David Brown', dept: 'Design' },
    { name: 'Emma Davis', dept: 'Marketing' },
    { name: 'Frank Miller', dept: 'Marketing' },
    { name: 'Grace Wilson', dept: 'Sales' },
    { name: 'Henry Taylor', dept: 'Sales' },
    { name: 'Ivy Anderson', dept: 'HR' },
    { name: 'Jack Thomas', dept: 'HR' },
  ];

  for (const guest of guests) {
    await page.fill('#name', guest.name);
    await page.fill('#department', guest.dept);
    await page.click('button:has-text("Add Guest")');
    await page.waitForTimeout(200);
  }

  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-event-with-guests.png`, fullPage: true });

  // 4. Assign tables
  console.log('4. Assigning tables...');
  await page.click('button:has-text("Randomize Tables")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-tables-assigned.png`, fullPage: true });

  // 5. By Guest view
  console.log('5. By Guest view...');
  await page.click('button:has-text("By Guest")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-by-guest-view.png`, fullPage: true });

  // 5b. Expand a QR code to show the collapsible feature
  console.log('5b. Show expanded QR...');
  await page.click('text=Show QR Code');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05b-guest-qr-expanded.png`, fullPage: false });

  // 6. Mobile viewport - Home
  console.log('6. Mobile view - Home...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-mobile-home.png`, fullPage: true });

  // 7. Mobile viewport - Event
  console.log('7. Mobile view - Event...');
  await page.click('text=New Event');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07-mobile-event.png`, fullPage: true });

  await browser.close();
  console.log('\n✅ Screenshots saved to ./screenshots/');
}

// Create screenshots directory
import { mkdirSync, existsSync } from 'fs';
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR);
}

captureScreenshots().catch(console.error);
