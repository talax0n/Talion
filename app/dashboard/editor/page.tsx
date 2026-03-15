'use client';

import { Suspense } from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPage, savePage, createPage, type Page } from '@/lib/store';
import { parseMarkdown } from '@/lib/markdown';

type SaveState = 'saved' | 'saving' | 'unsaved';

const TAGS_PLACEHOLDER = 'Add tag…';

function EditorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get('id');

  const [page, setPage] = useState<Page | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [preview, setPreview] = useState('');
  const [activePane, setActivePane] = useState<'edit' | 'split' | 'preview'>('split');

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setVisibility(p.visibility);
    setStatus(p.status);
  }, [pageId, router]);

  // Live markdown preview
  useEffect(() => {
    setPreview(parseMarkdown(content));
  }, [content]);

  const save = useCallback(
    (overrides: Partial<Page> = {}) => {
      if (!page) return;
      setSaveState('saving');
      const updated: Page = {
        ...page,
        title: title || 'Untitled',
        content,
        tags,
        visibility,
        status,
        updatedAt: new Date().toISOString(),
        ...overrides,
      };
      savePage(updated);
      setPage(updated);
      setTimeout(() => setSaveState('saved'), 400);
    },
    [page, title, content, tags, visibility, status],
  );

  // Auto-save every 10s
  useEffect(() => {
    if (saveState === 'unsaved') {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => save(), 10000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [saveState, save]);

  // Cmd+S manual save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
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
        const next = [...tags, clean];
        setTags(next);
        markUnsaved();
      }
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setTags((t) => t.filter((x) => x !== tag));
    markUnsaved();
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
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-700 transition-colors mr-1"
          title="Back"
        >
          ←
        </button>

        {/* Pane toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(['edit', 'split', 'preview'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActivePane(mode)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                activePane === mode
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Save state */}
        <span className={`text-xs font-medium ${saveIndicator.cls}`}>
          {saveIndicator.text}
        </span>

        {/* Visibility */}
        <button
          onClick={() => {
            const next = visibility === 'private' ? 'public' : 'private';
            setVisibility(next);
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
          onClick={() => save()}
          className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors font-medium"
        >
          Save
        </button>
      </div>

      {/* Title + tags row */}
      <div className="px-8 pt-6 pb-0 shrink-0 border-b border-gray-100 bg-white">
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); markUnsaved(); }}
          placeholder="Page title"
          className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none mb-4 bg-transparent"
        />
        <div className="flex items-center gap-2 flex-wrap pb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium"
            >
              #{tag}
              <button onClick={() => removeTag(tag)} className="hover:text-indigo-900 ml-0.5">×</button>
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

      {/* Editor panes */}
      <div className="flex-1 overflow-hidden flex">
        {/* Markdown textarea */}
        {(activePane === 'edit' || activePane === 'split') && (
          <div className={`flex flex-col overflow-hidden ${activePane === 'split' ? 'w-1/2 border-r border-gray-100' : 'w-full'}`}>
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Markdown</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); markUnsaved(); }}
              placeholder="Start writing in Markdown…&#10;&#10;# My heading&#10;&#10;**Bold** and *italic* text.&#10;&#10;```js&#10;const hello = 'world';&#10;```"
              className="flex-1 w-full resize-none p-6 text-sm font-mono text-gray-700 placeholder-gray-300 outline-none bg-white leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {(activePane === 'preview' || activePane === 'split') && (
          <div className={`flex flex-col overflow-hidden ${activePane === 'split' ? 'w-1/2' : 'w-full'}`}>
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Preview</span>
            </div>
            <div
              className="flex-1 overflow-y-auto p-6 prose"
              dangerouslySetInnerHTML={{ __html: preview || '<p class="text-gray-300 text-sm italic">Nothing to preview yet…</p>' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading editor…</div>}>
      <EditorInner />
    </Suspense>
  );
}
