-- ============================================================
-- Talion Database Schema v1
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users 1:1)
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text,
  avatar_url  text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Workspaces
create table public.workspaces (
  id          uuid default uuid_generate_v4() primary key,
  owner_id    uuid references public.profiles(id) on delete cascade not null,
  name        text not null,
  slug        text not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,
  unique(owner_id, slug)
);

-- Pages
create table public.pages (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  author_id     uuid references public.profiles(id) on delete set null,
  parent_id     uuid references public.pages(id) on delete set null,
  title         text not null default 'Untitled',
  slug          text not null,
  content       text not null default '',
  visibility    text not null default 'private'
                  check (visibility in ('private', 'workspace', 'public')),
  status        text not null default 'draft'
                  check (status in ('draft', 'published', 'archived')),
  tags          text[] not null default '{}',
  depth         int not null default 0,
  sort_order    int not null default 0,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null,
  unique(workspace_id, slug)
);

-- Page versions (history)
create table public.page_versions (
  id          uuid default uuid_generate_v4() primary key,
  page_id     uuid references public.pages(id) on delete cascade not null,
  author_id   uuid references public.profiles(id) on delete set null,
  title       text not null,
  content     text not null,
  created_at  timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.workspaces    enable row level security;
alter table public.pages         enable row level security;
alter table public.page_versions enable row level security;

-- Profiles
create policy "profiles: own read"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update"
  on public.profiles for update using (auth.uid() = id);

-- Workspaces
create policy "workspaces: owner full access"
  on public.workspaces for all using (auth.uid() = owner_id);

-- Pages: public pages readable by anyone
create policy "pages: public readable"
  on public.pages for select
  using (visibility = 'public');

-- Pages: workspace members can read non-private pages
create policy "pages: workspace member read"
  on public.pages for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- Pages: workspace owner full access
create policy "pages: workspace owner write"
  on public.pages for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- Page versions: workspace owner access
create policy "page_versions: workspace owner"
  on public.page_versions for all
  using (
    page_id in (
      select p.id from public.pages p
      join public.workspaces w on p.workspace_id = w.id
      where w.owner_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict do nothing;

insert into storage.buckets (id, name, public)
  values ('page-assets', 'page-assets', false)
  on conflict do nothing;

-- Avatars: public read
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Avatars: owner upload
create policy "avatars: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Page assets: owner manage
create policy "page-assets: owner manage"
  on storage.objects for all
  using (
    bucket_id = 'page-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- updated_at auto-updater
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.workspaces
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.pages
  for each row execute procedure public.set_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
    values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-create default workspace on profile creation
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspaces (owner_id, name, slug)
    values (new.id, 'My Workspace', 'my-workspace-' || substr(new.id::text, 1, 8));
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();
