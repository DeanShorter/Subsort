-- Revert original Phase 1: drop tag columns from cached_videos
DROP INDEX IF EXISTS idx_cached_videos_length_bucket;
DROP INDEX IF EXISTS idx_cached_videos_content_tags;
DROP INDEX IF EXISTS idx_cached_videos_energy;
DROP INDEX IF EXISTS idx_cached_videos_format;
DROP INDEX IF EXISTS idx_cached_videos_length_energy;

ALTER TABLE cached_videos DROP CONSTRAINT IF EXISTS length_bucket_check;
ALTER TABLE cached_videos DROP CONSTRAINT IF EXISTS energy_check;
ALTER TABLE cached_videos DROP CONSTRAINT IF EXISTS format_check;

ALTER TABLE cached_videos
  DROP COLUMN IF EXISTS duration_seconds,
  DROP COLUMN IF EXISTS length_bucket,
  DROP COLUMN IF EXISTS content_tags,
  DROP COLUMN IF EXISTS energy,
  DROP COLUMN IF EXISTS format,
  DROP COLUMN IF EXISTS tags_generated_at;

-- New lean approach: video metadata cache (duration + YouTube category)
CREATE TABLE IF NOT EXISTS video_duration_cache (
  youtube_video_id text PRIMARY KEY,
  duration_seconds integer NOT NULL,
  youtube_category_id text,
  cached_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duration_cache_cached_at ON video_duration_cache(cached_at);
