'use client';

import { useEffect, useState } from 'react';
import {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getStore,
  type Workspace,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceNames, setWorkspaceNames] = useState<Record<string, string>>({});
  const [workspaceSaved, setWorkspaceSaved] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newWsOpen, setNewWsOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('talion_user');
    if (raw) {
      const user = JSON.parse(raw);
      setUserName(user.name ?? '');
      setUserEmail(user.email ?? '');
      setNameDraft(user.name ?? '');
    }
    refreshWorkspaces();
  }, []);

  function refreshWorkspaces() {
    const ws = getWorkspaces();
    setWorkspaces(ws);
    const names: Record<string, string> = {};
    ws.forEach((w) => { names[w.id] = w.name; });
    setWorkspaceNames(names);
  }

  function handleSaveName() {
    const raw = localStorage.getItem('talion_user');
    const user = raw ? JSON.parse(raw) : {};
    user.name = nameDraft;
    localStorage.setItem('talion_user', JSON.stringify(user));
    setUserName(nameDraft);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  function handleSaveWorkspace(wsId: string) {
    const newName = workspaceNames[wsId];
    if (!newName?.trim()) return;
    updateWorkspace(wsId, { name: newName.trim() });
    refreshWorkspaces();
    setWorkspaceSaved((prev) => ({ ...prev, [wsId]: true }));
    setTimeout(() => setWorkspaceSaved((prev) => ({ ...prev, [wsId]: false })), 2000);
  }

  function handleDeleteWorkspace(wsId: string) {
    if (workspaces.length <= 1) return;
    deleteWorkspace(wsId);
    setDeleteConfirm(null);
    refreshWorkspaces();
  }

  function handleCreateWorkspace() {
    if (!newWsName.trim()) return;
    createWorkspace({ name: newWsName.trim() });
    setNewWsName('');
    setNewWsOpen(false);
    refreshWorkspaces();
  }

  function handleExport() {
    const store = getStore();
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'talion-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClearData() {
    const confirmed = window.confirm(
      'This will permanently delete all your pages, workspaces, and settings. This cannot be undone. Continue?',
    );
    if (!confirmed) return;
    localStorage.removeItem('talion_v1');
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Settings</h1>

        {/* Profile */}
        <section className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Profile</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Email</Label>
              <p className="text-sm text-gray-500">{userEmail || '—'}</p>
            </div>
            <div>
              <Label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
                Display name
              </Label>
              <div className="flex gap-2">
                <Input
                  id="display-name"
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Your name"
                  className="flex-1"
                />
                <Button onClick={handleSaveName} variant="default" size="sm">
                  {nameSaved ? 'Saved!' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Workspaces */}
        <section className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Workspaces</h2>
            <Button
              onClick={() => setNewWsOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              + New workspace
            </Button>
          </div>
          <div className="px-6 py-5 space-y-5">
            {workspaces.length === 0 && (
              <p className="text-sm text-gray-500">No workspaces found.</p>
            )}
            {workspaces.map((ws) => (
              <div key={ws.id}>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace name
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={workspaceNames[ws.id] ?? ws.name}
                    onChange={(e) =>
                      setWorkspaceNames((prev) => ({ ...prev, [ws.id]: e.target.value }))
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSaveWorkspace(ws.id)}
                    variant="default"
                    size="sm"
                  >
                    {workspaceSaved[ws.id] ? 'Saved!' : 'Save'}
                  </Button>
                  {workspaces.length > 1 && (
                    deleteConfirm === ws.id ? (
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleDeleteWorkspace(ws.id)}
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirm(null)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setDeleteConfirm(ws.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        Delete
                      </Button>
                    )
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">Slug: {ws.slug}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data */}
        <section className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Data</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Export all data</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Download a JSON backup of all your pages, workspaces, and settings.
                </p>
              </div>
              <Button onClick={handleExport} variant="outline" size="sm" className="ml-4 shrink-0">
                Export
              </Button>
            </div>
            <div className="border-t border-gray-100 pt-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Clear all data</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently delete all pages, workspaces, and history. This cannot be undone.
                </p>
              </div>
              <Button
                onClick={handleClearData}
                variant="outline"
                size="sm"
                className="ml-4 shrink-0 border-red-300 text-red-600 hover:bg-red-50"
              >
                Clear data
              </Button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">About</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600">
              Talion v1.0 &middot; Personal Knowledge &amp; Publishing &middot; March 2026
            </p>
          </div>
        </section>
      </div>

      {/* New Workspace Dialog */}
      <Dialog open={newWsOpen} onOpenChange={setNewWsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Enter a name for your new workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="new-ws-name" className="block text-sm font-medium text-gray-700 mb-1">
                Workspace name
              </Label>
              <Input
                id="new-ws-name"
                type="text"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="e.g. Personal, Work, Blog…"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace(); }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setNewWsOpen(false); setNewWsName(''); }}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleCreateWorkspace} disabled={!newWsName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
