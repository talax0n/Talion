'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  getPages,
  createPage,
  getWorkspaces,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  getTagCounts,
  updatePageParent,
  type Page,
  type Workspace,
} from '@/lib/store';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { SearchModal } from '@/components/SearchModal';
import { signOut, useSession } from '@/lib/auth-client';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Sortable page tree item ────────────────────────────────────────────────

function SortablePageItem({
  page,
  pages,
  depth = 0,
  activeDragId,
}: {
  page: Page;
  pages: Page[];
  depth?: number;
  activeDragId: string | null;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(depth < 2);
  const children = pages.filter((p) => p.parentId === page.id);
  const isActive = pathname === `/dashboard/pages/${page.id}`;
  const isDragging = activeDragId === page.id;

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={cn(
          'flex items-center gap-1 text-sm py-1 px-2 rounded-md w-full transition-colors group',
          isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
        )}
        style={{ paddingLeft: `${0.5 + depth * 1}rem` }}
      >
        <span
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs leading-none select-none"
          title="Drag to reorder"
        >
          ⠿
        </span>
        {children.length > 0 ? (
          <button
            onClick={() => setExpanded((x) => !x)}
            className="shrink-0 w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-300"
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <Link
          href={`/dashboard/pages/${page.id}`}
          className="flex items-center gap-1 flex-1 min-w-0"
        >
          <span className="text-xs shrink-0">{page.visibility === 'public' ? '🌐' : '📄'}</span>
          <span className="truncate">{page.title}</span>
        </Link>
      </div>
      {expanded && children.length > 0 && (
        <ul className="mt-0.5">
          {children.map((child) => (
            <SortablePageItem
              key={child.id}
              page={child}
              pages={pages}
              depth={depth + 1}
              activeDragId={activeDragId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ─── Dashboard layout ────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [pages, setPages] = useState<Page[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWsId, setActiveWsId] = useState<string>('ws-1');
  const [searchOpen, setSearchOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<'AND' | 'OR'>('OR');
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWsId(wsId);
    setWorkspaces(getWorkspaces());
    refreshPages(wsId);
    setTagCounts(getTagCounts());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session?.user?.name) setUserName(session.user.name);
    else if (session?.user?.email) setUserName(session.user.email.split('@')[0]);
  }, [session]);

  function refreshPages(wsId?: string) {
    const id = wsId ?? activeWsId;
    const allPages = getPages();
    setPages(allPages.filter((p) => p.workspaceId === id));
    setTagCounts(getTagCounts());
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleNewPage() {
    const page = createPage({ title: 'Untitled', workspaceId: activeWsId });
    refreshPages();
    router.push(`/dashboard/editor?id=${page.id}`);
  }

  function handleSwitchWorkspace(wsId: string) {
    setActiveWsId(wsId);
    setActiveWorkspaceId(wsId);
    setSelectedTags([]);
    refreshPages(wsId);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;
    const draggedId = String(active.id);
    const overId = String(over.id);
    updatePageParent(draggedId, overId === '__root__' ? null : overId);
    refreshPages();
  }

  const filteredPages = selectedTags.length === 0
    ? pages
    : pages.filter((p) =>
        tagMode === 'AND'
          ? selectedTags.every((t) => p.tags.includes(t))
          : selectedTags.some((t) => p.tags.includes(t)),
      );

  const rootPages = filteredPages.filter((p) => p.parentId === null);
  const activeWorkspace = workspaces.find((w) => w.id === activeWsId);
  const workspaceTags = Array.from(new Set(pages.flatMap((p) => p.tags)));
  const activeDragPage = activeDragId ? pages.find((p) => p.id === activeDragId) : null;

  return (
    <WorkspaceProvider>
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col h-full overflow-hidden"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Workspace switcher */}
        <div className="px-3 pt-4 pb-3 border-b border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left">
                <span className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(activeWorkspace?.name ?? 'W').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-100 truncate">
                    {activeWorkspace?.name ?? 'Workspace'}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{userName}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => handleSwitchWorkspace(ws.id)}
                  className={cn(ws.id === activeWsId && 'font-medium')}
                >
                  {ws.name}
                  {ws.id === activeWsId && (
                    <span className="ml-auto text-indigo-600">&#10003;</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add workspace
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <kbd className="text-xs border border-white/10 rounded px-1">&#8984;K</kbd>
          </button>
        </div>

        {/* Tags filter */}
        {workspaceTags.length > 0 && (
          <div className="px-3 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-600">Filter by tag</span>
              {selectedTags.length > 1 && (
                <button
                  onClick={() => setTagMode((m) => (m === 'OR' ? 'AND' : 'OR'))}
                  className="text-xs text-zinc-500 hover:text-zinc-300 bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
                >
                  {tagMode}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {workspaceTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded border transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-white/10 text-zinc-500 hover:text-zinc-300 hover:border-white/20',
                  )}
                >
                  {tag}
                  {tagCounts[tag] ? (
                    <span className="ml-1 opacity-60">{tagCounts[tag]}</span>
                  ) : null}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs px-1.5 py-0.5 rounded border border-white/10 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        )}

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

        {/* Pages tree with DnD */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <div className="flex items-center justify-between mb-1 mt-3">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-2">
              Pages
              {selectedTags.length > 0 && (
                <span className="ml-1 text-indigo-400 normal-case font-normal">(filtered)</span>
              )}
            </span>
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
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredPages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-0.5">
                  {rootPages.map((page) => (
                    <SortablePageItem
                      key={page.id}
                      page={page}
                      pages={filteredPages}
                      activeDragId={activeDragId}
                    />
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay>
                {activeDragPage && (
                  <div className="text-sm py-1 px-2 rounded-md bg-white/10 text-white shadow-lg">
                    {activeDragPage.title}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="text-xs text-zinc-600 px-2 py-3">
              {selectedTags.length > 0
                ? 'No pages match the selected tags.'
                : 'No pages yet. Create one!'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <span>&#9881;&#65039;</span> Settings
          </Link>
          <button
            onClick={async () => {
              await signOut();
              router.push('/auth/login');
              router.refresh();
            }}
            className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors w-full"
          >
            <span>&#8594;</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
    </WorkspaceProvider>
  );
}
