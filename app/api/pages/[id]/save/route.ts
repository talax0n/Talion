import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/db/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: pageId } = await params;

  let body: { title?: string; content_md?: string; content_html?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, content_md, content_html } = body;
  if (title === undefined || content_md === undefined || content_html === undefined) {
    return NextResponse.json(
      { error: 'title, content_md, and content_html are required' },
      { status: 400 },
    );
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  // Update the page
  const { error: updateError } = await db
    .from('pages')
    .update({ title, content_md, content_html, updated_at: now })
    .eq('id', pageId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Insert a new version
  const { error: insertError } = await db.from('page_versions').insert({
    page_id: pageId,
    author_id: session.user.id,
    title,
    content: content_md,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Prune versions — keep at most 50
  const { count, error: countError } = await db
    .from('page_versions')
    .select('*', { count: 'exact', head: true })
    .eq('page_id', pageId);

  if (!countError && count !== null && count > 50) {
    const excess = count - 50;
    const { data: oldest } = await db
      .from('page_versions')
      .select('id')
      .eq('page_id', pageId)
      .order('created_at', { ascending: true })
      .limit(excess);

    if (oldest && oldest.length > 0) {
      const ids = oldest.map((v) => v.id);
      await db.from('page_versions').delete().in('id', ids);
    }
  }

  return NextResponse.json({ success: true, updated_at: now });
}
