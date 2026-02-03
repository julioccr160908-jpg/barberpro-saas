
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🔧 Fixing 'is_super_admin' function...");

        await client.query(`
            CREATE OR REPLACE FUNCTION public.is_super_admin()
             RETURNS boolean
             LANGUAGE plpgsql
             SECURITY DEFINER
            AS $function$
            BEGIN
              RETURN EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
              );
            END;
            $function$;
        `);

        console.log("✅ Function updated successfully.");

    } catch (err) {
        console.error('❌ Database error:', err);
    } finally {
        await client.end();
    }
}

run();
