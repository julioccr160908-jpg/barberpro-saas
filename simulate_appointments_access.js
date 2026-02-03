
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        const userId = 'e36a2236-c6a7-4fb5-b251-1ecf24fd7d55';
        console.log(`🎭 simulating access as ${userId}...`);

        // 1. Set Role to authenticated
        await client.query("SET ROLE authenticated");

        // 2. Set request.jwt.claim.sub (simulating auth.uid())
        // Note: In standard postgres, current_setting('request.jwt.claim.sub', true) is used by Supabase RLS.
        // We can simulate this by setting a config variable if the policies use auth.uid() wrapper.
        // Supabase `auth.uid()` function reads from `request.jwt.claims`.
        // Let's try to set the config.

        await client.query(`SELECT set_config('request.jwt.claims', '{"sub": "${userId}", "role": "authenticated"}', false)`);

        console.log("🔍 Querying appointments as user...");
        const res = await client.query(`
            SELECT id, status, customer_id, organization_id 
            FROM appointments 
            WHERE customer_id = '${userId}'
        `);

        console.log(`found: ${res.rows.length}`);
        if (res.rows.length === 0) {
            console.log("❌ RLS Blocked access! (Or no rows found but we know they exist)");
        } else {
            console.log("✅ RLS Allowed access.");
            console.log(res.rows);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

run();
