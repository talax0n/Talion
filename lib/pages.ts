import type { SupabaseClient } from '@supabase/supabase-js';

export interface PageRecord {
  id: string;
  workspace_id: string;
  author_id: string | null;
  parent_id: string | null;
  title: string;
  slug: string;
  content_md: string;
  content_html: string;
  visibility: 'private' | 'group' | 'specific' | 'public';
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  depth: number;
  sort_order: number;
  icon: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${base || 'untitled'}-${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Server-side functions
// ---------------------------------------------------------------------------

export async function getPages(
  workspaceId: string,
  authorId: string,
): Promise<PageRecord[]> {
  const { createServiceClient } = await import('@/lib/db/server');
  const db = createServiceClient();
  const { data, error } = await db
    .from('pages')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('author_id', authorId)
    .neq('status', 'archived')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PageRecord[];
}

export async function getPage(id: string): Promise<PageRecord | null> {
  const { createServiceClient } = await import('@/lib/db/server');
  const db = createServiceClient();
  const { data, error } = await db
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as PageRecord;
}

export async function createPage(
  data: {
    workspace_id: string;
    author_id: string;
    parent_id?: string | null;
    title?: string;
  },
  db: SupabaseClient,
): Promise<PageRecord> {
  const title = data.title ?? 'Untitled';
  let depth = 0;

  if (data.parent_id) {
    const { data: parent, error: parentError } = await db
      .from('pages')
      .select('depth')
      .eq('id', data.parent_id)
      .single();

    if (parentError) throw new Error(`Parent page not found: ${parentError.message}`);
    depth = ((parent as { depth: number }).depth ?? 0) + 1;
  }

  if (depth > 5) {
    throw new Error('Maximum nesting depth (5) exceeded');
  }

  const { data: row, error } = await db
    .from('pages')
    .insert({
      workspace_id: data.workspace_id,
      author_id: data.author_id,
      parent_id: data.parent_id ?? null,
      title,
      slug: generateSlug(title),
      content_md: '',
      content_html: '',
      visibility: 'private',
      status: 'draft',
      tags: [],
      depth,
      sort_order: 0,
      icon: null,
      cover_url: null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return row as PageRecord;
}

export async function updatePage(
  id: string,
  data: Partial<PageRecord>,
  db: SupabaseClient,
): Promise<PageRecord> {
  const { data: row, error } = await db
    .from('pages')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return row as PageRecord;
}

export async function deletePage(id: string, db: SupabaseClient): Promise<void> {
  const { error } = await db
    .from('pages')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function updatePageParent(
  pageId: string,
  newParentId: string | null,
  db: SupabaseClient,
): Promise<void> {
  let depth = 0;

  if (newParentId) {
    const { data: parent, error: parentError } = await db
      .from('pages')
      .select('depth')
      .eq('id', newParentId)
      .single();

    if (parentError) throw new Error(`Parent page not found: ${parentError.message}`);
    depth = ((parent as { depth: number }).depth ?? 0) + 1;
  }

  if (depth > 5) {
    throw new Error('Maximum nesting depth (5) exceeded');
  }

  const { error } = await db
    .from('pages')
    .update({
      parent_id: newParentId,
      depth,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId);

  if (error) throw new Error(error.message);
}
