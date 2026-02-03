
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read config to find keys/url if possible, or just expect env. 
// For local dev, we know the defaults.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IjEyMzQ1Njc4OTAiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MTYxNjE2LCJleHAiOjE5MzE3Mzc2MTZ9.UseYourServiceRoleKeyHereForLocalDevWhichIsUsuallyInTheStatusOutput';

// We need the ACTUAL service role key to manage buckets/policies via API if acting as admin?
// Or we can use SQL. SQL is better for RLS policies.
// But JS client is better for bucket creation.

// Let's use SQL for everything via the 'postgres' driver for certainty, 
// OR simpler: use the existing 'reproduce_issue.cjs' pattern but with the SERVICE key found in `status_output.txt`?
// I'll stick to a SQL script executed via 'psql/postgres' connection for policies, 
// and JS for bucket creation if I can. 
// Actually, inserting into `storage.buckets` via SQL is often the most direct way in Supabase local.

const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});

async function run() {
    try {
        await client.connect();

        console.log("🛠️ Configuring 'profiles' bucket...");

        // 1. Create Bucket if not exists
        await client.query(`
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('profiles', 'profiles', true)
            ON CONFLICT (id) DO NOTHING;
        `);
        console.log("✅ Bucket 'profiles' ensured.");

        // 2. Enable RLS on objects
        // (storage.objects usually has RLS enabled by default, but we need policies)

        // Policy: Public Read
        await client.query(`
            DROP POLICY IF EXISTS "Public Access" ON storage.objects; -- specific to bucket?
            -- supabase storage policies are often global with bucket_id check
            
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Profiles' AND tablename = 'objects'
              ) THEN
                CREATE POLICY "Public Access Profiles" ON storage.objects
                FOR SELECT
                USING ( bucket_id = 'profiles' );
              END IF;
            END $$;
        `);
        console.log("✅ Policy: Public Read created.");

        // Policy: Auth User Upload (Own Folder)
        // Path convention: profiles/{user_id}/{filename}
        await client.query(`
             DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'User Upload Own Profile' AND tablename = 'objects'
              ) THEN
                CREATE POLICY "User Upload Own Profile" ON storage.objects
                FOR INSERT
                TO authenticated
                WITH CHECK ( bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text );
              END IF;
            END $$;
        `);
        console.log("✅ Policy: User Upload created.");

        // Policy: Auth User Update/Delete
        await client.query(`
             DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'User Update Own Profile' AND tablename = 'objects'
              ) THEN
                CREATE POLICY "User Update Own Profile" ON storage.objects
                FOR UPDATE
                TO authenticated
                USING ( bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text )
                WITH CHECK ( bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text );
              END IF;
            END $$;
        `);

        await client.query(`
             DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE policyname = 'User Delete Own Profile' AND tablename = 'objects'
              ) THEN
                CREATE POLICY "User Delete Own Profile" ON storage.objects
                FOR DELETE
                TO authenticated
                USING ( bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text );
              END IF;
            END $$;
        `);
        console.log("✅ Policy: User Update/Delete created.");

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

run();
