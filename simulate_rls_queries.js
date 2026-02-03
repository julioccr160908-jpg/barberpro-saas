
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🎭 Switching to 'anon' role...");
        await client.query("SET ROLE anon");

        const orgId = 'bb9c6bf5-73ee-4ff9-9bd2-a75f5460d912';
        const slug = 'barbearia-1';

        // 1. Organization
        console.log("\n1️⃣  Testing Organization (Public Read)...");
        const orgRes = await client.query("SELECT id, slug FROM organizations WHERE slug = $1", [slug]);
        console.log(`   Result: ${orgRes.rows.length} rows`);
        if (orgRes.rows.length === 0) console.error("   ❌ Failed to read Organization!");

        // 2. Settings
        console.log("\n2️⃣  Testing Settings (Public Read)...");
        const setRes = await client.query("SELECT id FROM settings WHERE organization_id = $1", [orgId]);
        console.log(`   Result: ${setRes.rows.length} rows`);
        if (setRes.rows.length === 0) console.error("   ❌ Failed to read Settings!");

        // 3. Services
        console.log("\n3️⃣  Testing Services (Public Read)...");
        const srvRes = await client.query("SELECT id FROM services WHERE organization_id = $1", [orgId]);
        console.log(`   Result: ${srvRes.rows.length} rows`);
        if (srvRes.rows.length === 0) console.error("   ❌ Failed (or Empty) Services!");

        // 4. Staff (Profiles)
        console.log("\n4️⃣  Testing Staff/Profiles (Public Read)...");
        // Staff logic usually filters by role, checks profiles linked to org?
        // Wait, profiles usually linked via organization_id? In Step 2150 code (OrganizationContext),
        // it checks `profile.organization_id`.
        const staffRes = await client.query("SELECT id FROM profiles WHERE organization_id = $1 AND role = 'BARBER'", [orgId]);
        console.log(`   Result: ${staffRes.rows.length} rows`);

        // 5. Appointments (Should FAIL/Empty)
        console.log("\n5️⃣  Testing Appointments (Restricted)...");
        const appRes = await client.query("SELECT id FROM appointments WHERE organization_id = $1", [orgId]);
        console.log(`   Result: ${appRes.rows.length} rows`);
        if (appRes.rows.length > 0) console.warn("   ⚠️  Appointments visible to anon! (Should be empty)");
        else console.log("   ✅ Appointments correctly hidden.");

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
