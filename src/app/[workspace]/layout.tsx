import type { ReactNode } from 'react'

interface WorkspaceLayoutProps {
  children: ReactNode
  params: { workspace: string }
}

export default function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
