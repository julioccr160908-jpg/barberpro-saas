
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🔍 Listing ALL organizations...");
        const res = await client.query("SELECT id, name, slug FROM organizations");
        res.rows.forEach(r => console.log(`[${r.slug}] ${r.name} (${r.id})`));

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
