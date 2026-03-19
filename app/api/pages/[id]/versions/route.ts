import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/db/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: pageId } = await params;
  const db = createServiceClient();

  const { data: versions, error } = await db
    .from('page_versions')
    .select('id, title, created_at, author_id')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: versions ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: pageId } = await params;

  let body: { action?: string; version_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.action !== 'restore' || !body.version_id) {
    return NextResponse.json(
      { error: 'action "restore" and version_id are required' },
      { status: 400 },
    );
  }

  const db = createServiceClient();

  // Fetch the version
  const { data: version, error: versionError } = await db
    .from('page_versions')
    .select('id, title, content')
    .eq('id', body.version_id)
    .eq('page_id', pageId)
    .single();

  if (versionError || !version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const restoredContentMd: string = version.content ?? '';

  // Update the page with the version's content (content_html reconstructed from md)
  const { error: updateError } = await db
    .from('pages')
    .update({
      title: version.title,
      content_md: restoredContentMd,
      content_html: restoredContentMd,
      updated_at: now,
    })
    .eq('id', pageId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Record the restore as a new version
  await db.from('page_versions').insert({
    page_id: pageId,
    author_id: session.user.id,
    title: version.title,
    content: restoredContentMd,
  });

  return NextResponse.json({
    success: true,
    page: {
      title: version.title,
      content_md: restoredContentMd,
      content_html: restoredContentMd,
      updated_at: now,
    },
  });
}
