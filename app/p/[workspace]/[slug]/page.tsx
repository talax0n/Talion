'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { getPageBySlug, getWorkspaces, type Page } from '@/lib/store';
import { parseMarkdown } from '@/lib/markdown';

interface Props {
  params: Promise<{ workspace: string; slug: string }>;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    published: 'bg-green-50 text-green-700 border border-green-200',
    draft: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    archived: 'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return styles[status] ?? styles.draft;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PublicPageViewer({ params }: Props) {
  const { workspace: workspaceSlug, slug } = use(params);

  const [page, setPage] = useState<Page | null | undefined>(undefined);
  const [workspaceName, setWorkspaceName] = useState(workspaceSlug);
  const [html, setHtml] = useState('');

  useEffect(() => {
    const p = getPageBySlug(workspaceSlug, slug);
    const ws = getWorkspaces().find((w) => w.slug === workspaceSlug);
    setWorkspaceName(ws?.name ?? workspaceSlug);
    if (p && p.visibility === 'public') {
      setPage(p);
      setHtml(parseMarkdown(p.content));
    } else {
      setPage(null);
    }
  }, [workspaceSlug, slug]);

  if (page === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  // 404 state
  if (!page) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex flex-col">
        <nav className="border-b border-gray-100 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/" className="font-bold text-xl tracking-tight text-gray-900 hover:text-indigo-600 transition-colors">
              Talion
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-8xl font-bold text-gray-100 select-none">404</p>
            <h1 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">Page not found</h1>
            <p className="text-gray-500 mb-8">This page doesn&apos;t exist or isn&apos;t publicly available.</p>
            <div className="flex items-center justify-center gap-4">
              <Link href={`/p/${workspaceSlug}`} className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors">
                Browse workspace
              </Link>
              <span className="text-gray-300">·</span>
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Go home
              </Link>
            </div>
          </div>
        </div>
        <footer className="border-t border-gray-100 py-6 px-6 text-center text-sm text-gray-400">
          <Link href="/" className="font-semibold text-gray-600 hover:text-gray-900 transition-colors">Talion</Link>
          {' '}· Personal Knowledge &amp; Publishing
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <nav className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-gray-900 hover:text-indigo-600 transition-colors">
            Talion
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8" aria-label="Breadcrumb">
          <Link href={`/p/${workspaceSlug}`} className="hover:text-indigo-600 transition-colors">
            {workspaceName}
          </Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-xs">{page.title}</span>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusBadge(page.status)}`}>
              {page.status}
            </span>
            {page.tags.map((tag) => (
              <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight mb-3">{page.title}</h1>
          <p className="text-sm text-gray-400">Updated {formatDate(page.updatedAt)}</p>
        </header>

        <hr className="border-gray-100 mb-8" />

        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href={`/p/${workspaceSlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <span aria-hidden="true">&#8592;</span>
            Back to {workspaceName}
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 px-6 mt-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <Link href="/" className="font-semibold text-gray-600 hover:text-gray-900 transition-colors">Talion</Link>
          <span>Personal Knowledge &amp; Publishing</span>
        </div>
      </footer>
    </div>
  );
}
