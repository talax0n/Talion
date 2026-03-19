export interface WorkspaceRecord {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'private' | 'public';
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
