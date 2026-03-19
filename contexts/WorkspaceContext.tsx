'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWorkspaces } from '@/hooks/use-workspaces';
import type { WorkspaceRecord } from '@/lib/workspace-utils';

const STORAGE_KEY = 'talion_active_workspace';

interface WorkspaceContextValue {
  activeWorkspaceId: string | null;
  activeWorkspace: WorkspaceRecord | null;
  setActiveWorkspaceId: (id: string) => void;
  workspaces: WorkspaceRecord[];
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { workspaces, isLoading } = useWorkspaces();
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);

  // On mount, restore from localStorage
  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    if (stored) {
      setActiveWorkspaceIdState(stored);
    }
  }, []);

  // When workspaces load, default to first if no valid active workspace is set
  useEffect(() => {
    if (isLoading || workspaces.length === 0) return;
    const valid = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!valid) {
      const first = workspaces[0];
      setActiveWorkspaceIdState(first.id);
      localStorage.setItem(STORAGE_KEY, first.id);
    }
  }, [workspaces, isLoading, activeWorkspaceId]);

  function setActiveWorkspaceId(id: string) {
    setActiveWorkspaceIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspaceId,
        activeWorkspace,
        setActiveWorkspaceId,
        workspaces,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  }
  return ctx;
}
