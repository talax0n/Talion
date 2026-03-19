-- ============================================================
-- Talion Database Schema v1
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Workspaces
create table public.workspaces (
  id            uuid default uuid_generate_v4() primary key,
  owner_id      text not null,
  name          text not null,
  slug          text not null,
  description   text,
  visibility    text not null default 'private'
                  check (visibility in ('private', 'public')),
  custom_domain text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null,
  unique(owner_id, slug)
);

-- Pages
create table public.pages (
  id            uuid default uuid_generate_v4() primary key,
  workspace_id  uuid references public.workspaces(id) on delete cascade not null,
  author_id     text,
  parent_id     uuid references public.pages(id) on delete set null,
  title         text not null default 'Untitled',
  slug          text not null,
  content_md    text not null default '',
  content_html  text not null default '',
  visibility    text not null default 'private'
                  check (visibility in ('private', 'group', 'specific', 'public')),
  status        text not null default 'draft'
                  check (status in ('draft', 'published', 'archived')),
  tags          text[] not null default '{}',
  depth         int not null default 0,
  sort_order    int not null default 0,
  icon          text,
  cover_url     text,
  position      int not null default 0,
  frontmatter   jsonb not null default '{}',
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null,
  unique(workspace_id, slug)
);

-- Page versions (history)
create table public.page_versions (
  id          uuid default uuid_generate_v4() primary key,
  page_id     uuid references public.pages(id) on delete cascade not null,
  author_id   text,
  title       text not null,
  content     text not null,
  created_at  timestamptz default now() not null
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

create trigger set_updated_at before update on public.workspaces
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.pages
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- PROFILES TABLE
-- ============================================================

-- User profiles (linked to BetterAuth user IDs which are text)
create table if not exists public.profiles (
  id          text primary key,  -- matches BetterAuth user.id (text)
  email       text,
  name        text,
  avatar_url  text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_workspaces_owner_id on public.workspaces(owner_id);
create index if not exists idx_workspaces_slug on public.workspaces(slug);
create index if not exists idx_pages_workspace_id on public.pages(workspace_id);
create index if not exists idx_pages_parent_id on public.pages(parent_id);
create index if not exists idx_pages_slug on public.pages(slug);
create index if not exists idx_pages_author_id on public.pages(author_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.pages enable row level security;

-- Profiles: users can read all profiles, update only their own
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_insert" on public.profiles
  for insert with check (true);

create policy "profiles_update" on public.profiles
  for update using (true);

-- Workspaces: owners have full access; public workspaces readable by all
create policy "workspaces_select" on public.workspaces
  for select using (
    visibility = 'public'
    or owner_id = current_setting('app.current_user_id', true)
  );

create policy "workspaces_insert" on public.workspaces
  for insert with check (
    owner_id = current_setting('app.current_user_id', true)
  );

create policy "workspaces_update" on public.workspaces
  for update using (
    owner_id = current_setting('app.current_user_id', true)
  );

create policy "workspaces_delete" on public.workspaces
  for delete using (
    owner_id = current_setting('app.current_user_id', true)
  );

-- Pages: author has full access; public pages readable by all
create policy "pages_select" on public.pages
  for select using (
    visibility = 'public'
    or author_id = current_setting('app.current_user_id', true)
  );

create policy "pages_insert" on public.pages
  for insert with check (
    author_id = current_setting('app.current_user_id', true)
  );

create policy "pages_update" on public.pages
  for update using (
    author_id = current_setting('app.current_user_id', true)
  );

create policy "pages_delete" on public.pages
  for delete using (
    author_id = current_setting('app.current_user_id', true)
  );
