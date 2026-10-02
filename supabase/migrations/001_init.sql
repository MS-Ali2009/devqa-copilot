-- DevQA Copilot: Supabase Initial Migration
-- Creates devqa_history and devqa_users tables with indexes

create table if not exists devqa_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  input_text text not null,
  output_text text not null,
  input_type text,
  output_mode text,
  platform text,
  environment text,
  language text,
  created_at timestamptz default now()
);

create index if not exists idx_devqa_history_user_created
  on devqa_history (user_id, created_at desc);

-- Users table for email + password auth
create table if not exists devqa_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text default 'user',  -- 'owner' | 'user'
  created_at timestamptz default now()
);

create index if not exists idx_devqa_users_email
  on devqa_users (email);
