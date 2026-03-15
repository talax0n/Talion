'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPages, createPage, type Page } from '@/lib/store';

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const statusBadge: Record<string, string> = {
  published: 'bg-green-50 text-green-700',
  draft: 'bg-yellow-50 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function DashboardPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [userName, setUserName] = useState('there');

  useEffect(() => {
    setPages(getPages().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    const user = localStorage.getItem('talion_user');
    if (user) setUserName(JSON.parse(user).name ?? 'there');
  }, []);

  function handleNewPage() {
    const page = createPage({ title: 'Untitled' });
    router.push(`/dashboard/editor?id=${page.id}`);
  }

  const publicPages = pages.filter((p) => p.visibility === 'public');
  const recentPages = pages.slice(0, 8);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {userName} 👋
        </h1>
        <p className="text-gray-500">Here&rsquo;s what&rsquo;s happening in your workspace.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total pages', value: pages.length, icon: '📄' },
          { label: 'Published', value: publicPages.length, icon: '🌐' },
          { label: 'Drafts', value: pages.filter((p) => p.status === 'draft').length, icon: '✏️' },
        ].map((stat) => (
          <div key={stat.label} className="border border-gray-100 rounded-xl p-4">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* New page CTA */}
      <button
        onClick={handleNewPage}
        className="w-full mb-8 flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl p-4 text-left transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">New page</div>
          <div className="text-xs text-gray-400">Write a note, doc, or blog post</div>
        </div>
      </button>

      {/* Recent pages */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent pages</h2>
        {recentPages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm">No pages yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPages.map((page) => (
              <Link
                key={page.id}
                href={`/dashboard/pages/${page.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all group"
              >
                <span className="text-xl shrink-0">
                  {page.visibility === 'public' ? '🌐' : '📄'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                    {page.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {page.content.slice(0, 100).replace(/[#*`>\n]/g, ' ').trim()}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {page.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      #{t}
                    </span>
                  ))}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[page.status] ?? 'bg-gray-100 text-gray-400'}`}>
                    {page.status}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">{timeAgo(page.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
