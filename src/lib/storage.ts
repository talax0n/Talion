import { createClient } from '@supabase/supabase-js'

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key).storage
}

export async function uploadFile(file: File | Buffer, path: string, contentType?: string) {
  const storage = getStorageClient()
  const { data, error } = await storage
    .from('page-assets')
    .upload(path, file, { contentType, upsert: true })
  if (error) throw error
  return data
}

export async function getSignedUrl(path: string, expiresIn = 3600) {
  const storage = getStorageClient()
  const { data, error } = await storage
    .from('page-assets')
    .createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function deleteFile(path: string) {
  const storage = getStorageClient()
  const { error } = await storage.from('page-assets').remove([path])
  if (error) throw error
}
