
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        const email = 'cliente2@gmail.com';
        console.log(`🔍 Checking user: ${email}`);

        // 1. Check auth.users
        const authRes = await client.query("SELECT id, email, created_at, last_sign_in_at FROM auth.users WHERE email = $1", [email]);

        if (authRes.rows.length === 0) {
            console.log("❌ User NOT found in auth.users");
        } else {
            const user = authRes.rows[0];
            console.log("✅ User found in auth.users:", user.id);

            // 2. Check public.profiles
            const profileRes = await client.query("SELECT * FROM public.profiles WHERE id = $1", [user.id]);
            if (profileRes.rows.length === 0) {
                console.log("❌ Profile NOT found in public.profiles! (Trigger failed?)");
            } else {
                console.log("✅ Profile found in public.profiles:");
                console.log(profileRes.rows[0]);
            }
        }

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
