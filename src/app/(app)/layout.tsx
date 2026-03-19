import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/shell/AppShell'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login')
  }

  return (
    <WorkspaceProvider>
      <AppShell user={session.user}>
        {children}
      </AppShell>
    </WorkspaceProvider>
  )
}
