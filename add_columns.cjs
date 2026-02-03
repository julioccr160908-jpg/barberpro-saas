
const pg = require('pg');
const { Client } = pg;

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres', // Default for supabase local
    port: 54322,
});

async function addColumns() {
    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('Adding primary_color column...');
        await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS primary_color TEXT;');

        console.log('Adding secondary_color column...');
        await client.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS secondary_color TEXT;');

        console.log('✅ Columns added successfully.');
    } catch (err) {
        console.error('❌ Error executing DDL:', err);
    } finally {
        await client.end();
    }
}

addColumns();
