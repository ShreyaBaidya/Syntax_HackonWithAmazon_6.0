const { chromium } = require("./node_modules/@playwright/test");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on("console", msg => {
    if (msg.type() !== "log") {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  try {
    console.log("1️⃣ Navigate to auth page...");
    await page.goto("http://localhost:3010/auth", { waitUntil: "domcontentloaded" });
    
    console.log("2️⃣ Click Ravi Kumar button...");
    await page.click("button:has-text('Ravi Kumar')");
    
    console.log("3️⃣ Wait for navigation...");
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 5000 });
    
    const url = page.url();
    console.log(`✅ Navigated to: ${url}`);
    
    const user = await page.evaluate(() => localStorage.getItem("amazon_now_user"));
    if (user) {
      const userData = JSON.parse(user);
      console.log(`✅ User stored in localStorage: ${userData.name}`);
    } else {
      console.log(`❌ No user in localStorage`);
    }
    
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  } finally {
    await browser.close();
  }
})();
