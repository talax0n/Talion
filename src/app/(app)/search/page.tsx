import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { searchPages } from '@/lib/search'
import { SearchResults } from '@/components/search/SearchResults'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { q = '' } = await searchParams

  const profile = await prisma.profile.findUnique({
    where: { email: session.user.email },
  })
  if (!profile) redirect('/login')

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: profile.id },
    orderBy: { createdAt: 'asc' },
  })

  type PageWithRelations = Awaited<ReturnType<typeof prisma.page.findMany>>[number] & {
    workspace?: { name: string }
    tags?: Array<{ tag: { name: string; color: string } }>
  }

  let results: PageWithRelations[] = []

  if (workspace && q) {
    try {
      const searchResults = await searchPages(q, workspace.id)
      // searchPages returns SearchResult[] with id/title/slug/excerpt/rank
      // Fetch full page data for the result IDs so we have contentMd + relations
      results = await prisma.page.findMany({
        where: { id: { in: searchResults.map(r => r.id) } },
        include: { workspace: true, tags: { include: { tag: true } } },
      }) as PageWithRelations[]
      // Preserve rank order from searchPages
      const rankMap = new Map(searchResults.map((r, i) => [r.id, i]))
      results.sort((a, b) => (rankMap.get(a.id) ?? 99) - (rankMap.get(b.id) ?? 99))
    } catch {
      results = await prisma.page.findMany({
        where: {
          workspaceId: workspace.id,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { contentMd: { contains: q, mode: 'insensitive' } },
          ],
          status: { not: 'archived' },
        },
        include: { workspace: true, tags: { include: { tag: true } } },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }) as PageWithRelations[]
    }
  } else if (workspace) {
    results = await prisma.page.findMany({
      where: { workspaceId: workspace.id, status: { not: 'archived' } },
      include: { workspace: true, tags: { include: { tag: true } } },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    }) as PageWithRelations[]
  }

  return (
    <div className="p-6 max-w-3xl">
      <SearchResults results={results as any} query={q} />
    </div>
  )
}
