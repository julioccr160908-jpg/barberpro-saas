
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🔍 Checking Enum 'user_role' values...");
        const enumRes = await client.query(`
            SELECT unnest(enum_range(NULL::user_role)) AS role_value
        `);
        console.log("   Valid Values:", enumRes.rows.map(r => r.role_value));

        console.log("\n🔍 Checking function 'is_super_admin' definition...");
        const funcRes = await client.query(`
            SELECT pg_get_functiondef('is_super_admin()'::regprocedure);
        `);
        console.log(funcRes.rows[0].pg_get_functiondef);

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
