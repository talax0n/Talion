'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { getPages, getWorkspaces, type Page } from '@/lib/store';

interface Props {
  params: Promise<{ workspace: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/[-_*]{3,}/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function excerpt(content: string, maxLen = 120): string {
  const plain = stripMarkdown(content);
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).trimEnd() + '…';
}

export default function PublicWorkspaceIndex({ params }: Props) {
  const { workspace: workspaceSlug } = use(params);

  const [publicPages, setPublicPages] = useState<Page[]>([]);
  const [workspaceName, setWorkspaceName] = useState(workspaceSlug);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const allWorkspaces = getWorkspaces();
    const workspace = allWorkspaces.find((w) => w.slug === workspaceSlug);
    setWorkspaceName(workspace?.name ?? workspaceSlug);

    const pages = getPages()
      .filter(
        (p) =>
          p.visibility === 'public' &&
          p.status === 'published' &&
          allWorkspaces.find((w) => w.slug === workspaceSlug && w.id === p.workspaceId),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    setPublicPages(pages);
    setLoaded(true);
  }, [workspaceSlug]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <nav className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-gray-900 hover:text-indigo-600 transition-colors">
            Talion
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <header className="mb-10">
          <p className="text-sm text-indigo-600 font-medium mb-2 uppercase tracking-wide">Public workspace</p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">{workspaceName}</h1>
          {publicPages.length > 0 && (
            <p className="text-gray-500 text-sm">
              {publicPages.length} {publicPages.length === 1 ? 'page' : 'pages'} published
            </p>
          )}
        </header>

        {publicPages.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-5xl mb-4 select-none">&#128196;</p>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No public pages yet</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              This workspace hasn&apos;t published any public pages. Check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {publicPages.map((page) => (
              <Link
                key={page.id}
                href={`/p/${workspaceSlug}/${page.slug}`}
                className="group block p-6 border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate mb-1">
                      {page.title}
                    </h2>
                    {page.content && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">{excerpt(page.content)}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-gray-400">{formatDate(page.updatedAt)}</span>
                      {page.tags.length > 0 && (
                        <>
                          <span className="text-gray-200">·</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {page.tags.map((tag) => (
                              <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-indigo-400 transition-colors text-lg mt-0.5 flex-shrink-0" aria-hidden="true">
                    &#8594;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-8 px-6 mt-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <Link href="/" className="font-semibold text-gray-600 hover:text-gray-900 transition-colors">Talion</Link>
          <span>Personal Knowledge &amp; Publishing</span>
        </div>
      </footer>
    </div>
  );
}
