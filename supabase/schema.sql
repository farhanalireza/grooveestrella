-- ==============================================================================
-- GrooveEstrella Music App - Phase 1 Database Schema & RLS Policies
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 0. Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. Profiles Table (extends Supabase auth.users)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast username lookups (e.g. /profile/[username])
create index if not exists profiles_username_idx on public.profiles (lower(username));

-- ==============================================================================
-- 2. Music Entities (Cache from MusicBrainz)
-- ==============================================================================
create table if not exists public.music_entities (
  id uuid default gen_random_uuid() primary key,
  mbid text unique not null, -- MusicBrainz ID (source of truth)
  type text not null check (type in ('artist', 'album', 'track', 'release-group')),
  title text not null,
  artist_credit text,
  year integer,
  cover_art_url text,
  data jsonb default '{}'::jsonb, -- raw / extra MusicBrainz metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists music_entities_mbid_idx on public.music_entities (mbid);
create index if not exists music_entities_type_idx on public.music_entities (type);
create index if not exists music_entities_title_idx on public.music_entities (lower(title));

-- ==============================================================================
-- 3. User Ratings (Supports 10-star and 100-score scales)
-- ==============================================================================
create table if not exists public.user_ratings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  entity_id uuid references public.music_entities(id) on delete cascade not null,
  rating_type text not null check (rating_type in ('score', 'stars')), -- 'stars' (1-10) or 'score' (0-100)
  score numeric not null, -- numeric score (e.g. 8.5, 9, 88)
  review text,
  listened_date date default current_date,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, entity_id, rating_type)
);

create index if not exists user_ratings_user_idx on public.user_ratings (user_id);
create index if not exists user_ratings_entity_idx on public.user_ratings (entity_id);
create index if not exists user_ratings_public_idx on public.user_ratings (is_public);

-- ==============================================================================
-- 4. Music Journal Entries
-- ==============================================================================
create table if not exists public.journals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  entity_id uuid references public.music_entities(id) on delete cascade not null,
  entry_text text,
  mood text, -- e.g. 'Euphoric', 'Late Night', 'Introspective', 'Melancholic', etc.
  listened_date date not null default current_date,
  rating_id uuid references public.user_ratings(id) on delete set null,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists journals_user_idx on public.journals (user_id);
create index if not exists journals_entity_idx on public.journals (entity_id);
create index if not exists journals_listened_date_idx on public.journals (listened_date desc);
create index if not exists journals_public_idx on public.journals (is_public);
create unique index if not exists journals_user_entity_unique_idx on public.journals (user_id, entity_id);

-- ==============================================================================
-- 5. Basic Follows (Social Graph)
-- ==============================================================================
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_following_idx on public.follows (following_id);

-- ==============================================================================
-- 6. Entity Rating Summaries View (Average Score & Total Ratings per Entity)
-- ==============================================================================
create or replace view public.entity_ratings_summary as
select 
  e.id as entity_id,
  e.mbid,
  e.type,
  e.title,
  e.artist_credit,
  count(r.id) as total_ratings,
  round(avg(case when r.rating_type = 'stars' then r.score else null end)::numeric, 1) as avg_stars,
  round(avg(case when r.rating_type = 'score' then r.score else null end)::numeric, 1) as avg_score,
  round(avg(case 
    when r.rating_type = 'stars' then r.score * 10
    when r.rating_type = 'score' then r.score
    else null 
  end)::numeric, 1) as normalized_score_100
from public.music_entities e
left join public.user_ratings r on e.id = r.entity_id and r.is_public = true
group by e.id, e.mbid, e.type, e.title, e.artist_credit;

-- ==============================================================================
-- 7. Automated Profile Creation Trigger on Supabase Auth Sign Up
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_username text;
  clean_username text;
  display_name text;
  user_avatar text;
begin
  -- Extract username or generate from email
  raw_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  -- Sanitize username (alphanumeric and underscores only)
  clean_username := regexp_replace(lower(raw_username), '[^a-z0-9_]', '', 'g');
  if length(clean_username) < 3 then
    clean_username := 'user_' || substr(new.id::text, 1, 8);
  end if;

  -- Ensure username uniqueness by appending short random suffix if taken
  if exists (select 1 from public.profiles where username = clean_username) then
    clean_username := clean_username || '_' || substr(md5(random()::text), 1, 4);
  end if;

  display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    raw_username,
    'Groove Explorer'
  );

  user_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/7.x/identicon/svg?seed=' || new.id::text
  );

  insert into public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    created_at,
    updated_at
  ) values (
    new.id,
    clean_username,
    display_name,
    user_avatar,
    coalesce(new.raw_user_meta_data->>'bio', 'Music lover on GrooveEstrella'),
    now(),
    now()
  );

  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- 8. Updated At Timestamps Auto-Refresh Function
-- ==============================================================================
create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_current_timestamp_updated_at();

create or replace trigger set_music_entities_updated_at
  before update on public.music_entities
  for each row execute procedure public.set_current_timestamp_updated_at();

create or replace trigger set_user_ratings_updated_at
  before update on public.user_ratings
  for each row execute procedure public.set_current_timestamp_updated_at();

create or replace trigger set_journals_updated_at
  before update on public.journals
  for each row execute procedure public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 9. Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.music_entities enable row level security;
alter table public.user_ratings enable row level security;
alter table public.journals enable row level security;
alter table public.follows enable row level security;

-- ------------------------------------------------------------------------------
-- A. Profiles Policies
-- ------------------------------------------------------------------------------
-- Anyone (anon and authenticated) can view public profiles
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

-- Users can only insert their own profile (trigger handles this, but allow upsert)
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Users can only update their own profile
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- B. Music Entities Policies (Global Music Cache)
-- ------------------------------------------------------------------------------
-- Anyone can view cached music entities
drop policy if exists "Music entities are viewable by everyone" on public.music_entities;
create policy "Music entities are viewable by everyone"
  on public.music_entities
  for select
  using (true);

-- Authenticated users or server actions can insert new music entities into the cache
drop policy if exists "Authenticated users can insert music entities" on public.music_entities;
create policy "Authenticated users can insert music entities"
  on public.music_entities
  for insert
  with check (auth.role() = 'authenticated');

-- Authenticated users can update metadata or cover art of existing entities
drop policy if exists "Authenticated users can update music entities" on public.music_entities;
create policy "Authenticated users can update music entities"
  on public.music_entities
  for update
  using (auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- C. User Ratings Policies
-- ------------------------------------------------------------------------------
-- Public ratings are viewable by everyone; private ratings only by the owner
drop policy if exists "User ratings are viewable by public or owner" on public.user_ratings;
create policy "User ratings are viewable by public or owner"
  on public.user_ratings
  for select
  using (is_public = true or auth.uid() = user_id);

-- Users can only insert ratings with their own user_id
drop policy if exists "Users can insert own ratings" on public.user_ratings;
create policy "Users can insert own ratings"
  on public.user_ratings
  for insert
  with check (auth.uid() = user_id);

-- Users can only update their own ratings
drop policy if exists "Users can update own ratings" on public.user_ratings;
create policy "Users can update own ratings"
  on public.user_ratings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only delete their own ratings
drop policy if exists "Users can delete own ratings" on public.user_ratings;
create policy "Users can delete own ratings"
  on public.user_ratings
  for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- D. Music Journals Policies
-- ------------------------------------------------------------------------------
-- Public journals are viewable by everyone; private journal logs only by the owner
drop policy if exists "Journals are viewable by public or owner" on public.journals;
create policy "Journals are viewable by public or owner"
  on public.journals
  for select
  using (is_public = true or auth.uid() = user_id);

-- Users can only create journal entries for themselves
drop policy if exists "Users can insert own journal entries" on public.journals;
create policy "Users can insert own journal entries"
  on public.journals
  for insert
  with check (auth.uid() = user_id);

-- Users can only edit their own journal entries
drop policy if exists "Users can update own journal entries" on public.journals;
create policy "Users can update own journal entries"
  on public.journals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only delete their own journal entries
drop policy if exists "Users can delete own journal entries" on public.journals;
create policy "Users can delete own journal entries"
  on public.journals
  for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- E. Follows Policies
-- ------------------------------------------------------------------------------
-- Anyone can view the social follow graph
drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone"
  on public.follows
  for select
  using (true);

-- Authenticated users can follow others
drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
  on public.follows
  for insert
  with check (auth.uid() = follower_id and follower_id != following_id);

-- Authenticated users can unfollow
drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows
  for delete
  using (auth.uid() = follower_id);

-- ==============================================================================
-- 10. Storage Bucket Setup (Avatars & Cover Art)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatar" on storage.objects;
create policy "Authenticated users can upload avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
