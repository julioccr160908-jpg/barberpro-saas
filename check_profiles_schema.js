
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🔍 Checking columns in 'profiles' table...");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        `);

        console.log(res.rows);

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
