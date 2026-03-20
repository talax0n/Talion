import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/shell/AppShell'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { GlobalSearch } from '@/components/search/GlobalSearch'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login')
  }

  return (
    <WorkspaceProvider>
      <GlobalSearch>
        <AppShell user={session.user}>
          {children}
        </AppShell>
      </GlobalSearch>
    </WorkspaceProvider>
  )
}
