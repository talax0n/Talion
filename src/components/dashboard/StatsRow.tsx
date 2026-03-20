import { Card, CardContent } from '@/components/ui/card'
import { FileText, Globe, Users } from 'lucide-react'
import Link from 'next/link'

interface StatsRowProps {
  totalPages: number
  publishedPages: number
  totalMembers: number
}

export function StatsRow({ totalPages, publishedPages, totalMembers }: StatsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Link href="/pages">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPages}</p>
                <p className="text-sm text-muted-foreground">Total Pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <Link href="/pages">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedPages}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <Link href="/members">
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMembers}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
