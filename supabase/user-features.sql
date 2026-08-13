-- ============================================================
-- USER PROFILES
-- Auto-created when a user signs up via Supabase Auth
-- ============================================================
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  display_name text,
  avatar_url  text,
  bio         text,
  created_at  timestamptz default now()
);

alter table public.user_profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.user_profiles for select using (true);

create policy "Users can update their own profile"
  on public.user_profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- USER VOTES (community scores on movies)
-- ============================================================
create table if not exists public.user_votes (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  movie_id   integer not null,
  recommend  boolean not null,
  score      smallint check (score between 1 and 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, movie_id)
);

alter table public.user_votes enable row level security;

create policy "Anyone can read vote counts"
  on public.user_votes for select using (true);

create policy "Logged-in users can insert their own vote"
  on public.user_votes for insert with check (auth.uid() = user_id);

create policy "Logged-in users can update their own vote"
  on public.user_votes for update using (auth.uid() = user_id);

create policy "Logged-in users can delete their own vote"
  on public.user_votes for delete using (auth.uid() = user_id);


-- ============================================================
-- POLLS
-- ============================================================
create table if not exists public.polls (
  id          bigint generated always as identity primary key,
  question    text not null,
  is_active   boolean default true,
  closes_at   timestamptz,
  created_at  timestamptz default now()
);

create table if not exists public.poll_options (
  id       bigint generated always as identity primary key,
  poll_id  bigint references public.polls(id) on delete cascade not null,
  label    text not null,
  position smallint default 0
);

create table if not exists public.poll_votes (
  id        bigint generated always as identity primary key,
  poll_id   bigint references public.polls(id) on delete cascade not null,
  option_id bigint references public.poll_options(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (poll_id, user_id)
);

alter table public.polls      enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes  enable row level security;

create policy "Anyone can read polls"        on public.polls        for select using (true);
create policy "Anyone can read poll options" on public.poll_options  for select using (true);
create policy "Anyone can read poll votes"   on public.poll_votes    for select using (true);

create policy "Logged-in users can vote"
  on public.poll_votes for insert with check (auth.uid() = user_id);

create policy "Logged-in users can change vote"
  on public.poll_votes for delete using (auth.uid() = user_id);
