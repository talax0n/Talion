import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  contentMd: string
  status: string
  updatedAt: string
  workspace?: { name: string }
  tags?: Array<{ tag: { name: string; color: string } }>
}

interface SearchResultItemProps {
  result: SearchResult
  query: string
}

function getExcerpt(text: string): string {
  if (!text) return ''
  return text.slice(0, 200)
}

export function SearchResultItem({ result, query }: SearchResultItemProps) {
  const excerpt = getExcerpt(result.contentMd)

  return (
    <Link href={`/pages/${result.id}`}>
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex-shrink-0">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{result.title}</p>
            {excerpt && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {excerpt}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {result.workspace && (
              <Badge variant="outline" className="text-xs">
                {result.workspace.name}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {result.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
