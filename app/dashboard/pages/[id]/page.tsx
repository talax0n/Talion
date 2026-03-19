'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageBreadcrumb } from '@/components/pages/PageBreadcrumb';
import type { PageRecord } from '@/lib/pages';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

const statusColors: Record<string, string> = {
  published: 'bg-green-50 text-green-700',
  draft: 'bg-yellow-50 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function PageView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<PageRecord | null>(null);
  const [allPages, setAllPages] = useState<PageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      try {
        const res = await fetch(`/api/pages/${id}`);
        if (!res.ok) {
          router.replace('/dashboard');
          return;
        }
        const { page: data } = await res.json() as { page: PageRecord };
        setPage(data);

        // Load sibling/ancestor pages for breadcrumb — best-effort
        if (data.workspace_id) {
          const listRes = await fetch(`/api/pages?workspace_id=${data.workspace_id}`);
          if (listRes.ok) {
            const { pages } = await listRes.json() as { pages: PageRecord[] };
            setAllPages(pages);
          }
        }
      } catch {
        router.replace('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, [id, router]);

  async function handleDelete() {
    if (!confirm('Archive this page?')) return;
    await fetch(`/api/pages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    router.push('/dashboard');
  }

  if (loading || !page) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Breadcrumb / actions bar */}
      <div className="flex items-center justify-between mb-8">
        <PageBreadcrumb page={page} pages={allPages} />
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/editor?id=${page.id}`}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
          {page.visibility === 'public' && (
            <Link
              href={`/p/my-workspace/${page.slug}`}
              target="_blank"
              className="text-sm px-3 py-1.5 border border-green-200 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
            >
              View public
            </Link>
          )}
          <button
            onClick={handleDelete}
            className="text-sm px-3 py-1.5 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Page metadata */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[page.status] ?? 'bg-gray-100 text-gray-500'}`}
        >
          {page.status}
        </span>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            page.visibility === 'public'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {page.visibility === 'public' ? 'Public' : 'Private'}
        </span>
        {page.tags.map((tag) => (
          <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
            #{tag}
          </span>
        ))}
        <span className="text-xs text-gray-400">Updated {timeAgo(page.updated_at)}</span>
      </div>

      {/* Content */}
      <article
        className="prose"
        dangerouslySetInnerHTML={{
          __html:
            page.content_html ||
            '<p class="text-gray-400 italic">This page is empty. Click Edit to start writing.</p>',
        }}
      />

      {/* Bottom actions */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          Back
        </button>
        <Link
          href={`/dashboard/editor?id=${page.id}`}
          className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
        >
          Edit page
        </Link>
      </div>
    </div>
  );
}
