const { chromium } = require("./node_modules/@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log("Testing Shreya Sharma login...");
    await page.goto("http://localhost:3010/auth", { waitUntil: "domcontentloaded" });
    
    // Click second button (Shreya)
    const buttons = await page.locator("button").all();
    await buttons[1].click();
    
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 5000 });
    
    const user = await page.evaluate(() => {
      const u = localStorage.getItem("amazon_now_user");
      return u ? JSON.parse(u).name : null;
    });
    
    console.log(`✅ Successfully logged in as: ${user}`);
    console.log(`✅ Current URL: ${page.url()}`);
    
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
