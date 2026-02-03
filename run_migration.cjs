const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" // Using 54322 as verified in step 19 status output standard
    });

    try {
        await client.connect();
        console.log("Connected to DB");

        const sql = fs.readFileSync(path.join(__dirname, 'consolidate_rls.sql'), 'utf8');
        console.log("Executing SQL...");

        await client.query(sql);

        console.log("Migration applied successfully!");
    } catch (e) {
        console.error("Migration Failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
