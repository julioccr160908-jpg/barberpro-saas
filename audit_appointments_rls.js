
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

const sql = `
  SELECT policyname, cmd, qual, with_check 
  FROM pg_policies 
  WHERE tablename = 'appointments';
`;

async function run() {
    try {
        await client.connect();
        console.log("Fetching Appointments Policies...");
        const res = await client.query(sql);
        console.table(res.rows);
    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
