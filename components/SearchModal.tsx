'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchPages, type Page } from '@/lib/store';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Page[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchPages(query));
      setSelected(0);
    } else {
      setResults([]);
    }
  }, [query]);

  function navigate(page: Page) {
    router.push(`/dashboard/pages/${page.id}`);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { setSelected((s) => Math.min(s + 1, results.length - 1)); e.preventDefault(); }
    if (e.key === 'ArrowUp') { setSelected((s) => Math.max(s - 1, 0)); e.preventDefault(); }
    if (e.key === 'Enter' && results[selected]) { navigate(results[selected]); }
  }

  if (!open) return null;

  const statusColors: Record<string, string> = {
    published: 'text-green-600',
    draft: 'text-yellow-600',
    archived: 'text-gray-400',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tags, content…"
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          <kbd className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((page, i) => (
              <li key={page.id}>
                <button
                  onClick={() => navigate(page)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${i === selected ? 'bg-indigo-50' : ''}`}
                >
                  <span className="text-base shrink-0">
                    {page.visibility === 'public' ? '🌐' : '🔒'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{page.title}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      {page.content.slice(0, 80).replace(/[#*`]/g, '')}…
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {page.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                    <span className={`text-xs font-medium ${statusColors[page.status] ?? 'text-gray-400'}`}>
                      {page.status}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : query.trim() ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No pages found for &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div className="px-4 py-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-1">
              {[
                { icon: '✏️', label: 'New page', action: () => { router.push('/dashboard/editor'); onClose(); } },
                { icon: '📋', label: 'Dashboard', action: () => { router.push('/dashboard'); onClose(); } },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="border border-gray-200 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-gray-200 rounded px-1">↵</kbd> open</span>
          <span><kbd className="border border-gray-200 rounded px-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
