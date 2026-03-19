import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/db/server';
import { getPages, createPage } from '@/lib/pages';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
  }

  try {
    const pages = await getPages(workspaceId, session.user.id);
    return NextResponse.json({ pages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { workspace_id?: string; parent_id?: string | null; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.workspace_id) {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
  }

  try {
    const db = createServiceClient();
    const page = await createPage(
      {
        workspace_id: body.workspace_id,
        author_id: session.user.id,
        parent_id: body.parent_id ?? null,
        title: body.title,
      },
      db,
    );
    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create page';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
