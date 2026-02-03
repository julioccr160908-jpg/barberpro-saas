
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🔧 Adding 'phone' column to 'profiles'...");
        await client.query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;");
        console.log("✅ Column added (or already exists).");

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
