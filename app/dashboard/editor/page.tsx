'use client';

import { Suspense } from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getPage, savePage, createPage, saveVersion, getVersions, restoreVersion,
  type Page, type PageVersion,
} from '@/lib/store';
import TipTapEditor from '@/components/editor/TipTapEditor';

type SaveState = 'saved' | 'saving' | 'unsaved';

const TAGS_PLACEHOLDER = 'Add tag…';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

function EditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get('id');

  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [slug, setSlug] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugManuallyEdited = useRef(false);

  const wordCount = countWords(content);

  // Load page
  useEffect(() => {
    let p: Page;
    if (pageId) {
      const found = getPage(pageId);
      p = found ?? createPage({ id: pageId });
    } else {
      p = createPage();
      router.replace(`/dashboard/editor?id=${p.id}`);
    }
    setPage(p);
    setTitle(p.title);
    setContent(p.content);
    setTags(p.tags);
    setSlug(p.slug);
    setVisibility(p.visibility);
    setStatus(p.status);
    setVersions(getVersions(p.id));
    slugManuallyEdited.current = false;
  }, [pageId, router]);

  const save = useCallback(
    (manual = false) => {
      if (!page) return;
      setSaveState('saving');
      const updated: Page = {
        ...page,
        title: title || 'Untitled',
        content,
        tags,
        visibility,
        status,
        slug: slug || slugify(title || 'untitled'),
        updatedAt: new Date().toISOString(),
      };
      savePage(updated);
      setPage(updated);
      if (manual) {
        saveVersion(page.id, updated.title, updated.content);
        setVersions(getVersions(page.id));
      }
      setTimeout(() => setSaveState('saved'), 400);
    },
    [page, title, content, tags, visibility, status, slug],
  );

  // Auto-save every 10s
  useEffect(() => {
    if (saveState === 'unsaved') {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => save(false), 10000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [saveState, save]);

  // Cmd+S → manual save + version checkpoint
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  function markUnsaved() {
    setSaveState('unsaved');
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags((t) => [...t, clean]);
        markUnsaved();
      }
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setTags((t) => t.filter((x) => x !== tag));
    markUnsaved();
  }

  function handleRestore(versionId: string) {
    if (!page || !confirm('Restore this version? Unsaved changes will be lost.')) return;
    const restored = restoreVersion(page.id, versionId);
    if (restored) {
      setTitle(restored.title);
      setContent(restored.content);
      setPage(restored);
      setSaveState('saved');
      setVersions(getVersions(page.id));
      setShowHistory(false);
    }
  }

  const saveIndicator = {
    saved: { text: '✓ Saved', cls: 'text-green-600' },
    saving: { text: '↻ Saving…', cls: 'text-yellow-600' },
    unsaved: { text: '● Unsaved', cls: 'text-gray-400' },
  }[saveState];

  if (!page) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-700 transition-colors mr-1"
          title="Back"
        >
          ←
        </button>

        <div className="flex-1" />

        {/* Word count */}
        <span className="text-xs text-gray-300 tabular-nums">
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </span>

        {/* Save state */}
        <span className={`text-xs font-medium ${saveIndicator.cls}`}>{saveIndicator.text}</span>

        {/* History button */}
        <button
          onClick={() => setShowHistory((v) => !v)}
          title="Version history"
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            showHistory
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          History{versions.length > 0 ? ` (${versions.length})` : ''}
        </button>

        {/* Visibility */}
        <button
          onClick={() => {
            setVisibility((v) => (v === 'private' ? 'public' : 'private'));
            markUnsaved();
          }}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
            visibility === 'public'
              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {visibility === 'public' ? '🌐 Public' : '🔒 Private'}
        </button>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            markUnsaved();
          }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        {/* Save button */}
        <button
          onClick={() => save(true)}
          className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors font-medium"
        >
          Save
        </button>
      </div>

      {/* Title + slug + tags */}
      <div className="px-8 pt-6 pb-0 shrink-0 border-b border-gray-100 bg-white">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugManuallyEdited.current) {
              setSlug(slugify(e.target.value));
            }
            markUnsaved();
          }}
          placeholder="Page title"
          className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none mb-3 bg-transparent"
        />

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400 shrink-0">URL slug:</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              slugManuallyEdited.current = true;
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
              markUnsaved();
            }}
            placeholder="page-slug"
            className="text-xs text-gray-500 outline-none bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono w-64 focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
          />
          {visibility === 'public' && slug && (
            <a
              href={`/p/my-workspace/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Preview ↗
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap pb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium"
            >
              #{tag}
              <button onClick={() => removeTag(tag)} className="hover:text-indigo-900 ml-0.5">
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder={tags.length === 0 ? TAGS_PLACEHOLDER : '#tag…'}
            className="text-xs text-gray-400 placeholder-gray-300 outline-none bg-transparent min-w-[80px]"
          />
        </div>
      </div>

      {/* Editor + history panel */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* TipTap editor */}
        <div className={`flex flex-col overflow-hidden flex-1 ${showHistory ? 'pr-72' : ''}`}>
          <TipTapEditor
            content={content}
            onChange={(html) => {
              setContent(html);
              markUnsaved();
            }}
            placeholder="Start writing… type / for commands"
            editable={true}
          />
        </div>

        {/* Version history panel */}
        {showHistory && (
          <div className="absolute right-0 top-0 bottom-0 w-72 border-l border-gray-200 bg-white flex flex-col overflow-hidden shadow-lg z-10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <h3 className="text-sm font-semibold text-gray-700">Version History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            {versions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div>
                  <p className="text-3xl mb-3">🕐</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    No checkpoints yet.
                    <br />
                    Press{' '}
                    <kbd className="border border-gray-200 rounded px-1 font-mono">⌘S</kbd> or{' '}
                    <kbd className="border border-gray-200 rounded px-1 font-mono">Save</kbd>{' '}
                    to create a version.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {versions.map((v) => (
                  <li key={v.id}>
                    <button
                      onClick={() => handleRestore(v.id)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700">
                        {v.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {timeAgo(v.savedAt)} · {v.authorName}
                      </div>
                      <div className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 mt-0.5 transition-opacity">
                        Click to restore →
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          Loading editor…
        </div>
      }
    >
      <EditorInner />
    </Suspense>
  );
}
