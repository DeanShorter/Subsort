CREATE TABLE IF NOT EXISTS public.deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text,
  account_age_days integer,
  total_channels integer,
  managed_channels integer,
  deleted_at timestamptz DEFAULT now()
);

-- No RLS — service role writes only, admin reads
ALTER TABLE public.deletion_log ENABLE ROW LEVEL SECURITY;
