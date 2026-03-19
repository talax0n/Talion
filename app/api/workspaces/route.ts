import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/db/server';
import { generateSlug } from '@/lib/workspace-utils';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('workspaces')
    .select('*')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workspaces: data });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { name?: string; description?: string; visibility?: 'private' | 'public' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, description, visibility = 'private' } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const db = createServiceClient();
  const baseSlug = generateSlug(name);

  // Ensure slug uniqueness for this owner
  let slug = baseSlug;
  let counter = 2;
  while (true) {
    const { data: existing } = await db
      .from('workspaces')
      .select('id')
      .eq('owner_id', session.user.id)
      .eq('slug', slug)
      .maybeSingle();

    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const { data, error } = await db
    .from('workspaces')
    .insert({
      owner_id: session.user.id,
      name: name.trim(),
      slug,
      description: description ?? null,
      visibility,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workspace: data }, { status: 201 });
}
