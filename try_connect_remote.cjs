const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgres://postgres.ybzgpqwanlbpmyxwjjxc:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        await client.connect();
        console.log("✅ Connected successfully!");
        const res = await client.query('SELECT current_user, current_database()');
        console.log("User:", res.rows[0]);
        await client.end();
    } catch (e) {
        console.error("❌ Connection failed:", e.message);
    }
}

test();
