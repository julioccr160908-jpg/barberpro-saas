
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        const userId = 'e33a1023-f7c3-47b6-a4b5-434579989757';
        const newSlug = 'barbearia-2';

        console.log(`🔧 Attempting to update slug to '${newSlug}' for owner ${userId}...`);

        const res = await client.query(`
            UPDATE organizations 
            SET slug = $1 
            WHERE owner_id = $2
            RETURNING id, slug, name;
        `, [newSlug, userId]);

        if (res.rows.length === 0) {
            console.log("❌ No rows updated (User might not have an org).");
        } else {
            console.log("✅ Success! Updated Org:");
            console.log(res.rows[0]);
        }

    } catch (err) {
        console.error('❌ Update failed:', err);
    } finally {
        await client.end();
    }
}

run();
