
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();
        const orgId = 'bb9c6bf5-73ee-4ff9-9bd2-a75f5460d912';
        console.log(`🔍 Checking dependencies for Org ID: ${orgId}`);

        // 1. Settings
        const settingsRes = await client.query("SELECT * FROM settings WHERE organization_id = $1", [orgId]);
        if (settingsRes.rows.length === 0) {
            console.log("❌ Settings: MISSING row for organization_id!");
            // Attempt to create one?
        } else {
            console.log("✅ Settings: Found", settingsRes.rows[0]);
        }

        // 2. Services
        const servicesRes = await client.query("SELECT COUNT(*) FROM services WHERE organization_id = $1", [orgId]);
        console.log(`✅ Services Logic: Found ${servicesRes.rows[0].count} services.`);

        // 3. Staff (Profiles with Barber role linked? or Profiles table doesn't have org_id?)
        // Usually staff is filtered by org_id in profiles?? Or separate table?
        // Let's check 'profiles' table columns.

        // In previous context, we saw 'profiles' has 'role'. Does it have 'organization_id'?
        // 'check_user_role.js' output didn't show it.
        // Let's check table structure if needed. But let's assume 'useStaff' performs a query.

        // Wait, if 'useStaff' fails, it might be RLS on profiles?
        // 'security_policies.sql' said: 
        // CREATE POLICY "Public Read" ON profiles FOR SELECT USING (true);
        // So public read is fine.

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
