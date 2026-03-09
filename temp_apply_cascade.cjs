const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL="?(.*?)"?\n/);

if (!dbUrlMatch) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrlMatch[1].trim(),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to PG');

        const sql = `
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name
        FROM 
            information_schema.table_constraints AS tc
        JOIN 
            information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN 
            information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'organizations'
    ) LOOP
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I;', r.table_name, r.constraint_name);
        
        -- Re-add the constraint with ON DELETE CASCADE
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.organizations(id) ON DELETE CASCADE;', 
            r.table_name, r.constraint_name, r.column_name);
    END LOOP;
END $$;
        `;

        const sql2 = `
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name,
            ccu.table_name AS foreign_table
        FROM 
            information_schema.table_constraints AS tc
        JOIN 
            information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN 
            information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name IN ('profiles', 'services', 'customers')
    ) LOOP
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I;', r.table_name, r.constraint_name);
        
        -- Re-add the constraint with ON DELETE CASCADE
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id) ON DELETE CASCADE;', 
            r.table_name, r.constraint_name, r.column_name, r.foreign_table);
    END LOOP;
END $$;
        `;

        await client.query(sql);
        console.log('Cascade attached to organizations successfully.');
        
        await client.query(sql2);
        console.log('Cascade attached to profiles/services/customers successfully.');

    } catch (e) {
        console.error('Error applying SQL schemas:', e);
    } finally {
        await client.end();
    }
}

run();
