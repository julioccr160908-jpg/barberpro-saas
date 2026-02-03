
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        const userId = 'e36a2236-c6a7-4fb5-b251-1ecf24fd7d55';
        console.log(`🔍 Checking appointments for Customer: ${userId}`);

        const res = await client.query(`
            SELECT id, organization_id, status, date 
            FROM appointments 
            WHERE customer_id = $1
        `, [userId]);

        if (res.rows.length === 0) {
            console.log("❌ No appointments found for this user in the DB.");
        } else {
            console.log(`✅ Found ${res.rows.length} appointments:`);
            console.log(res.rows);
        }

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
