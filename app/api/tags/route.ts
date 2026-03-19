import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllTags } from '@/lib/tags';

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
    const tags = await getAllTags(workspaceId);
    return NextResponse.json({ tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tags';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
