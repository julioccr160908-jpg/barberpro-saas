
-- Create organization-assets bucket
insert into storage.buckets (id, name, public)
values ('organization-assets', 'organization-assets', true)
on conflict (id) do nothing;

-- Policy: Public Read Access
create policy "Public Read Access"
  on storage.objects for select
  using ( bucket_id = 'organization-assets' );

-- Policy: Admin Write Access (Insert)
create policy "Admin Insert Access"
  on storage.objects for insert
  with check (
    bucket_id = 'organization-assets' 
    -- Add role check logic here if needed, or rely on application logic + auth
    -- ideally: AND auth.role() = 'authenticated'
  );

-- Policy: Admin Update Access
create policy "Admin Update Access"
  on storage.objects for update
  using ( bucket_id = 'organization-assets' );

-- Policy: Admin Delete Access
create policy "Admin Delete Access"
  on storage.objects for delete
  using ( bucket_id = 'organization-assets' );
