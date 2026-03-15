'use client';

import { useEffect, useState } from 'react';
import { getWorkspaces, getStore, saveStore, type Workspace } from '@/lib/store';

export default function SettingsPage() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceNames, setWorkspaceNames] = useState<Record<string, string>>({});
  const [workspaceSaved, setWorkspaceSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const raw = localStorage.getItem('talion_user');
    if (raw) {
      const user = JSON.parse(raw);
      setUserName(user.name ?? '');
      setUserEmail(user.email ?? '');
      setNameDraft(user.name ?? '');
    }
    const ws = getWorkspaces();
    setWorkspaces(ws);
    const names: Record<string, string> = {};
    ws.forEach((w) => { names[w.id] = w.name; });
    setWorkspaceNames(names);
  }, []);

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
    const store = getStore();
    const idx = store.workspaces.findIndex((w) => w.id === wsId);
    if (idx < 0) return;
    store.workspaces[idx] = { ...store.workspaces[idx], name: workspaceNames[wsId] };
    saveStore(store);
    setWorkspaces([...store.workspaces]);
    setWorkspaceSaved((prev) => ({ ...prev, [wsId]: true }));
    setTimeout(() => setWorkspaceSaved((prev) => ({ ...prev, [wsId]: false })), 2000);
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-sm text-gray-500">{userEmail || '—'}</p>
            </div>
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
                Display name
              </label>
              <div className="flex gap-2">
                <input
                  id="display-name"
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your name"
                />
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {nameSaved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Workspaces */}
        <section className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Workspaces</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {workspaces.length === 0 && (
              <p className="text-sm text-gray-500">No workspaces found.</p>
            )}
            {workspaces.map((ws) => (
              <div key={ws.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace name
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={workspaceNames[ws.id] ?? ws.name}
                    onChange={(e) =>
                      setWorkspaceNames((prev) => ({ ...prev, [ws.id]: e.target.value }))
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSaveWorkspace(ws.id)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {workspaceSaved[ws.id] ? 'Saved!' : 'Save'}
                  </button>
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
              <button
                onClick={handleExport}
                className="ml-4 shrink-0 px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Export
              </button>
            </div>
            <div className="border-t border-gray-100 pt-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Clear all data</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently delete all pages, workspaces, and history. This cannot be undone.
                </p>
              </div>
              <button
                onClick={handleClearData}
                className="ml-4 shrink-0 px-4 py-2 border border-red-300 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear data
              </button>
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
    </div>
  );
}
