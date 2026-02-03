
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        const userId = 'e33a1023-f7c3-47b6-a4b5-434579989757';
        console.log(`🔍 Checking Org for Owner: ${userId}`);

        const res = await client.query("SELECT * FROM organizations WHERE owner_id = $1", [userId]);

        if (res.rows.length === 0) {
            console.log("❌ No organization found for this user.");
        } else {
            console.log("✅ Organization Found:");
            console.log(JSON.stringify(res.rows[0], null, 2));
        }

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
