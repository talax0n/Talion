-- ============================================================
-- Talion Migration v2: File uploads storage bucket
-- ============================================================

-- Create uploads storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  true,
  52428800,  -- 50MB in bytes
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- RLS: Allow authenticated users to upload to their own folder
create policy "Authenticated users can upload files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'uploads' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- RLS: Allow public read of uploads bucket
create policy "Public read access for uploads"
  on storage.objects for select
  to public
  using (bucket_id = 'uploads');

-- RLS: Allow users to delete their own files
create policy "Users can delete their own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'uploads' AND
    auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- ============================================================
-- Tags table (for future normalization — pages still use text[])
-- ============================================================
create table if not exists public.tags (
  id           uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name         text not null,
  color        text,
  created_at   timestamptz default now() not null,
  unique(workspace_id, name)
);

alter table public.tags enable row level security;

create policy "Workspace members can read tags"
  on public.tags for select
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

create policy "Workspace owners can manage tags"
  on public.tags for all
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- Add sort_order to pages if missing (for drag-and-drop reordering)
alter table public.pages add column if not exists sort_order int not null default 0;
