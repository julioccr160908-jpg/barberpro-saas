
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🔍 Checking for duplicates of 'barbearia-2'...");

        // 1. Check Organizations
        const orgsReq = await client.query("SELECT id, slug, owner_id FROM organizations WHERE slug = 'barbearia-2'");
        console.log(`\n🏢 Organizations Found: ${orgsReq.rows.length}`);
        orgsReq.rows.forEach(r => console.log(r));

        if (orgsReq.rows.length > 0) {
            const orgId = orgsReq.rows[0].id;

            // 2. Check Settings for this Org
            const settingsReq = await client.query("SELECT id, organization_id FROM settings WHERE organization_id = $1", [orgId]);
            console.log(`\n⚙️  Settings Found for Org ${orgId}: ${settingsReq.rows.length}`);
            settingsReq.rows.forEach(r => console.log(r));
        }

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
