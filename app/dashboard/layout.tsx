'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getPages, createPage, type Page } from '@/lib/store';
import { SearchModal } from '@/components/SearchModal';

function PageTreeItem({ page, pages, depth = 0 }: { page: Page; pages: Page[]; depth?: number }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(depth < 2);
  const children = pages.filter((p) => p.parentId === page.id);
  const isActive = pathname === `/dashboard/pages/${page.id}`;

  return (
    <li>
      <Link
        href={`/dashboard/pages/${page.id}`}
        className={`flex items-center gap-1.5 text-sm py-1 px-2 rounded-md w-full transition-colors group ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${0.5 + depth * 1}rem` }}
      >
        {children.length > 0 && (
          <button
            onClick={(e) => { e.preventDefault(); setExpanded((x) => !x); }}
            className="shrink-0 w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-300"
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {children.length === 0 && <span className="w-4" />}
        <span className="text-xs shrink-0">{page.visibility === 'public' ? '🌐' : '📄'}</span>
        <span className="truncate">{page.title}</span>
      </Link>
      {expanded && children.length > 0 && (
        <ul className="mt-0.5">
          {children.map((child) => (
            <PageTreeItem key={child.id} page={child} pages={pages} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    setPages(getPages());
    const user = localStorage.getItem('talion_user');
    if (user) setUserName(JSON.parse(user).name ?? 'User');
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    },
    [],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleNewPage() {
    const page = createPage({ title: 'Untitled' });
    setPages(getPages());
    router.push(`/dashboard/editor?id=${page.id}`);
  }

  const rootPages = pages.filter((p) => p.parentId === null);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col h-full overflow-hidden"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Workspace header */}
        <div className="px-3 pt-4 pb-3 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <span className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-100 truncate">My Workspace</div>
              <div className="text-xs text-zinc-500 truncate">{userName}</div>
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-left text-xs">Search…</span>
            <kbd className="text-xs border border-white/10 rounded px-1">⌘K</kbd>
          </button>
        </div>

        {/* Nav links */}
        <div className="px-3 py-1">
          {[
            { href: '/dashboard', icon: '🏠', label: 'Home' },
            { href: '/dashboard/editor', icon: '✏️', label: 'New page' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 px-2 py-1.5 rounded-md transition-colors w-full"
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Pages tree */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <div className="flex items-center justify-between mb-1 mt-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-2">Pages</span>
            <button
              onClick={handleNewPage}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded p-1 transition-colors"
              title="New page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {rootPages.length > 0 ? (
            <ul className="space-y-0.5">
              {rootPages.map((page) => (
                <PageTreeItem key={page.id} page={page} pages={pages} />
              ))}
            </ul>
          ) : (
            <div className="text-xs text-zinc-600 px-2 py-3">No pages yet. Create one!</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <span>⚙️</span> Settings
          </Link>
          <button
            onClick={() => { localStorage.removeItem('talion_user'); router.push('/auth/login'); }}
            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors w-full"
          >
            <span>→</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
