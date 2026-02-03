
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

const sql = `
-- Create organization-assets bucket if not exists
insert into storage.buckets (id, name, public)
values ('organization-assets', 'organization-assets', true)
on conflict (id) do nothing;

-- Drop existing policies to avoid conflicts during dev
drop policy if exists "Public Read Access" on storage.objects;
drop policy if exists "Admin Insert Access" on storage.objects;
drop policy if exists "Admin Update Access" on storage.objects;
drop policy if exists "Admin Delete Access" on storage.objects;

-- Policy: Public Read Access
create policy "Public Read Access"
  on storage.objects for select
  using ( bucket_id = 'organization-assets' );

-- Policy: Admin Write Access (Insert)
create policy "Admin Insert Access"
  on storage.objects for insert
  with check (
    bucket_id = 'organization-assets' 
  );

-- Policy: Admin Update Access
create policy "Admin Update Access"
  on storage.objects for update
  using ( bucket_id = 'organization-assets' );

-- Policy: Admin Delete Access
create policy "Admin Delete Access"
  on storage.objects for delete
  using ( bucket_id = 'organization-assets' );
`;

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB");
        await client.query(sql);
        console.log("Storage buckets and policies configured successfully.");
    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
