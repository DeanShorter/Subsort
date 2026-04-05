-- ═══════════════════════════════════════════════════════════
-- MIGRATION 003: Split channels into shared + per-user tables
-- ═══════════════════════════════════════════════════════════

-- Step 1: Create shared_channels table (one row per YouTube channel)
CREATE TABLE IF NOT EXISTS public.shared_channels (
  youtube_channel_id text PRIMARY KEY,
  title text,
  custom_url text,
  description text,
  thumbnail_url text,
  thumbnail_high_url text,
  banner_url text,
  subscriber_count bigint default 0,
  video_count integer default 0,
  view_count bigint default 0,
  channel_created_at timestamptz,
  uploads_playlist_id text,
  topics text[],
  topic_urls text[],
  topic_ids text[],
  keywords text,
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Public read access (for Discover page)
ALTER TABLE public.shared_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shared channels" ON public.shared_channels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert shared channels" ON public.shared_channels FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update shared channels" ON public.shared_channels FOR UPDATE USING (auth.role() = 'authenticated');

-- Step 2: Create user_channels table (per-user relationships)
CREATE TABLE IF NOT EXISTS public.user_channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  youtube_channel_id text REFERENCES public.shared_channels(youtube_channel_id) ON DELETE CASCADE NOT NULL,
  subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL,
  favourited boolean DEFAULT false,
  notes text,
  subscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, youtube_channel_id)
);

ALTER TABLE public.user_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own user_channels" ON public.user_channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_channels" ON public.user_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_channels" ON public.user_channels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_channels" ON public.user_channels FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_channels_user ON public.user_channels(user_id);
CREATE INDEX idx_user_channels_channel ON public.user_channels(youtube_channel_id);

-- Step 3: Migrate data from old channels table

-- 3a: Populate shared_channels with distinct channel data
INSERT INTO public.shared_channels (
  youtube_channel_id, title, custom_url, description,
  thumbnail_url, thumbnail_high_url, banner_url,
  subscriber_count, video_count, view_count,
  channel_created_at, uploads_playlist_id,
  topics, topic_urls, topic_ids, keywords, country,
  created_at, updated_at
)
SELECT DISTINCT ON (channel_id)
  channel_id,
  name,
  custom_url,
  description,
  thumbnail,
  thumbnail_high,
  banner_url,
  subscriber_count,
  video_count,
  view_count,
  channel_created_at,
  uploads_playlist_id,
  topics,
  topic_urls,
  topic_ids,
  keywords,
  country,
  created_at,
  updated_at
FROM public.channels
ORDER BY channel_id, updated_at DESC
ON CONFLICT (youtube_channel_id) DO NOTHING;

-- 3b: Populate user_channels with per-user relationships
INSERT INTO public.user_channels (
  user_id, youtube_channel_id, subcategory_id, favourited, notes, subscribed_at, created_at, updated_at
)
SELECT
  user_id,
  channel_id,
  subcategory_id,
  favourited,
  notes,
  subscribed_at,
  created_at,
  updated_at
FROM public.channels
ON CONFLICT (user_id, youtube_channel_id) DO NOTHING;

-- Step 4: Update channel_categories to reference user_channels
-- The existing channel_categories.channel_id references channels.id (UUID)
-- We need to add a youtube_channel_id column for the new relationship
ALTER TABLE public.channel_categories ADD COLUMN IF NOT EXISTS youtube_channel_id text;

-- Populate the new column from existing data
UPDATE public.channel_categories cc
SET youtube_channel_id = c.channel_id
FROM public.channels c
WHERE cc.channel_id = c.id;

-- Step 5: Create materialised view for Discover
CREATE MATERIALIZED VIEW IF NOT EXISTS public.channel_discover AS
SELECT
  sc.youtube_channel_id,
  sc.title,
  sc.description,
  sc.subscriber_count,
  sc.video_count,
  sc.thumbnail_url,
  sc.custom_url,
  mode() WITHIN GROUP (ORDER BY cc.category_id) as consensus_category_id,
  COUNT(DISTINCT uc.user_id) as subsnub_user_count
FROM public.shared_channels sc
JOIN public.user_channels uc ON sc.youtube_channel_id = uc.youtube_channel_id
LEFT JOIN public.channel_categories cc ON cc.youtube_channel_id = sc.youtube_channel_id AND cc.user_id = uc.user_id
WHERE cc.category_id IS NOT NULL
GROUP BY sc.youtube_channel_id, sc.title, sc.description,
         sc.subscriber_count, sc.video_count, sc.thumbnail_url, sc.custom_url;

CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_discover_id ON public.channel_discover(youtube_channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_discover_category ON public.channel_discover(consensus_category_id);

-- Step 6: Indexes on shared_channels
CREATE INDEX IF NOT EXISTS idx_shared_channels_subs ON public.shared_channels(subscriber_count DESC);
CREATE INDEX IF NOT EXISTS idx_shared_channels_updated ON public.shared_channels(updated_at);
