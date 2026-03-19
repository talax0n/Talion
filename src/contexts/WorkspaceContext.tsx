'use client'
import { createContext, useContext, useState, useEffect } from 'react'

interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: string
}

interface WorkspaceContextValue {
  workspace: Workspace | null
  setWorkspace: (ws: Workspace | null) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: null,
  setWorkspace: () => {},
})

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('talion:workspace')
    if (saved) {
      try {
        setWorkspace(JSON.parse(saved))
      } catch {}
    }
  }, [])

  const handleSetWorkspace = (ws: Workspace | null) => {
    setWorkspace(ws)
    if (ws) localStorage.setItem('talion:workspace', JSON.stringify(ws))
    else localStorage.removeItem('talion:workspace')
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace: handleSetWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceContext() {
  return useContext(WorkspaceContext)
}
