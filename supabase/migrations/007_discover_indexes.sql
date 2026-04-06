-- Indexes for category browse page performance

-- user_channels exclusion lookups (critical — prevents full table scan on NOT IN)
CREATE INDEX IF NOT EXISTS idx_user_channels_user_youtube
ON user_channels(user_id, youtube_channel_id);

-- channel_categories lookups by youtube_channel_id
CREATE INDEX IF NOT EXISTS idx_channel_categories_youtube_id
ON channel_categories(youtube_channel_id);

-- channel_categories category join
CREATE INDEX IF NOT EXISTS idx_channel_categories_category_id
ON channel_categories(category_id);

-- channels legacy table subcategory lookups
CREATE INDEX IF NOT EXISTS idx_channels_channel_id_subcategory
ON channels(channel_id, subcategory_id)
WHERE subcategory_id IS NOT NULL;

-- user_channels subcategory lookups
CREATE INDEX IF NOT EXISTS idx_user_channels_youtube_subcategory
ON user_channels(youtube_channel_id, subcategory_id)
WHERE subcategory_id IS NOT NULL;
