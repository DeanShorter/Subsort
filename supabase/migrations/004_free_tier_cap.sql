-- ═══════════════════════════════════════════════════════════
-- MIGRATION 004: Free tier 50-subscription cap
-- ═══════════════════════════════════════════════════════════

-- Add is_active flag to user_channels
ALTER TABLE public.user_channels ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add is_active flag to legacy channels table too
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- User plans table
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plan" ON public.user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plan" ON public.user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plan" ON public.user_plans FOR UPDATE USING (auth.uid() = user_id);

-- Helper function
CREATE OR REPLACE FUNCTION is_pro(uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_plans
    WHERE user_id = uid
    AND plan != 'free'
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  );
$$ LANGUAGE sql STABLE;

-- Index for fast active channel queries
CREATE INDEX IF NOT EXISTS idx_user_channels_active ON public.user_channels(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_channels_active ON public.channels(user_id, is_active);
