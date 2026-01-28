
import { chromium } from 'playwright';

(async () => {
    console.log('=== VISUAL VERIFICATION: OWNER LOGIN (dono1) ===');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // VISUAL TEST in ADMIN MODE
        console.log('1. Opening Login Page in Visual Mode (http://127.0.0.1:3000/login?role=admin)...');
        await page.goto('http://127.0.0.1:3000/login?role=admin');

        // Fill credentials but wait for user to see
        console.log('2. Filling credentials...');
        await page.waitForTimeout(1000);
        await page.fill('input[type="email"]', 'dono1@gmail.com');
        await page.waitForTimeout(500);
        await page.fill('input[type="password"]', '123456');

        console.log('3. Logging in...');
        await page.waitForTimeout(1000);

        // Click button
        const btn = page.locator('button', { hasText: 'Entrar no Painel' });
        if (await btn.isVisible()) await btn.click();
        else await page.keyboard.press('Enter');

        console.log('4. Waiting for dashboard...');
        await page.waitForURL((url) => {
            const u = url.toString();
            return (u.includes('dashboard') || u.includes('admin')) && !u.includes('login');
        }, { timeout: 20000 });

        console.log('✅ VISUAL LOGIN SUCCESS!');

    } catch (error) {
        console.error('❌ EXCEPTION:', error);
    } finally {
        console.log('👀 Browser will remain open for you to verify.');
        await new Promise(() => { }); // Keep open
    }
})();
