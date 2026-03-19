import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/db/server';
import { getPage, updatePage, deletePage } from '@/lib/pages';
import type { PageRecord } from '@/lib/pages';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const page = await getPage(id);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json({ page });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch page';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: Partial<PageRecord>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Prevent overwriting identity fields
  const { id: _id, workspace_id: _ws, author_id: _au, created_at: _ca, ...safeData } = body;

  try {
    const db = createServiceClient();
    const page = await updatePage(id, safeData, db);
    return NextResponse.json({ page });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update page';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const db = createServiceClient();
    await deletePage(id, db);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete page';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
