-- Enable RLS on storage.objects (usually enabled by default, but good to ensure)
alter table storage.objects enable row level security;

-- Ensure profiles bucket exists and is public
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do update set public = true;

-- 1. Public Read Access
drop policy if exists "Public Access Profiles" on storage.objects;
create policy "Public Access Profiles"
  on storage.objects for select
  using ( bucket_id = 'profiles' );

-- 2. Authenticated Insert (Upload)
drop policy if exists "Authenticated Insert Profiles" on storage.objects;
create policy "Authenticated Insert Profiles"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'profiles' );

-- 3. Authenticated Update (Replace)
drop policy if exists "Authenticated Update Profiles" on storage.objects;
create policy "Authenticated Update Profiles"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'profiles' );

-- 4. Authenticated Delete (Remove)
drop policy if exists "Authenticated Delete Profiles" on storage.objects;
create policy "Authenticated Delete Profiles"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'profiles' );