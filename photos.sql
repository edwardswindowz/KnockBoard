-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- Adds private photo storage so each customer can have before/after pictures.

create table if not exists public.photos (
  id uuid primary key,
  user_id uuid not null default auth.uid(),
  customer_id text not null,
  path text not null,
  kind text not null default 'other',
  taken_at timestamptz not null default now()
);
create index if not exists photos_user_customer on public.photos (user_id, customer_id);
alter table public.photos enable row level security;

drop policy if exists "own photos" on public.photos;
create policy "own photos" on public.photos
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
grant select, insert, update, delete on public.photos to authenticated;

-- Private storage bucket. Files live under <user id>/<customer id>/.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "own photo files read" on storage.objects;
create policy "own photo files read" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own photo files add" on storage.objects;
create policy "own photo files add" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own photo files change" on storage.objects;
create policy "own photo files change" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own photo files delete" on storage.objects;
create policy "own photo files delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
