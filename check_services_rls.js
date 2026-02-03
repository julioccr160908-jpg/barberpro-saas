
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🛡️ Checking RLS on 'services' table...");

        // Check if RLS is enabled
        const rlsRes = await client.query(`
            SELECT relname, relrowsecurity 
            FROM pg_class 
            WHERE relname = 'services';
        `);

        if (rlsRes.rows.length > 0) {
            console.log(`RLS Enabled: ${rlsRes.rows[0].relrowsecurity}`);
        }

        // List Policies
        const res = await client.query(`
            SELECT policyname, cmd, roles, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'services'
        `);

        if (res.rows.length === 0) {
            console.log("❌ NO POLICIES FOUND for 'services'!");
            if (rlsRes.rows.length > 0 && rlsRes.rows[0].relrowsecurity) {
                console.log("⚠️  RLS is ON but NO policies -> DENY ALL (except owner/superadmin potentially, but anon will fail)");
            }
        } else {
            console.log("🛡️ Policies on 'services':");
            res.rows.forEach(r => {
                console.log(`- [${r.cmd}] ${r.policyname} (Roles: ${r.roles})`);
                console.log(`  USING: ${r.qual}`);
            });
        }

    } catch (err) {
        console.error('❌ Error querying policies:', err);
    } finally {
        await client.end();
    }
}

run();
