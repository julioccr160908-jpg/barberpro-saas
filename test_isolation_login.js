
import { chromium } from 'playwright';

(async () => {
    console.log('=== STARTING ISOLATION TESTS ===');
    const browser = await chromium.launch({ headless: false });

    // TEST 1: Dono1 (Owner) on CUSTOMER Path (No role param)
    // Logic: If this works, then Dono1 user is fine, and error is in Admin Path.
    console.log('\n--- TEST 1: Dono1 on Default Path ---');
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    try {
        await page1.goto('http://127.0.0.1:3000/login', { timeout: 10000 });
        await page1.fill('input[type="email"]', 'dono1@gmail.com');
        await page1.fill('input[type="password"]', '123456');
        await page1.keyboard.press('Enter');

        await page1.waitForURL((url) => {
            const u = url.toString();
            return (u.includes('dashboard') || u.includes('admin')) && !u.includes('login');
        }, { timeout: 10000 });
        console.log('✅ TEST 1 SUCCESS: Dono1 logged in via Default Path.');
    } catch (e) {
        console.log('❌ TEST 1 FAILED: Dono1 failed on Default Path.', e.message);
        const err = await page1.locator('.text-red-500').textContent().catch(() => '');
        console.log('   Error:', err);
    }
    await context1.close();

    // TEST 2: Super Admin on ADMIN Path (?role=admin)
    // Logic: If this fails, then Admin Path is broken for everyone.
    console.log('\n--- TEST 2: Super Admin on Admin Path ---');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    try {
        await page2.goto('http://127.0.0.1:3000/login?role=admin', { timeout: 10000 });
        await page2.fill('input[type="email"]', 'julioccr1609@gmail.com');
        await page2.fill('input[type="password"]', 'Julioccr2020');
        // Admin path might have different button text ("Entrar no Painel")
        const btn = page2.locator('button', { hasText: 'Entrar no Painel' });
        if (await btn.isVisible()) await btn.click();
        else await page2.keyboard.press('Enter');

        await page2.waitForURL((url) => {
            const u = url.toString();
            return (u.includes('dashboard') || u.includes('platform')) && !u.includes('login');
        }, { timeout: 10000 });
        console.log('✅ TEST 2 SUCCESS: Super Admin logged in via Admin Path.');
    } catch (e) {
        console.log('❌ TEST 2 FAILED: Super Admin failed on Admin Path.', e.message);
        const err = await page2.locator('.text-red-500').textContent().catch(() => '');
        console.log('   Error:', err);
    }
    await context2.close();

    // TEST 3: Dono1 on ADMIN Path (?role=admin)
    // Logic: The suspected failure case based on user screenshot.
    console.log('\n--- TEST 3: Dono1 on Admin Path ---');
    const context3 = await browser.newContext();
    const page3 = await context3.newPage();
    try {
        await page3.goto('http://127.0.0.1:3000/login?role=admin', { timeout: 10000 });
        await page3.fill('input[type="email"]', 'dono1@gmail.com');
        await page3.fill('input[type="password"]', '123456');
        const btn = page3.locator('button', { hasText: 'Entrar no Painel' });
        if (await btn.isVisible()) await btn.click();
        else await page3.keyboard.press('Enter');

        await page3.waitForURL((url) => {
            const u = url.toString();
            return (u.includes('dashboard') || u.includes('admin')) && !u.includes('login');
        }, { timeout: 15000 });
        console.log('✅ TEST 3 SUCCESS: Dono1 logged in via Admin Path.');
    } catch (e) {
        console.log('❌ TEST 3 FAILED: Dono1 failed on Admin Path.', e.message);
        const err = await page3.locator('.text-red-500').textContent().catch(() => '');
        console.log('   Error:', err);
        await page3.screenshot({ path: 'test3_fail.png' });
    }
    await context3.close();

    console.log('=== ISOLATION TESTS COMPLETE ===');
    await browser.close();
})();
