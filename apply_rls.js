
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
        const sql = fs.readFileSync('restrict_rls.sql', 'utf8');

        // Execute SQL
        await client.query(sql);
        console.log("Security Policies Applied Successfully.");
    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
