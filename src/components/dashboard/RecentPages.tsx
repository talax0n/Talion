import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import Link from 'next/link'

interface Page {
  id: string
  title: string
  icon: string | null
  status: string
  updatedAt: Date
  author: { fullName?: string | null; email: string }
  tags: Array<{ tag: { name: string; color: string } }>
}

interface RecentPagesProps {
  pages: Page[]
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  archived: 'outline',
}

export function RecentPages({ pages }: RecentPagesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Pages</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pages">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No pages yet — create your first</p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/pages/new">Create page</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {pages.map(page => (
              <Link key={page.id} href={`/pages/${page.id}`}>
                <div className="flex items-center gap-3 py-3 hover:bg-accent rounded px-2 -mx-2 transition-colors">
                  <div className="flex-shrink-0">
                    {page.icon ? (
                      <span className="text-xl">{page.icon}</span>
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{page.title || 'Untitled'}</p>
                  </div>
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {(page.author.fullName ?? page.author.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {timeAgo(page.updatedAt)}
                  </span>
                  <Badge variant={STATUS_VARIANT[page.status] ?? 'secondary'} className="text-xs flex-shrink-0">
                    {page.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
