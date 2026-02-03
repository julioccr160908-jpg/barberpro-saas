
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        const res = await client.query(`
            SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'profiles'
        `);

        console.log("🛡️ Policies on 'profiles':");
        res.rows.forEach(r => {
            console.log(`- [${r.cmd}] ${r.policyname} (Roles: ${r.roles})`);
            console.log(`  USING: ${r.qual}`);
            console.log(`  CHECK: ${r.with_check}`);
            console.log('---');
        });

    } catch (err) {
        console.error('❌ Error querying policies:', err);
    } finally {
        await client.end();
    }
}

run();
