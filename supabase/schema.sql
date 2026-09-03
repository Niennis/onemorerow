-- Una vuelta más (onemorerow) — app schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- ============================================================
-- 1. user_settings: one row per user, synced across devices
-- ============================================================

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  work_duration_min integer not null default 25 check (work_duration_min between 1 and 180),
  short_break_min integer not null default 5 check (short_break_min between 1 and 60),
  long_break_min integer not null default 15 check (long_break_min between 1 and 120),
  theme text not null default 'default',
  background_type text not null default 'color' check (background_type in ('color', 'gradient', 'image')),
  background_value text not null default '#1e1e2e',
  text_tone text not null default 'auto' check (text_tone in ('auto', 'light', 'dark')),
  focus_end_sound text not null default 'beep',
  break_end_sound text not null default 'chime',
  alarm_volume real not null default 0.6 check (alarm_volume between 0 and 1),
  player_url text not null default '',
  updated_at timestamptz not null default now()
);

-- Re-running this file on a project created before these columns existed:
alter table public.user_settings
  add column if not exists text_tone text not null default 'auto';
alter table public.user_settings
  add column if not exists focus_end_sound text not null default 'beep';
alter table public.user_settings
  add column if not exists break_end_sound text not null default 'chime';
alter table public.user_settings
  add column if not exists alarm_volume real not null default 0.6;
alter table public.user_settings
  add column if not exists player_url text not null default '';

alter table public.user_settings enable row level security;

drop policy if exists "select own settings" on public.user_settings;
create policy "select own settings" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "insert own settings" on public.user_settings;
create policy "insert own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own settings" on public.user_settings;
create policy "update own settings" on public.user_settings
  for update using (auth.uid() = user_id);

-- Keep updated_at fresh on every change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- Give every new auth user a default settings row automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 1b. user_pokemon: one row per collected sprite, many per user.
--     A new row is added client-side each time a full focus/break
--     cycle finishes; pos_x/pos_y update as the user drags it around.
-- ============================================================

create table if not exists public.user_pokemon (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pokemon_id integer not null check (pokemon_id between 1 and 2000),
  name text not null,
  sprite_url text not null,
  pos_x real not null default 0.5 check (pos_x between 0 and 1),
  pos_y real not null default 0.5 check (pos_y between 0 and 1),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_pokemon_user_id on public.user_pokemon (user_id);

alter table public.user_pokemon enable row level security;

drop policy if exists "select own pokemon" on public.user_pokemon;
create policy "select own pokemon" on public.user_pokemon
  for select using (auth.uid() = user_id);

drop policy if exists "insert own pokemon" on public.user_pokemon;
create policy "insert own pokemon" on public.user_pokemon
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own pokemon" on public.user_pokemon;
create policy "update own pokemon" on public.user_pokemon
  for update using (auth.uid() = user_id);

drop policy if exists "delete own pokemon" on public.user_pokemon;
create policy "delete own pokemon" on public.user_pokemon
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. Storage: per-user uploaded background images, with limits
--    Folder layout inside the bucket: {user_id}/{filename}
-- ============================================================

-- Limits (tune these two numbers to taste)
--   MAX_IMAGES_PER_USER: max number of files a single account may store
--   file_size_limit below: max size per file, in bytes

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-images', 'user-images', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Users may only read/write inside their own folder ({uid}/...)
drop policy if exists "read own or public user-images" on storage.objects;
create policy "read own or public user-images" on storage.objects
  for select using (bucket_id = 'user-images');

drop policy if exists "insert own user-images" on storage.objects;
create policy "insert own user-images" on storage.objects
  for insert with check (
    bucket_id = 'user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own user-images" on storage.objects;
create policy "delete own user-images" on storage.objects
  for delete using (
    bucket_id = 'user-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Hard cap on file COUNT per user (file size is already capped by the
-- bucket's file_size_limit above). Without this, a user could upload
-- unlimited small files instead of a few large ones.
create or replace function public.enforce_user_image_quota()
returns trigger as $$
declare
  max_images_per_user constant integer := 10;
  current_count integer;
begin
  if new.bucket_id <> 'user-images' then
    return new;
  end if;

  select count(*) into current_count
  from storage.objects
  where bucket_id = 'user-images'
    and (storage.foldername(name))[1] = (storage.foldername(new.name))[1];

  if current_count >= max_images_per_user then
    raise exception 'Image quota exceeded: max % images per user', max_images_per_user;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, storage;

drop trigger if exists trg_enforce_user_image_quota on storage.objects;
create trigger trg_enforce_user_image_quota
  before insert on storage.objects
  for each row execute function public.enforce_user_image_quota();

-- ============================================================
-- 3. Storage: curated default image pool (read-only for everyone,
--    you upload these yourself from the Supabase dashboard)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('default-images', 'default-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "public read default-images" on storage.objects;
create policy "public read default-images" on storage.objects
  for select using (bucket_id = 'default-images');

-- No insert/update/delete policy for anon/authenticated on default-images:
-- only you (via the dashboard, as the project owner) can manage this pool.
