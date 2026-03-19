-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable RLS on all app tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE obsidian_sync_log ENABLE ROW LEVEL SECURITY;

-- Profiles: owner can read/update their own profile
CREATE POLICY "profiles_owner_select" ON profiles
  FOR SELECT USING (id = current_setting('app.user_id', true));

CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE USING (id = current_setting('app.user_id', true));

CREATE POLICY "profiles_owner_insert" ON profiles
  FOR INSERT WITH CHECK (id = current_setting('app.user_id', true));

-- Workspaces: owner full access; public read if visibility='public'
CREATE POLICY "workspaces_owner_all" ON workspaces
  FOR ALL USING (owner_id = current_setting('app.user_id', true));

CREATE POLICY "workspaces_public_select" ON workspaces
  FOR SELECT USING (visibility = 'public');

-- Pages: author full access; public read if visibility='public' AND status='published'
CREATE POLICY "pages_author_all" ON pages
  FOR ALL USING (author_id = current_setting('app.user_id', true));

CREATE POLICY "pages_public_select" ON pages
  FOR SELECT USING (visibility = 'public' AND status = 'published');

-- Page versions: author of parent page
CREATE POLICY "page_versions_author_all" ON page_versions
  FOR ALL USING (author_id = current_setting('app.user_id', true));

-- Tags: workspace owner
CREATE POLICY "tags_workspace_owner" ON tags
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = current_setting('app.user_id', true)
    )
  );

-- Page tags: page author
CREATE POLICY "page_tags_author" ON page_tags
  FOR ALL USING (
    page_id IN (
      SELECT id FROM pages
      WHERE author_id = current_setting('app.user_id', true)
    )
  );

-- Page links: source page author
CREATE POLICY "page_links_author" ON page_links
  FOR ALL USING (
    source_id IN (
      SELECT id FROM pages
      WHERE author_id = current_setting('app.user_id', true)
    )
  );

-- Access groups: workspace owner
CREATE POLICY "access_groups_owner" ON access_groups
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = current_setting('app.user_id', true)
    )
  );

-- Access group members: group workspace owner
CREATE POLICY "access_group_members_owner" ON access_group_members
  FOR ALL USING (
    group_id IN (
      SELECT ag.id FROM access_groups ag
      JOIN workspaces w ON ag.workspace_id = w.id
      WHERE w.owner_id = current_setting('app.user_id', true)
    )
  );

-- Page access: page author
CREATE POLICY "page_access_author" ON page_access
  FOR ALL USING (
    page_id IN (
      SELECT id FROM pages
      WHERE author_id = current_setting('app.user_id', true)
    )
  );

-- Comments: comment author or page author
CREATE POLICY "comments_author_all" ON comments
  FOR ALL USING (author_id = current_setting('app.user_id', true));

CREATE POLICY "comments_page_author_select" ON comments
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM pages
      WHERE author_id = current_setting('app.user_id', true)
    )
  );

-- Obsidian sync log: page author
CREATE POLICY "obsidian_sync_log_author" ON obsidian_sync_log
  FOR ALL USING (
    page_id IN (
      SELECT id FROM pages
      WHERE author_id = current_setting('app.user_id', true)
    )
  );
