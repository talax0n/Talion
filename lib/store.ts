export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  parentId: string | null;
  workspaceId: string;
  visibility: 'private' | 'public';
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export interface PageVersion {
  id: string;
  pageId: string;
  title: string;
  content: string;
  savedAt: string;
  authorName: string;
}

export interface TalionData {
  workspaces: Workspace[];
  pages: Page[];
  versions: PageVersion[];
}

const STORAGE_KEY = 'talion_v1';

const DEFAULT_PAGES: Page[] = [
  {
    id: 'page-1',
    title: 'Getting Started',
    slug: 'getting-started',
    content:
      '# Getting Started\n\nWelcome to **Talion** — your personal knowledge and publishing platform.\n\n## What you can do\n\n- Write notes in Markdown with live preview\n- Organize pages into nested folders\n- Control access per page (private or public)\n- Publish with custom slugs and SEO metadata\n\n## Quick Tips\n\nPress `Cmd+K` to search across all your pages.\n\nUse `---` to insert a horizontal rule:\n\n---\n\nCode blocks with syntax highlighting:\n\n```typescript\nconst greeting = (name: string) => `Hello, ${name}!`;\nconsole.log(greeting("world"));\n```\n\n> Blockquotes are great for highlighting important information.',
    parentId: null,
    workspaceId: 'ws-1',
    visibility: 'public',
    tags: ['guide', 'intro'],
    status: 'published',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'page-2',
    title: 'Project Notes',
    slug: 'project-notes',
    content:
      '# Project Notes\n\nA collection of notes for the current project.\n\n## Architecture\n\n- Frontend: Next.js 16 + TypeScript\n- Styling: Tailwind CSS v4\n- Storage: PostgreSQL (planned)\n\n## Tasks\n\n- [x] Set up project\n- [ ] Implement authentication\n- [ ] Build editor\n- [ ] Add search\n\n## Deadlines\n\nMVP ships in **4 weeks**.',
    parentId: null,
    workspaceId: 'ws-1',
    visibility: 'private',
    tags: ['project', 'work'],
    status: 'draft',
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
  },
  {
    id: 'page-3',
    title: 'API Reference',
    slug: 'api-reference',
    content:
      '# API Reference\n\nBase URL: `/api/v1`\n\nAll endpoints require a Bearer token except public pages.\n\n## Endpoints\n\n### Pages\n\n```\nGET    /pages          List all pages\nPOST   /pages          Create a page\nGET    /pages/:id      Get a page\nPUT    /pages/:id      Update a page\nDELETE /pages/:id      Delete a page\n```\n\n### Search\n\n```\nGET /search?q=query&workspace=ws-1&tags=tag1,tag2\n```',
    parentId: 'page-2',
    workspaceId: 'ws-1',
    visibility: 'private',
    tags: ['api', 'docs'],
    status: 'published',
    createdAt: '2026-03-07T00:00:00Z',
    updatedAt: '2026-03-11T00:00:00Z',
  },
  {
    id: 'page-4',
    title: 'Blog Post: Why I built Talion',
    slug: 'why-i-built-talion',
    content:
      '# Why I Built Talion\n\n*March 2026*\n\nI was tired of switching between Notion, Obsidian, and Ghost. I wanted one tool that:\n\n1. Stored everything as Markdown (so I own my data)\n2. Let me publish selectively with fine-grained access control\n3. Had a fast, distraction-free editor\n\nSo I built Talion.\n\n## The Key Insight\n\nMost writing tools optimize for either **private notes** or **public publishing**, but not both. Talion treats them as the same thing — the only difference is a visibility toggle.\n\n## What\'s Next\n\nI\'m working on AI Q&A so you can ask natural language questions across your entire knowledge base. Stay tuned.',
    parentId: null,
    workspaceId: 'ws-1',
    visibility: 'public',
    tags: ['blog', 'personal'],
    status: 'published',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-14T00:00:00Z',
  },
];

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'ws-1', name: 'My Workspace', slug: 'my-workspace' },
];

export function getStore(): TalionData {
  if (typeof window === 'undefined') {
    return { workspaces: DEFAULT_WORKSPACES, pages: DEFAULT_PAGES, versions: [] };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: TalionData = { workspaces: DEFAULT_WORKSPACES, pages: DEFAULT_PAGES, versions: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  const data = JSON.parse(raw) as TalionData;
  if (!data.versions) {
    data.versions = [];
  }
  return data;
}

export function saveStore(data: TalionData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPages(): Page[] {
  return getStore().pages;
}

export function getPage(id: string): Page | undefined {
  return getStore().pages.find((p) => p.id === id);
}

export function getPageBySlug(workspaceSlug: string, slug: string): Page | undefined {
  const store = getStore();
  const ws = store.workspaces.find((w) => w.slug === workspaceSlug);
  if (!ws) return undefined;
  return store.pages.find((p) => p.workspaceId === ws.id && p.slug === slug);
}

export function savePage(page: Page): void {
  const store = getStore();
  const idx = store.pages.findIndex((p) => p.id === page.id);
  if (idx >= 0) {
    store.pages[idx] = page;
  } else {
    store.pages.push(page);
  }
  saveStore(store);
}

export function deletePage(id: string): void {
  const store = getStore();
  store.pages = store.pages.filter((p) => p.id !== id);
  saveStore(store);
}

export function createPage(partial: Partial<Page> = {}): Page {
  const now = new Date().toISOString();
  const page: Page = {
    id: `page-${Date.now()}`,
    title: 'Untitled',
    slug: `untitled-${Date.now()}`,
    content: '',
    parentId: null,
    workspaceId: 'ws-1',
    visibility: 'private',
    tags: [],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
  savePage(page);
  return page;
}

export function searchPages(query: string): Page[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return getPages().filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function getWorkspaces(): Workspace[] {
  return getStore().workspaces;
}

export function saveVersion(pageId: string, title: string, content: string): void {
  const store = getStore();
  const raw = typeof window !== 'undefined' ? localStorage.getItem('talion_user') : null;
  const authorName: string = raw ? (JSON.parse(raw).name ?? 'Unknown') : 'Unknown';
  const version: PageVersion = {
    id: `v-${Date.now()}`,
    pageId,
    title,
    content,
    savedAt: new Date().toISOString(),
    authorName,
  };
  store.versions.push(version);
  // Keep only the last 50 versions per page
  const pageVersions = store.versions.filter((v) => v.pageId === pageId);
  if (pageVersions.length > 50) {
    const oldest = pageVersions.slice(0, pageVersions.length - 50);
    const oldestIds = new Set(oldest.map((v) => v.id));
    store.versions = store.versions.filter((v) => !oldestIds.has(v.id));
  }
  saveStore(store);
}

export function getVersions(pageId: string): PageVersion[] {
  const store = getStore();
  return store.versions
    .filter((v) => v.pageId === pageId)
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function restoreVersion(pageId: string, versionId: string): Page | undefined {
  const store = getStore();
  const version = store.versions.find((v) => v.id === versionId && v.pageId === pageId);
  if (!version) return undefined;
  const idx = store.pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return undefined;
  store.pages[idx] = {
    ...store.pages[idx],
    title: version.title,
    content: version.content,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return store.pages[idx];
}
