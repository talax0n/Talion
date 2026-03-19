import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/db/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createServiceClient();

  // Verify ownership
  const { data: workspace, error: fetchError } = await db
    .from('workspaces')
    .select('id, owner_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  if (workspace.owner_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    name?: string;
    description?: string;
    visibility?: 'private' | 'public';
    custom_domain?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.visibility !== undefined) updates.visibility = body.visibility;
  if (body.custom_domain !== undefined) updates.custom_domain = body.custom_domain;

  const { data, error } = await db
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workspace: data });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createServiceClient();

  // Verify ownership
  const { data: workspace, error: fetchError } = await db
    .from('workspaces')
    .select('id, owner_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  if (workspace.owner_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await db.from('workspaces').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
