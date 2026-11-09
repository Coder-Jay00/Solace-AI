-- ==============================================================================
-- Solace AI - Production Database Schema & Row-Level Security (RLS)
-- Phase 8: Supabase Cloud Backend Integration
--
-- Instructions:
-- Execute this entire script in your Supabase Project Dashboard:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. TABLES & RELATIONSHIPS
-- ==============================================================================

-- 2.1 PROFILES (1-to-1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  consent_version text default '1.0.0',
  consent_accepted_at timestamptz default now(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2.2 MOOD ENTRIES (Emotional reflections & daily check-ins)
create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mood text not null check (mood in ('happy', 'calm', 'neutral', 'sad', 'anxious')),
  mood_label text default '',
  emoji text default '🌿',
  energy_level integer not null check (energy_level >= 1 and energy_level <= 5),
  energy_label text default '',
  note text default '',
  nuance_tags text[] default '{}',
  context_tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2.3 BREATHING SESSIONS (Breathwork logs & completion metrics)
create table if not exists public.breathing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pattern_id text not null,
  pattern_name text not null,
  inhale integer,
  hold_in integer,
  exhale integer,
  hold_out integer,
  target_duration_minutes integer,
  completed_duration_seconds integer not null default 0,
  completed_cycles integer not null default 0,
  is_completed boolean default true not null,
  completed_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- 2.4 CONVERSATIONS (AI Companion conversation containers)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Sanctuary Reflection',
  last_message_text text default '',
  category text default 'Reflection',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2.5 CHAT MESSAGES (Individual messages in conversations)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  sender text not null check (sender in ('user', 'assistant', 'system')),
  text text not null,
  is_crisis boolean default false,
  created_at timestamptz default now() not null
);

-- 2.6 USER PREFERENCES (Sync for notification & routine preferences)
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  theme_mode text default 'system' check (theme_mode in ('system', 'light', 'dark')),
  master_enabled boolean default false not null,
  mood_reminder jsonb not null default '{"enabled": false, "hour": 20, "minute": 0}'::jsonb,
  breathing_reminder jsonb not null default '{"enabled": false, "hour": 14, "minute": 0, "selectedDays": [2, 3, 4, 5, 6]}'::jsonb,
  intention_reminder jsonb not null default '{"enabled": false, "hour": 8, "minute": 30}'::jsonb,
  companion_reminder jsonb not null default '{"enabled": false, "hour": 19, "minute": 0, "selectedDays": [2, 3, 4, 5, 6]}'::jsonb,
  quiet_hours jsonb not null default '{"enabled": false, "startHour": 22, "startMinute": 0, "endHour": 7, "endMinute": 0}'::jsonb,
  updated_at timestamptz default now() not null
);

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ==============================================================================

create index if not exists idx_profiles_id on public.profiles(id);

create index if not exists idx_mood_entries_user_date on public.mood_entries(user_id, created_at desc);

create index if not exists idx_breathing_sessions_user_date on public.breathing_sessions(user_id, completed_at desc);

create index if not exists idx_conversations_user_updated on public.conversations(user_id, updated_at desc);

create index if not exists idx_chat_messages_conv_date on public.chat_messages(conversation_id, created_at asc);
create index if not exists idx_chat_messages_user on public.chat_messages(user_id);

create index if not exists idx_user_preferences_user on public.user_preferences(user_id);

-- ==============================================================================
-- 4. AUTOMATIC USER INITIALIZATION TRIGGER
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Create matching profile
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    consent_version,
    consent_accepted_at,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      case 
        when new.raw_user_meta_data->>'given_name' is not null and new.raw_user_meta_data->>'family_name' is not null 
        then concat(new.raw_user_meta_data->>'given_name', ' ', new.raw_user_meta_data->>'family_name')
        when new.raw_user_meta_data->>'given_name' is not null 
        then new.raw_user_meta_data->>'given_name'
        else null
      end,
      split_part(coalesce(new.email, ''), '@', 1),
      'Sanctuary Explorer'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    coalesce(new.raw_user_meta_data->>'consent_version', '1.0.0'),
    case 
      when new.raw_user_meta_data->>'consent_accepted_at' is not null 
      then (new.raw_user_meta_data->>'consent_accepted_at')::timestamptz 
      else now() 
    end,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  -- 2. Create default user preferences
  insert into public.user_preferences (user_id, updated_at)
  values (new.id, now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Drop existing trigger if it exists to allow idempotent re-execution
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.mood_entries enable row level security;
alter table public.breathing_sessions enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.user_preferences enable row level security;

-- 5.1 PROFILES POLICIES
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- 5.2 MOOD ENTRIES POLICIES
drop policy if exists "Users can view their own mood entries" on public.mood_entries;
create policy "Users can view their own mood entries"
  on public.mood_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own mood entries" on public.mood_entries;
create policy "Users can insert their own mood entries"
  on public.mood_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own mood entries" on public.mood_entries;
create policy "Users can update their own mood entries"
  on public.mood_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own mood entries" on public.mood_entries;
create policy "Users can delete their own mood entries"
  on public.mood_entries for delete
  using (auth.uid() = user_id);

-- 5.3 BREATHING SESSIONS POLICIES
drop policy if exists "Users can view their own breathing sessions" on public.breathing_sessions;
create policy "Users can view their own breathing sessions"
  on public.breathing_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own breathing sessions" on public.breathing_sessions;
create policy "Users can insert their own breathing sessions"
  on public.breathing_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own breathing sessions" on public.breathing_sessions;
create policy "Users can update their own breathing sessions"
  on public.breathing_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own breathing sessions" on public.breathing_sessions;
create policy "Users can delete their own breathing sessions"
  on public.breathing_sessions for delete
  using (auth.uid() = user_id);

-- 5.4 CONVERSATIONS POLICIES
drop policy if exists "Users can view their own conversations" on public.conversations;
create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own conversations" on public.conversations;
create policy "Users can insert their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own conversations" on public.conversations;
create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own conversations" on public.conversations;
create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- 5.5 CHAT MESSAGES POLICIES
drop policy if exists "Users can view their own chat messages" on public.chat_messages;
create policy "Users can view their own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own chat messages" on public.chat_messages;
create policy "Users can insert their own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own chat messages" on public.chat_messages;
create policy "Users can update their own chat messages"
  on public.chat_messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own chat messages" on public.chat_messages;
create policy "Users can delete their own chat messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- 5.6 USER PREFERENCES POLICIES
drop policy if exists "Users can view their own preferences" on public.user_preferences;
create policy "Users can view their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own preferences" on public.user_preferences;
create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own preferences" on public.user_preferences;
create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own preferences" on public.user_preferences;
create policy "Users can delete their own preferences"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- SCHEMA CREATION COMPLETE
-- ==============================================================================
