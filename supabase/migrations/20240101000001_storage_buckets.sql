-- Create storage bucket for page assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-assets',
  'page-assets',
  false,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage bucket
CREATE POLICY "page_assets_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'page-assets'
    AND current_setting('app.user_id', true) IS NOT NULL
  );

CREATE POLICY "page_assets_owner_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'page-assets'
    AND owner = current_setting('app.user_id', true)
  );

CREATE POLICY "page_assets_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'page-assets'
    AND owner = current_setting('app.user_id', true)
  );
