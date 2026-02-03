
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();
        const slug = 'barbearia-1';
        console.log(`🔍 Checking for organization with slug: '${slug}'...`);

        const res = await client.query("SELECT * FROM organizations WHERE slug = $1", [slug]);

        if (res.rows.length === 0) {
            console.log("❌ Organization NOT FOUND.");
            // List all to see what exists
            const all = await client.query("SELECT id, name, slug FROM organizations LIMIT 5");
            console.log("--- Available Organizations ---");
            all.rows.forEach(r => console.log(`[${r.slug}] ${r.name}`));
        } else {
            console.log("✅ Organization FOUND:", res.rows[0]);
        }

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
