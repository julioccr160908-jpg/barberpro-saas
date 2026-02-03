
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB");

        // Read SQL file
        const sql = fs.readFileSync('add_unique_slug.sql', 'utf8');

        // Execute SQL
        await client.query(sql);
        console.log("Unique Slug Constraint Applied.");
    } catch (err) {
        if (err.code === '42710') {
            console.log("Constraint already exists (Skipping).");
        } else {
            console.error("Error executing SQL:", err);
        }
    } finally {
        await client.end();
    }
}

run();
