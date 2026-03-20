import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ThemeCustomizer } from '@/components/workspace/ThemeCustomizer'
import type { AccentColor } from '@/types/theme'

export default async function WorkspaceThemePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  if (!workspace) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Theme</h1>
        <p className="text-muted-foreground">No workspace found. Create one first.</p>
      </div>
    )
  }

  const theme = workspace.theme as {
    accent?: AccentColor
    fontFamily?: string
    customCss?: string
  } | null

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Theme Customization</h1>
      <ThemeCustomizer
        workspaceId={workspace.id}
        initialTheme={theme ?? {}}
      />
    </div>
  )
}
