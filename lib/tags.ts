import { createServiceClient } from '@/lib/db/server';

export interface TagCount {
  tag: string;
  count: number;
}

export interface PageRecord {
  id: string;
  workspace_id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  tags: string[];
  updated_at: string;
}

// Get all unique tags with counts for a workspace
export async function getAllTags(workspaceId: string): Promise<TagCount[]> {
  const db = createServiceClient();

  const { data, error } = await db
    .from('pages')
    .select('tags')
    .eq('workspace_id', workspaceId)
    .neq('status', 'archived');

  if (error) throw new Error(error.message);

  const countMap = new Map<string, number>();
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) {
      countMap.set(tag, (countMap.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// Get pages by tags with AND/OR mode
export async function getPagesWithTags(
  workspaceId: string,
  tags: string[],
  mode: 'AND' | 'OR' = 'OR',
): Promise<PageRecord[]> {
  if (tags.length === 0) return [];

  const db = createServiceClient();

  let query = db
    .from('pages')
    .select('id, workspace_id, title, slug, status, visibility, tags, updated_at')
    .eq('workspace_id', workspaceId)
    .neq('status', 'archived');

  if (mode === 'OR') {
    // Postgres array overlap operator: tags && ARRAY[...]
    query = query.overlaps('tags', tags);
  } else {
    // AND mode: all tags must be present — tags @> ARRAY[...]
    query = query.contains('tags', tags);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PageRecord[];
}

// Sync page_tags table from page's tags array (call after updating a page's tags)
export async function syncPageTags(pageId: string, tags: string[]): Promise<void> {
  const db = createServiceClient();

  const { error: deleteError } = await db
    .from('page_tags')
    .delete()
    .eq('page_id', pageId);

  if (deleteError) throw new Error(deleteError.message);

  if (tags.length === 0) return;

  const rows = tags.map((tag) => ({ page_id: pageId, tag }));

  const { error: insertError } = await db.from('page_tags').insert(rows);

  if (insertError) throw new Error(insertError.message);
}
