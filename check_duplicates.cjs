const { Client } = require('pg');

async function check() {
    try {
        const client = new Client({
            connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
        });

        await client.connect();

        const res = await client.query(`
            SELECT slug, COUNT(*) as count 
            FROM organizations 
            GROUP BY slug 
            HAVING COUNT(*) > 1
        `);

        if (res.rows.length > 0) {
            console.log("Duplicate Slugs Found:", res.rows);
        } else {
            console.log("No duplicate slugs found.");
        }

        await client.end();

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
