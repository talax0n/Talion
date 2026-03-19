import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFile, getSignedUrl } from '@/lib/storage'

const MAX_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/markdown',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav',
]

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `uploads/${session.user.id}/${Date.now()}.${ext}`

  await uploadFile(file, path, file.type)
  const signedUrl = await getSignedUrl(path)

  return NextResponse.json({
    url: signedUrl,
    path,
    type: file.type,
  })
}
