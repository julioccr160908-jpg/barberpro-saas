
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🔧 Fixing duplicates in 'settings'...");

        // Strategy: Keep the one with the highest ID (assumed newest)
        // Since we have duplicates for organization_id:

        // 1. Find duplicates
        const res = await client.query(`
            SELECT organization_id, COUNT(*) 
            FROM settings 
            GROUP BY organization_id 
            HAVING COUNT(*) > 1
        `);

        for (let row of res.rows) {
            const orgId = row.organization_id;
            console.log(`Processing duplicates for Org: ${orgId}`);

            // Get IDs ordered by id desc
            const idsRes = await client.query(`
                SELECT id FROM settings WHERE organization_id = $1 ORDER BY id DESC
            `, [orgId]);

            const [toKeep, ...toDelete] = idsRes.rows.map(r => r.id);
            console.log(`Keeping ID: ${toKeep}, Deleting: ${toDelete.join(', ')}`);

            if (toDelete.length > 0) {
                await client.query(`DELETE FROM settings WHERE id = ANY($1::int[])`, [toDelete]);
            }
        }

        console.log("🔒 Adding UNIQUE constraint to settings(organization_id)...");
        try {
            await client.query(`
                ALTER TABLE settings 
                ADD CONSTRAINT settings_organization_id_key UNIQUE (organization_id);
            `);
            console.log("✅ Constraint added.");
        } catch (e) {
            if (e.code === '42710') { // duplicate_object (constraint already exists?)
                console.log("⚠️ Constraint might already exist (or partial update).");
            } else {
                throw e;
            }
        }

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
