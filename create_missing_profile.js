
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        const userId = 'e36a2236-c6a7-4fb5-b251-1ecf24fd7d55';
        const email = 'cliente2@gmail.com';

        console.log(`🔧 Creating missing profile for ${email} (${userId})...`);

        await client.query(`
            INSERT INTO public.profiles (id, email, name, role)
            VALUES ($1, $2, 'Cliente 2', 'CUSTOMER')
            ON CONFLICT (id) DO NOTHING;
        `, [userId, email]);

        console.log("✅ Profile created manually.");

    } catch (err) {
        console.error('❌ Insert failed:', err);
    } finally {
        await client.end();
    }
}

run();
