const { chromium } = require("./node_modules/@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on("pageerror", err => {
    console.log(`❌ JavaScript Error: ${err.message}`);
    console.log(`   Stack: ${err.stack.split('\n').slice(0, 3).join('\n')}`);
    errors.push(err.message);
  });
  
  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log(`🔴 Console error: ${msg.text()}`);
    }
  });
  
  try {
    console.log("📲 Loading http://localhost:3010/auth");
    await page.goto("http://localhost:3010/auth", { waitUntil: "networkidle" });
    console.log("✅ Page loaded, clicking button...");
    
    const startUrl = page.url();
    await page.click("button");
    await page.waitForTimeout(2000);
    const endUrl = page.url();
    
    console.log(`Start URL: ${startUrl}`);
    console.log(`End URL: ${endUrl}`);
    console.log(`Navigated: ${startUrl !== endUrl}`);
    
    if (errors.length === 0) {
      console.log("✅ No JavaScript errors detected!");
    }
    
  } catch (err) {
    console.error("Test error:", err.message);
  } finally {
    await browser.close();
  }
})();
