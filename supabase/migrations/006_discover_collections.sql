-- Public discoverable collections (separate from user stash_collections)
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  collection_type text NOT NULL DEFAULT 'playlist'
    CHECK (collection_type IN ('learning', 'playlist', 'rabbithole')),
  is_public boolean DEFAULT true,
  video_count integer DEFAULT 0,
  estimated_duration_seconds integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_collections_type ON public.collections(collection_type);
CREATE INDEX idx_collections_user ON public.collections(user_id);
CREATE INDEX idx_collections_public ON public.collections(is_public) WHERE is_public = true;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public collections"
  ON public.collections FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own collections"
  ON public.collections FOR ALL USING (auth.uid() = user_id);

-- Collection ratings
CREATE TABLE IF NOT EXISTS public.collection_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, user_id)
);

CREATE INDEX idx_collection_ratings_collection ON public.collection_ratings(collection_id);

ALTER TABLE public.collection_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ratings"
  ON public.collection_ratings FOR SELECT USING (true);
CREATE POLICY "Users can manage own ratings"
  ON public.collection_ratings FOR ALL USING (auth.uid() = user_id);

-- Materialized view for rating aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS public.collection_rating_summary AS
SELECT
  collection_id,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  COUNT(*) as review_count
FROM public.collection_ratings
GROUP BY collection_id;

CREATE UNIQUE INDEX ON public.collection_rating_summary(collection_id);
