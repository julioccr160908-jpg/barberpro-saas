
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🔍 Checking Consistency for dono1@gmail.com...");

        // Get Auth User ID
        const authRes = await client.query("SELECT id, email FROM auth.users WHERE email = 'dono1@gmail.com'");
        if (authRes.rows.length === 0) {
            console.log("❌ User NOT FOUND in auth.users!");
        } else {
            console.log("✅ Found in auth.users:", authRes.rows[0]);
        }

        // Get Public Profile ID
        const profileRes = await client.query("SELECT id, email, role FROM public.profiles WHERE email = 'dono1@gmail.com'");
        if (profileRes.rows.length === 0) {
            console.log("❌ User NOT FOUND in public.profiles!");
        } else {
            console.log("✅ Found in public.profiles:", profileRes.rows[0]);
        }

        if (authRes.rows.length > 0 && profileRes.rows.length > 0) {
            const authId = authRes.rows[0].id;
            const profileId = profileRes.rows[0].id;

            if (authId === profileId) {
                console.log("✅ IDs MATCH! Consistency check passed.");
            } else {
                console.log("❌ ID MISMATCH DETECTED!");
                console.log(`   Auth ID:    ${authId}`);
                console.log(`   Profile ID: ${profileId}`);
                console.log("   --> This is why login fails (profile fetch returns null for Auth ID).");

                // Attempt Auto-Fix
                console.log("🛠️ Attempting auto-fix: Updating profile ID to match Auth ID...");
                await client.query("UPDATE public.profiles SET id = $1 WHERE email = 'dono1@gmail.com'", [authId]);
                console.log("✅ Profile ID updated.");
            }
        }

    } catch (err) {
        console.error('❌ Error querying database:', err);
    } finally {
        await client.end();
    }
}

run();
