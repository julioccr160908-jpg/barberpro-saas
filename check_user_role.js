
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        // Check dono1 email
        const res = await client.query("SELECT id, email, role FROM profiles WHERE email = 'dono1@gmail.com'");
        if (res.rows.length === 0) {
            console.log("❌ User dono1@gmail.com NOT FOUND in profiles table.");
        } else {
            console.log("✅ User found:", res.rows[0]);
        }

        // List all profiles just in case
        const all = await client.query("SELECT email, role FROM profiles LIMIT 10");
        console.log("--- All Profiles Sample ---");
        all.rows.forEach(r => console.log(`${r.email}: ${r.role}`));

    } catch (err) {
        console.error('❌ Error querying database:', err);
    } finally {
        await client.end();
    }
}

run();
