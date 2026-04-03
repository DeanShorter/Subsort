-- Stash collections
create table if not exists public.stash_collections (
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

-- Stash items (saved videos)
create table if not exists public.stash_items (
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

create index idx_stash_items_user_id on public.stash_items(user_id);
create index idx_stash_items_collection_id on public.stash_items(collection_id);
create index idx_stash_collections_user_id on public.stash_collections(user_id);
