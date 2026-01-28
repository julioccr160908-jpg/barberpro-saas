
import { chromium } from 'playwright';

(async () => {
    console.log('=== STARTING BROWSER LOGIN TEST ===');
    // Launch browser (headless: false to see it)
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('1. Navigating to http://localhost:3000 ...');
        await page.goto('http://localhost:3000', { timeout: 15000 });

        // Check if we are already logged in or need to find login button
        // We expect a login form or a redirect to /login

        // Wait for email input or login button
        console.log('2. Waiting for login form...');
        try {
            // Try to find email input first
            await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        } catch (e) {
            console.log('   Email input not found immediately. Checking for "Login" button or "Entrar"...');

            // Try to find a link or button that says Login
            const loginBtn = page.getByRole('button', { name: /login|entrar/i }).first();
            const loginLink = page.getByRole('link', { name: /login|entrar/i }).first();

            if (await loginBtn.isVisible()) {
                console.log('   Found Login Button. Clicking...');
                await loginBtn.click();
                await page.waitForSelector('input[type="email"]');
            } else if (await loginLink.isVisible()) {
                console.log('   Found Login Link. Clicking...');
                await loginLink.click();
                await page.waitForSelector('input[type="email"]');
            } else {
                console.log('   Could not find login form/button. Checking if already logged in...');
                if (page.url().includes('dashboard')) {
                    console.log('   Already on dashboard!');
                }
            }
        }

        // Only fill if inputs are visible
        if (await page.locator('input[type="email"]').isVisible()) {
            console.log('3. Entering credentials...');
            await page.fill('input[type="email"]', 'julioccr1609@gmail.com');
            await page.fill('input[type="password"]', 'Julioccr2020');

            console.log('4. Submitting form...');
            const submitBtn = page.locator('button[type="submit"]');
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
            } else {
                // Fallback for button inside form
                await page.keyboard.press('Enter');
            }
        }

        console.log('5. Waiting for navigation/redirect...');
        // Wait for URL to verify we moved away from login
        try {
            // Condition: URL contains dashboard OR /admin AND DOES NOT contain login
            await page.waitForFunction(() => {
                const u = window.location.href;
                return (u.includes('dashboard') || u.includes('/admin')) && !u.includes('login');
            }, { timeout: 15000 });
        } catch (e) {
            console.log('   Wait for URL condition timeout. Checking current state...');
            // Double check if perhaps we got an error
            const errorMsg = await page.locator('.text-red-500, [role="alert"]').textContent().catch(() => null);
            if (errorMsg) {
                console.log(`   Error Message Found on Timeout: "${errorMsg}"`);
            }
        }

        const currentUrl = page.url();
        console.log(`   Current URL: ${currentUrl}`);

        if ((currentUrl.includes('dashboard') || currentUrl.includes('/admin')) && !currentUrl.includes('login')) {
            console.log('✅ LOGIN SUCCESS: Redirected to Dashboard/Admin area.');
            // Try to find "Super Admin" text
            const bodyText = await page.textContent('body');
            if (bodyText.includes('Visão Geral') || bodyText.includes('Agendamentos') || bodyText.includes('Super Admin')) {
                console.log('✅ Found Dashboard elements on page!');
            } else {
                console.log('⚠️ Warning: URL looks correct but did not find expected dashboard text.');
            }
        } else {
            console.log('❌ LOGIN FAILED or Redirect Missing.');
            const errorMsg = await page.locator('.text-red-500, [role="alert"]').textContent().catch(() => null);
            if (errorMsg) {
                console.log(`   Error Message Found: "${errorMsg}"`);
            }

            // Take screenshot on failure
            await page.screenshot({ path: 'login_failure_v2.png' });
        }

    } catch (error) {
        console.error('❌ EXCEPTION DURING TEST:', error);
        await page.screenshot({ path: 'test_exception.png' });
    } finally {
        console.log('=== TEST COMPLETE ===');
        console.log('👀 Browser will remain open for visual inspection.');
        console.log('❌ Press non-existant key or manually close the browser window to end.');
        // await browser.close(); // Commented out to keep browser open
        // Keep process alive forever (or until user kills it)
        await new Promise(() => { });
    }
})();
