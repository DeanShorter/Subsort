-- Run this in Supabase Dashboard → SQL Editor

create table if not exists profiles (
  id                     uuid references auth.users(id) on delete cascade primary key,
  tier                   text not null default 'free',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text,          -- 'active' | 'canceled' | 'past_due' | 'trialing'
  tier_expires_at        timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Row Level Security
alter table profiles enable row level security;

-- Users can only read their own profile
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Only the service role (webhook) can update tier/subscription fields
-- No update policy for authenticated users = they cannot change their own tier
