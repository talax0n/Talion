import { prisma } from '@/lib/prisma'

export interface SearchResult {
  id: string
  title: string
  slug: string
  workspaceId: string
  excerpt: string
  rank: number
}

export async function searchPages(query: string, workspaceId: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  try {
    // Attempt pg_trgm similarity-based search
    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT
        id,
        title,
        slug,
        workspace_id as "workspaceId",
        LEFT(content_md, 200) as excerpt,
        similarity(title, ${query}) as rank
      FROM pages
      WHERE workspace_id = ${workspaceId}
        AND status != 'archived'
        AND (
          title ILIKE ${'%' + query + '%'}
          OR content_md ILIKE ${'%' + query + '%'}
        )
      ORDER BY rank DESC
      LIMIT 20
    `
    return results
  } catch {
    // Fallback if pg_trgm extension is not installed — use ILIKE only
    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT
        id,
        title,
        slug,
        workspace_id as "workspaceId",
        LEFT(content_md, 200) as excerpt,
        1.0 as rank
      FROM pages
      WHERE workspace_id = ${workspaceId}
        AND status != 'archived'
        AND (
          title ILIKE ${'%' + query + '%'}
          OR content_md ILIKE ${'%' + query + '%'}
        )
      ORDER BY title
      LIMIT 20
    `
    return results
  }
}
