import Link from 'next/link';

const features = [
  {
    icon: '✍️',
    title: 'Markdown Editor',
    desc: 'Split-pane editor with live preview. GFM, KaTeX, code blocks with syntax highlighting. Auto-saves every 10s.',
  },
  {
    icon: '🗂️',
    title: 'Organized Structure',
    desc: 'Nest pages up to 5 levels deep. Multiple workspaces. Tags with multi-filter. Backlinks and graph view.',
  },
  {
    icon: '🔐',
    title: 'Granular Access Control',
    desc: 'Per-page visibility: Private, Group, Specific Users, or Public. Password-protected share links with expiry.',
  },
  {
    icon: '🚀',
    title: 'Publishing',
    desc: 'Custom URL slugs. SEO metadata. OG image upload. RSS feed auto-generated. Three layout modes: Docs, Blog, Wiki.',
  },
  {
    icon: '🔍',
    title: 'Fast Search',
    desc: 'Full-text search across titles, content, and tags in < 200ms. Keyboard-first: Cmd+K from anywhere.',
  },
  {
    icon: '🤖',
    title: 'AI Features',
    desc: 'Summarize, Improve, Q&A across your knowledge base (RAG), Auto-tag, and Draft from Outline via Claude API.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-bold text-xl tracking-tight">Talion</span>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block" />
          Now in beta
        </div>
        <h1 className="text-6xl font-bold tracking-tight leading-tight mb-6 text-gray-900">
          Write. Organize.
          <br />
          <span className="text-indigo-600">Publish.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Talion is a self-hosted knowledge and publishing platform built around Markdown. Combines the depth of Notion,
          the publishing quality of GitBook, and access control you actually own.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/auth/register"
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-indigo-500 transition-colors text-base"
          >
            Start writing for free
          </Link>
          <Link
            href="/dashboard"
            className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-base"
          >
            View demo →
          </Link>
        </div>
      </section>

      {/* Editor preview */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-100">
          {/* Window chrome */}
          <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-4 text-xs text-gray-500 font-mono">Getting Started — Talion</span>
          </div>
          <div className="flex bg-white" style={{ height: '320px' }}>
            {/* Sidebar mockup */}
            <div
              className="w-56 border-r border-gray-100 p-4 flex flex-col gap-1"
              style={{ background: '#fafafa' }}
            >
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Workspace</div>
              {['Getting Started', 'Project Notes', 'API Reference', 'Blog Post'].map((title, i) => (
                <div
                  key={title}
                  className={`text-sm px-2 py-1.5 rounded-md cursor-default truncate ${i === 0 ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  style={{ paddingLeft: i === 2 ? '1.5rem' : undefined }}
                >
                  {i === 2 ? '↳ ' : ''}
                  {title}
                </div>
              ))}
            </div>
            {/* Editor + preview */}
            <div className="flex-1 grid grid-cols-2 divide-x divide-gray-100">
              <div className="p-4 font-mono text-sm text-gray-600 overflow-hidden">
                <div className="text-gray-400 text-xs mb-3">MARKDOWN</div>
                <div className="text-purple-600"># Getting Started</div>
                <div className="mt-2">Welcome to <span className="text-yellow-600">**Talion**</span> — your</div>
                <div>personal knowledge platform.</div>
                <div className="mt-2 text-teal-600">## Quick Tips</div>
                <div className="mt-1">Press <span className="bg-gray-100 px-1 rounded text-xs">`Cmd+K`</span> to search.</div>
                <div className="mt-2 text-blue-600">```typescript</div>
                <div className="text-gray-500">const note = create();</div>
                <div className="text-blue-600">```</div>
              </div>
              <div className="p-4 overflow-hidden">
                <div className="text-gray-400 text-xs mb-3">PREVIEW</div>
                <h1 className="text-lg font-bold text-gray-900 mb-2">Getting Started</h1>
                <p className="text-sm text-gray-600 mb-3">
                  Welcome to <strong>Talion</strong> — your personal knowledge platform.
                </p>
                <h2 className="text-base font-semibold text-gray-800 mb-1">Quick Tips</h2>
                <p className="text-sm text-gray-600">
                  Press <code className="bg-gray-100 px-1 rounded text-xs">Cmd+K</code> to search.
                </p>
                <pre className="mt-2 bg-gray-900 text-green-400 p-2 rounded text-xs font-mono">
                  const note = create();
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">Everything in one place</h2>
        <p className="text-gray-500 text-center mb-12">
          No more switching between Notion, GitBook, Ghost, and Obsidian.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Your knowledge, your way.</h2>
        <p className="text-gray-400 mb-8 text-lg max-w-xl mx-auto">
          Self-hosted. Markdown-native. Open source. Start building your second brain today.
        </p>
        <Link
          href="/auth/register"
          className="bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-indigo-400 transition-colors inline-block"
        >
          Start for free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        <span className="font-semibold text-gray-700">Talion</span> · Personal Knowledge & Publishing ·{' '}
        <span>v1.0 · March 2026</span>
      </footer>
    </div>
  );
}
