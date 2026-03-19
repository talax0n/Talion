import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/db/server';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/markdown',
];

export async function POST(request: NextRequest) {
  // 1. Verify BetterAuth session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // 3. Validate file size (<= 50MB)
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413 });
  }

  // 4. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 415 });
  }

  // 5. Upload to Supabase Storage bucket 'page-assets'
  const supabase = createServiceClient();
  const userId = session.user.id;
  const fileName = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { data, error } = await supabase.storage
    .from('page-assets')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }

  // 6. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('page-assets')
    .getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
