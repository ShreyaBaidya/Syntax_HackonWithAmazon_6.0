/**
 * Playwright screenshot script — Amazon Now UI final
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('./screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

// Hide Next.js dev overlay in all pages
const hideDevOverlay = async () => {
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay],
      [data-nextjs-dialog], #nextjs-portal-container,
      [class*="nextjs-portal"], [class*="nextjs__container"] {
        display: none !important;
      }
    `
  });
};

// ── Home page ──────────────────────────────────────────────────────────────
await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await hideDevOverlay();
await page.waitForTimeout(500);

await page.screenshot({ path: './screenshots/01-home-top.png' });
console.log('✅ 01-home-top.png — Header + banners + categories');

await page.evaluate(() => window.scrollTo({ top: 340, behavior: 'instant' }));
await page.waitForTimeout(300);
await hideDevOverlay();
await page.screenshot({ path: './screenshots/02-product-grid.png' });
console.log('✅ 02-product-grid.png — Product catalog grid');

await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(200);
await hideDevOverlay();
await page.screenshot({ path: './screenshots/03-full-page.png', fullPage: true });
console.log('✅ 03-full-page.png — Complete page');

// ── NowSpeak page ──────────────────────────────────────────────────────────
await page.goto('http://localhost:3000/nowspeak', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1500);
await hideDevOverlay();
await page.screenshot({ path: './screenshots/04-nowspeak.png' });
console.log('✅ 04-nowspeak.png — NowSpeak voice + chat UI');

await browser.close();
console.log('\n📸 Done → frontend/screenshots/');
