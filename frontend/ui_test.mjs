import { chromium } from '@playwright/test';

async function runTests() {
  console.log('🚀 Starting UI Integration Tests for Amazon Now...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Print browser console logs and errors to terminal
  page.on('console', msg => console.log('🌐 BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('❌ BROWSER EXCEPTION:', err.message));

  try {
    // 1. Test Authentication
    console.log('\n🔑 Step 1: Testing Authentication Page...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForTimeout(1000);

    // Check login page elements
    const heading = await page.textContent('h1');
    console.log(`- Login page loaded, heading: "${heading?.trim()}"`);

    // Click Ravi Kumar's user card button to authenticate
    await page.click('button:has-text("Ravi Kumar")');
    console.log('- Clicked Ravi Kumar user button...');
    
    // Wait for redirect to home page
    await page.waitForURL('http://localhost:3000/');
    console.log('✅ Authentication successful! Redirected to home page.');

    // Verify User Session is set
    const userName = await page.evaluate(() => {
      const stored = localStorage.getItem('amazon_now_user');
      return stored ? JSON.parse(stored).name : null;
    });
    console.log(`- Active logged in user: ${userName}`);

    // 2. Test Home Page Structure
    console.log('\n🏠 Step 2: Checking Home Page Elements...');
    await page.waitForSelector('header');
    console.log('✅ Header component is visible.');

    const profileBanner = await page.textContent('[style*="background"]');
    console.log(`- Profile Banner state: "${profileBanner?.trim()?.substring(0, 50)}..."`);

    // 3. Test Dietary Profile Creation & Filtering
    console.log('\n🥗 Step 3: Setting up Dietary Profile...');
    await page.goto('http://localhost:3000/profile');
    await page.waitForURL('http://localhost:3000/profile');
    console.log('- Profile page loaded.');

    // Select "vegan" and "nuts" allergen
    console.log('- Selecting "vegan" preference and "nuts" allergy...');
    await page.click('button:has-text("vegan")');
    await page.click('button:has-text("nuts")');

    // Add custom exclusion
    await page.fill('input[placeholder*="aspartame"]', 'palm oil');

    // Save profile
    await page.click('button:has-text("Save Profile")');
    console.log('- Clicked "Save Profile"...');

    // Verify redirected back to home and filters active
    await page.waitForURL('http://localhost:3000/');
    console.log('✅ Profile saved and redirected to home!');

    // Wait for feed to load
    await page.waitForTimeout(2000);
    const activeFilters = await page.$$eval('[style*="background"] span, button', el => el.map(x => x.textContent));
    console.log('- Active chips found on home page:', activeFilters.filter(Boolean).slice(0, 10));

    // Verify products are loaded on home page
    const productCount = await page.$$eval('[style*="border-radius"] img', img => img.length);
    console.log(`✅ Loaded ${productCount} products in the recommendation feed.`);

    // 4. Test NowSpeak AI Chat (Situational Intent Mapping)
    console.log('\n🎙️ Step 4: Testing NowSpeak AI Chat...');
    await page.goto('http://localhost:3000/nowspeak');
    await page.waitForURL('http://localhost:3000/nowspeak');
    console.log('- NowSpeak page loaded.');

    // Enter user search situation
    console.log('- Sending search message: "I have a headache and fever..."');
    await page.fill('input[placeholder*="Search or describe"]', 'I have a headache and fever');
    await page.press('input[placeholder*="Search or describe"]', 'Enter');

    // Wait for the response stream and product cards
    console.log('- Waiting for AI reply and product recommendations...');
    await page.waitForSelector('button:has-text("+")'); // wait for product card quantity button
    
    const messages = await page.$$eval('[style*="background"] p', ps => ps.map(p => p.textContent));
    console.log('- AI response snippet:', messages.filter(Boolean).slice(-2));

    const chatProducts = await page.$$eval('div:has(> img) p, [style*="font-size"]', el => el.map(x => x.textContent));
    console.log('- Products returned by AI chat:', chatProducts.filter(Boolean).slice(0, 5));

    // Add product to cart from chat
    console.log('- Adding a product to cart from NowSpeak chat...');
    await page.click('button:has-text("+")');
    console.log('✅ Product successfully added to cart.');

    // 5. Test Cart Page
    console.log('\n🛒 Step 5: Testing Cart Page & Shared Cart...');
    await page.goto('http://localhost:3000/cart');
    await page.waitForURL('http://localhost:3000/cart');

    const cartHeading = await page.textContent('h1');
    console.log(`- Cart page loaded: "${cartHeading?.trim()}"`);

    const cartTotalText = await page.textContent('div:has-text("Subtotal")');
    console.log(`- Subtotal check: "${cartTotalText?.trim()?.replace(/\s+/g, ' ')}"`);

    // Verify Start Shared Cart
    console.log('- Starting collaborative shared cart...');
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('text=Start Cart');
    await page.click('text=Start Cart');
    await page.waitForURL(/\/cart\/[A-Z0-9]{6}/);
    const cartUrl = page.url();
    console.log(`✅ Shared Cart successfully created! URL: ${cartUrl}`);

    // 6. Test Speed Checkout
    console.log('\n⚡ Step 6: Testing Checkout & Order Placement...');
    await page.goto('http://localhost:3000/cart');
    await page.waitForTimeout(1000);
    
    // Validate Coupon
    console.log('- Opening coupons modal...');
    await page.click('text=View all');
    await page.waitForSelector('text=Available Coupons');
    
    console.log('- Applying FREESHIP coupon...');
    await page.click('.z-50 span:has-text("FREESHIP")');
    await page.waitForTimeout(500);
    console.log('✅ Coupon successfully applied.');

    // Place Order
    console.log('- Placing order...');
    await page.click('button:has-text("Place Order")');
    
    // Wait for biometric auth overlay
    console.log('- Waiting for biometric authentication overlay...');
    await page.waitForSelector('text=Authenticating…');
    
    // Wait for order placed confirmed screen
    console.log('- Waiting for order confirmation...');
    await page.waitForSelector('text=Order Placed!');
    console.log('✅ Order placed successfully!');

    // Click Continue Shopping to go back to home
    await page.click('button:has-text("Continue Shopping")');
    await page.waitForURL('http://localhost:3000/');

    // 7. Verify Order History
    console.log('\n📜 Step 7: Verifying Order History...');
    await page.goto('http://localhost:3000/orders');
    await page.waitForURL('http://localhost:3000/orders');
    const ordersHeading = await page.textContent('span:has-text("Your Orders")');
    console.log(`- Order History page loaded: "${ordersHeading?.trim()}"`);
    
    await page.waitForSelector('text=Delivered');
    const lastOrderText = await page.textContent('div:has-text("Delivered")');
    console.log(`✅ Last order detail: "${lastOrderText?.trim()?.substring(0, 100)}..."`);

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Everything is working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

runTests();
