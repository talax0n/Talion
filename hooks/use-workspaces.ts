'use client';

import useSWR from 'swr';
import type { WorkspaceRecord } from '@/lib/workspace-utils';

const fetcher = async (url: string): Promise<WorkspaceRecord[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  const json = await res.json();
  return json.workspaces as WorkspaceRecord[];
};

export function useWorkspaces() {
  const { data, error, isLoading, mutate } = useSWR<WorkspaceRecord[]>(
    '/api/workspaces',
    fetcher,
  );

  return {
    workspaces: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
