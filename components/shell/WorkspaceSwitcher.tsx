'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils';
import type { WorkspaceRecord } from '@/lib/workspace-utils';

interface WorkspaceSwitcherProps {
  /** Optional extra content (e.g. user name) to show below the workspace name */
  subtitle?: string;
  onNewWorkspace?: () => void;
}

export function WorkspaceSwitcher({ subtitle, onNewWorkspace }: WorkspaceSwitcherProps) {
  const { activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, workspaces } = useWorkspace();
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/workspaces/${deleteTarget.id}`, { method: 'DELETE' });
      // If we deleted the active workspace, switch to another
      if (deleteTarget.id === activeWorkspaceId) {
        const next = workspaces.find((w) => w.id !== deleteTarget.id);
        if (next) setActiveWorkspaceId(next.id);
      }
      // Trigger a page refresh so the workspace list re-fetches
      window.location.reload();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const initial = (activeWorkspace?.name ?? 'W').charAt(0).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left">
            <span className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-zinc-100 truncate">
                {activeWorkspace?.name ?? 'Workspace'}
              </div>
              {subtitle && (
                <div className="text-xs text-zinc-500 truncate">{subtitle}</div>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              className={cn(
                'flex items-center justify-between gap-2',
                ws.id === activeWorkspaceId && 'font-medium',
              )}
              onSelect={(e) => {
                // Prevent closing when clicking delete
                if ((e.target as HTMLElement).closest('[data-delete]')) {
                  e.preventDefault();
                }
              }}
            >
              <button
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
                onClick={() => setActiveWorkspaceId(ws.id)}
              >
                <span className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {ws.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspaceId && (
                  <span className="ml-auto text-indigo-600 shrink-0">&#10003;</span>
                )}
              </button>
              <button
                data-delete
                className="shrink-0 text-zinc-400 hover:text-red-500 transition-colors p-0.5 rounded"
                title="Delete workspace"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(ws);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <button
              className="flex items-center gap-1.5 w-full"
              onClick={onNewWorkspace}
            >
              <Plus className="w-3.5 h-3.5" />
              New workspace
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-800">{deleteTarget?.name}</span>? This action
              cannot be undone and all pages inside will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
