'use client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, UserPlus, Search, Settings } from 'lucide-react'

interface QuickActionsProps {
  workspaceId: string
}

export function QuickActions({ workspaceId }: QuickActionsProps) {
  const router = useRouter()

  async function handleNewPage() {
    router.push('/pages/new')
  }

  const actions = [
    {
      label: 'New Page',
      icon: Plus,
      onClick: handleNewPage,
      hint: undefined,
    },
    {
      label: 'Invite Member',
      icon: UserPlus,
      onClick: () => router.push('/members'),
      hint: undefined,
    },
    {
      label: 'Search Pages',
      icon: Search,
      onClick: () => router.push('/search'),
      hint: '⌘K',
    },
    {
      label: 'Workspace Settings',
      icon: Settings,
      onClick: () => router.push('/settings/workspace'),
      hint: undefined,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {actions.map(action => (
            <Button
              key={action.label}
              variant="outline"
              className="justify-start w-full"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
              {action.hint && (
                <span className="ml-auto text-xs text-muted-foreground">{action.hint}</span>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
