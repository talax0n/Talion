-- page_tags junction table for tag management
-- This table complements the existing tags text[] column on pages
CREATE TABLE IF NOT EXISTS public.page_tags (
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  tag     text NOT NULL,
  PRIMARY KEY (page_id, tag)  -- composite primary key
);

CREATE INDEX IF NOT EXISTS idx_page_tags_tag ON public.page_tags(tag);
CREATE INDEX IF NOT EXISTS idx_page_tags_page_id ON public.page_tags(page_id);

ALTER TABLE public.page_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_tags_select" ON public.page_tags
  FOR SELECT USING (true);

CREATE POLICY "page_tags_insert" ON public.page_tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "page_tags_delete" ON public.page_tags
  FOR DELETE USING (true);
