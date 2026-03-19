-- ============================================================
-- Talion Migration v2: Tags & page sort order
-- ============================================================

-- Tags table (for future normalization — pages still use text[])
create table if not exists public.tags (
  id           uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name         text not null,
  color        text,
  created_at   timestamptz default now() not null,
  unique(workspace_id, name)
);

-- Add sort_order to pages if missing (for drag-and-drop reordering)
alter table public.pages add column if not exists sort_order int not null default 0;
