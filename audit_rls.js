
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

const sql = `
  SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
  FROM pg_policies 
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
`;

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB. Fetching Policies...");
        const res = await client.query(sql);
        console.table(res.rows);

        // Also check which tables have RLS enabled
        const rlsStatusSql = `
      SELECT relname, relrowsecurity 
      FROM pg_class 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE nspname = 'public' AND relkind = 'r';
    `;
        const rlsRes = await client.query(rlsStatusSql);
        console.log("\nRLS Enabled Status per Table:");
        console.table(rlsRes.rows);

    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
