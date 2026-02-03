
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' // Standard local Supabase DB
});

async function run() {
    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, 'setup_storage.sql'), 'utf8');
        await client.query(sql);
        console.log('✅ Storage policies applied successfully.');
    } catch (err) {
        console.error('❌ Error applying policies:', err);
    } finally {
        await client.end();
    }
}

run();
