-- Add youtube_tags column to video_duration_cache
ALTER TABLE video_duration_cache
  ADD COLUMN IF NOT EXISTS youtube_tags text[] DEFAULT '{}';
