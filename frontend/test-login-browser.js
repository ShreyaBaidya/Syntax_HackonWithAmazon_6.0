const { chromium } = require("./node_modules/@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Log all network errors
  page.on("requestfailed", req => {
    console.log(`❌ Request failed: ${req.url()}`);
    console.log(`   Error: ${req.failure().errorText}`);
  });
  
  page.on("response", res => {
    if (!res.ok()) {
      console.log(`⚠️ Response ${res.status()}: ${res.url()}`);
    }
  });
  
  try {
    console.log("📲 Loading auth page at http://localhost:3010/auth...");
    await page.goto("http://localhost:3010/auth", { waitUntil: "networkidle", timeout: 10000 });
    console.log("✅ Page loaded");
    
    const buttons = await page.locator("button").count();
    console.log(`📱 Found ${buttons} buttons`);
    
    // Try clicking first button
    console.log("🖱️ Clicking Ravi Kumar button...");
    await page.locator("button").first().click();
    
    console.log("⏳ Waiting 3 seconds for response...");
    await page.waitForTimeout(3000);
    
    const url = page.url();
    console.log(`📍 Current URL: ${url}`);
    
    // Check for error message
    const errorText = await page.locator("text=/⚠️|Error|failed/").first().textContent().catch(() => null);
    if (errorText) {
      console.log(`⚠️ Error shown: ${errorText}`);
    }
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await browser.close();
  }
})();
