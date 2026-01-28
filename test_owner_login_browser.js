
import { chromium } from 'playwright';

(async () => {
    console.log('=== STARTING OWNER LOGIN TEST (dono1) ===');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // USING 127.0.0.1 INSTEAD OF LOCALHOST
        console.log('1. Navigating to http://127.0.0.1:3000 ...');
        await page.goto('http://127.0.0.1:3000', { timeout: 15000 });

        try {
            await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        } catch (e) {
            const loginBtn = page.getByRole('button', { name: /login|entrar/i }).first();
            if (await loginBtn.isVisible()) await loginBtn.click();
        }

        if (await page.locator('input[type="email"]').isVisible()) {
            console.log('Entering credentials for dono1...');
            await page.fill('input[type="email"]', 'dono1@gmail.com');
            await page.fill('input[type="password"]', '123456');

            console.log('Submitting form...');
            const submitBtn = page.locator('button[type="submit"]');
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
            } else {
                await page.keyboard.press('Enter');
            }
        }

        console.log('Waiting for response...');
        try {
            await page.waitForURL((url) => {
                const u = url.toString();
                return (u.includes('dashboard') || u.includes('admin')) && !u.includes('login');
            }, { timeout: 20000 });

            console.log('✅ LOGIN SUCCESS: Redirected!');
        } catch (e) {
            console.log('❌ Timeout or Error waiting for redirect.');
            const errorMsg = await page.locator('.text-red-500, [role="alert"]').textContent().catch(() => null);
            console.log(`   Error Message on Page: "${errorMsg}"`);
            await page.screenshot({ path: 'dono1_login_failure_v2.png' });
        }

    } catch (error) {
        console.error('❌ EXCEPTION:', error);
    } finally {
        console.log('=== TEST COMPLETE ===');
        await browser.close();
    }
})();
