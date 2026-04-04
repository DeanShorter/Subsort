-- ═══════════════════════════════════════════════════════════
-- SUBSORT DATABASE SCHEMA
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- ─── PROFILES ───
-- Stores user info, linked to Supabase Auth
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'pro', 'power')),
  google_token text,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── CATEGORIES ───
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  colour text,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.categories enable row level security;

create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);


-- ─── SUBCATEGORIES ───
create table public.subcategories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(category_id, name)
);

alter table public.subcategories enable row level security;

create policy "Users can view their own subcategories"
  on public.subcategories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subcategories"
  on public.subcategories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subcategories"
  on public.subcategories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subcategories"
  on public.subcategories for delete
  using (auth.uid() = user_id);


-- ─── CHANNELS ───
-- Stores YouTube channels for each user
create table public.channels (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  channel_id text not null,             -- YouTube channel ID (UC...)
  name text not null,
  custom_url text,
  thumbnail text,
  thumbnail_high text,
  banner_url text,
  description text,
  subscriber_count bigint default 0,
  video_count int default 0,
  view_count bigint default 0,
  subscribed_at timestamptz,
  channel_created_at timestamptz,
  uploads_playlist_id text,
  topics text[],                        -- Array of topic strings (decoded wiki names)
  topic_urls text[],                    -- Raw Wikipedia URLs from topicCategories
  topic_ids text[],                     -- Freebase topic IDs from topicIds
  keywords text,
  country text,
  notes text,
  favourited boolean default false,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, channel_id)
);

alter table public.channels enable row level security;

create policy "Users can view their own channels"
  on public.channels for select
  using (auth.uid() = user_id);

create policy "Users can insert their own channels"
  on public.channels for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own channels"
  on public.channels for update
  using (auth.uid() = user_id);

create policy "Users can delete their own channels"
  on public.channels for delete
  using (auth.uid() = user_id);


-- ─── CHANNEL CATEGORIES (many-to-many) ───
-- A channel can belong to multiple categories
create table public.channel_categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  channel_id uuid references public.channels(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(channel_id, category_id)
);

alter table public.channel_categories enable row level security;

create policy "Users can view their own channel_categories"
  on public.channel_categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own channel_categories"
  on public.channel_categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own channel_categories"
  on public.channel_categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own channel_categories"
  on public.channel_categories for delete
  using (auth.uid() = user_id);


-- ─── WATCH HISTORY ───
-- Stores imported Google Takeout watch history
create table public.watch_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id text not null,
  video_title text,
  channel_name text,
  channel_id text,
  watched_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.watch_history enable row level security;

create policy "Users can view their own watch_history"
  on public.watch_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own watch_history"
  on public.watch_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own watch_history"
  on public.watch_history for delete
  using (auth.uid() = user_id);


-- ─── FEED CACHE ───
-- Server-side cache for YouTube feed videos (reduces API quota usage)
create table public.feed_cache (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  cache_key text not null,
  data jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  unique(user_id, cache_key)
);

alter table public.feed_cache enable row level security;

create policy "Users can view their own feed_cache"
  on public.feed_cache for select
  using (auth.uid() = user_id);

create policy "Users can insert their own feed_cache"
  on public.feed_cache for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own feed_cache"
  on public.feed_cache for update
  using (auth.uid() = user_id);

create policy "Users can delete their own feed_cache"
  on public.feed_cache for delete
  using (auth.uid() = user_id);


-- ─── STASH ───
-- User's saved video collections
create table public.stash_collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  collection_type text default 'simple' check (collection_type in ('simple', 'curated')),
  icon text default 'star',
  colour text default 'var(--accent)',
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.stash_collections enable row level security;
create policy "Users can view own collections" on public.stash_collections for select using (auth.uid() = user_id);
create policy "Users can insert own collections" on public.stash_collections for insert with check (auth.uid() = user_id);
create policy "Users can update own collections" on public.stash_collections for update using (auth.uid() = user_id);
create policy "Users can delete own collections" on public.stash_collections for delete using (auth.uid() = user_id);

-- Individual saved videos
create table public.stash_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  collection_id uuid references public.stash_collections(id) on delete set null,
  video_id text not null,
  title text,
  channel_name text,
  channel_id text,
  thumbnail text,
  duration text,
  published_at timestamptz,
  saved_at timestamptz default now(),
  watched boolean default false,
  sort_order int default 0,
  context_note text,
  notes text,
  unique(user_id, video_id)
);

alter table public.stash_items enable row level security;
create policy "Users can view own stash items" on public.stash_items for select using (auth.uid() = user_id);
create policy "Users can insert own stash items" on public.stash_items for insert with check (auth.uid() = user_id);
create policy "Users can update own stash items" on public.stash_items for update using (auth.uid() = user_id);
create policy "Users can delete own stash items" on public.stash_items for delete using (auth.uid() = user_id);

-- ─── INDEXES ───
-- Performance indexes for common queries
create index idx_channels_user_id on public.channels(user_id);
create index idx_channels_channel_id on public.channels(channel_id);
create index idx_categories_user_id on public.categories(user_id);
create index idx_subcategories_category_id on public.subcategories(category_id);
create index idx_channel_categories_channel_id on public.channel_categories(channel_id);
create index idx_channel_categories_category_id on public.channel_categories(category_id);
create index idx_watch_history_user_id on public.watch_history(user_id);
create index idx_watch_history_watched_at on public.watch_history(watched_at);
create index idx_feed_cache_expires on public.feed_cache(expires_at);


-- ─── UPDATED_AT TRIGGER ───
-- Automatically update the updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger channels_updated_at
  before update on public.channels
  for each row execute procedure public.update_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();


-- ─── AGGREGATE VIEW FOR PROGRAMMATIC SEO ───
-- Anonymised aggregate data for blog/SEO pages
create or replace view public.category_stats as
select
  c.name as category_name,
  count(distinct cc.channel_id) as channel_count,
  avg(ch.subscriber_count)::bigint as avg_subscribers,
  avg(ch.video_count)::int as avg_videos,
  count(distinct cc.user_id) as user_count
from public.categories c
join public.channel_categories cc on cc.category_id = c.id
join public.channels ch on ch.id = cc.channel_id
group by c.name
having count(distinct cc.user_id) >= 3;  -- Only show categories used by 3+ users (privacy)
