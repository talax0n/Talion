# TALION
## Product Requirements Document
**Personal Knowledge & Publishing Platform**

> Version 1.0 · March 2026 · Status: **DRAFT**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas & Stories](#2-user-personas--stories)
3. [Feature Specifications](#3-feature-specifications)
4. [Technical Specifications](#4-technical-specifications)
5. [Non-Goals](#5-non-goals)
6. [Risks & Mitigations](#6-risks--mitigations)
7. [Phased Roadmap](#7-phased-roadmap)
8. [Open Questions](#8-open-questions)

---

## 1. Executive Summary

### 1.1 Problem Statement

Modern knowledge workers and developers are forced to split their notes, documentation, and writing across multiple tools — Notion for wikis, GitBook for docs, Ghost for blogs, and local markdown files for personal notes. None of these tools offer full ownership, granular access control, and a developer-first experience in a single product.

### 1.2 Proposed Solution

Talion is a self-hosted, full-featured knowledge and publishing platform built around Markdown. It combines the organizational depth of Notion, the publishing quality of GitBook, and the access-control precision of a modern CMS — all in one tool you own and control. Write once, share with exactly who you choose.

### 1.3 Success Criteria (KPIs)

| Metric | Target | Description |
|---|---|---|
| Editor Performance | < 100ms | Keystroke-to-render latency in Markdown editor |
| Search Response | < 200ms | Full-text search over 10,000 notes |
| Page Load (public) | < 1.5s | Time to first contentful paint on published pages |
| Uptime | 99.9% | Monthly availability SLA for self-hosted instance |
| Access Control | 100% isolated | Zero cross-user data leakage in permission checks |

---

## 2. User Personas & Stories

### 2.1 User Personas

| Persona | Goals | Pain Points |
|---|---|---|
| **The Builder** (Primary) | Dev notes, project docs, API references, team wikis | Scattered tools, no single source of truth, no custom domains |
| **The Writer** | Public blog, long-form essays, newsletters as pages | Markdown blogs require too much setup; Substack has no Markdown control |
| **The Knowledge Hoarder** | Personal second brain, linked notes, graph of ideas | Obsidian is local-only; Notion is too heavy; Roam is expensive |
| **The Team Lead** | Shared team workspace with role-based editing access | Google Docs has no structure; Notion is opaque on permissions |

### 2.2 User Stories & Acceptance Criteria

#### Content Creation

- **As a Builder**, I want to write notes in Markdown with live preview so I can format content quickly without leaving the keyboard.
  - Acceptance: Split-pane editor loads in < 200ms; supports GFM + frontmatter + KaTeX; auto-saves every 10 seconds.

- **As a Builder**, I want syntax-highlighted code blocks with a language selector so my dev notes are readable.
  - Acceptance: Supports 50+ languages; copy-to-clipboard button on hover; optional line numbers.

#### Organization

- **As a Knowledge Hoarder**, I want to nest pages in folders up to 5 levels deep so I can mirror my mental model.
  - Acceptance: Drag-and-drop reordering in sidebar; breadcrumb trail on every page; collapse/expand all.

- **As any user**, I want to tag pages and filter by multiple tags so I can find notes across different workspaces.
  - Acceptance: Multi-tag filter uses AND logic by default, toggleable to OR; tag autocomplete on typing `#`.

#### Access Control

- **As a Builder**, I want to set visibility per page (Private / Group / Specific Users / Public) so I can share selectively.
  - Acceptance: Visibility change propagates within 5 seconds; child pages inherit parent by default with override option.

- **As a Team Lead**, I want to create named groups and assign roles (Viewer / Commenter / Editor / Admin) per workspace or page.
  - Acceptance: Groups support up to 100 members; roles are enforced at API level, not just UI.

- **As any user**, I want to generate password-protected or expiring share links for pages without requiring the recipient to log in.
  - Acceptance: Link expiry options: 1 day / 7 days / 30 days / Never; password min 8 chars; link revocable.

#### Publishing

- **As a Writer**, I want to publish pages at a custom slug and add SEO metadata so my content is discoverable.
  - Acceptance: Slug validation on save; OG image upload; meta description field; sitemap auto-updated within 60 seconds of publish.

- **As a Writer**, I want an RSS feed auto-generated for my public workspace so readers can subscribe.
  - Acceptance: RSS 2.0 compliant; updates on every publish; includes full content or summary (configurable).

---

## 3. Feature Specifications

### 3.1 Editor & Content

- Rich Markdown editor: GFM, frontmatter, KaTeX math, Mermaid diagrams
- WYSIWYG toggle alongside raw Markdown mode (slash commands for blocks)
- Callout blocks, toggles/accordions, tables, horizontal rules
- Drag-and-drop image and file uploads with inline embedding (max 50MB per file)
- Version history: retain last 50 versions per page; diff view between any two versions
- Auto-save: every 10 seconds while editing; manual save via `Cmd/Ctrl+S`
- Frontmatter fields: title, tags, status, date, author, custom key-value pairs

### 3.2 Organization

- Nested pages/folders (tree structure, max 5 levels deep)
- Multiple Workspaces — isolated environments (e.g., Personal, Work, Public)
- Tags with autocomplete, multi-tag filtering with AND/OR toggle
- Favorites / Pinned pages (per user)
- `[[wikilink]]` internal linking with auto-suggest
- Backlinks panel — shows all pages linking to current page
- Graph view — interactive force-directed graph of all page connections
- Page status field: Draft / In Review / Published / Archived

### 3.3 Access Control

- Visibility levels per page: `Private` → `Named Group` → `Specific Users` → `Public`
- Group management: create groups, add members, assign roles (Viewer / Commenter / Editor / Admin)
- Domain-restricted access: only emails matching `@domain.com` can access
- Password-protected share links (no login required for recipient)
- Expiring share links: 1d / 7d / 30d / Never, revocable at any time
- Child pages inherit parent visibility; override available per page
- Access audit log per page: who viewed, edited, commented, and when

### 3.4 Publishing & Sharing

- Custom URL slugs: `yoursite.com/notes/my-post`
- Custom domain support: `docs.yourdomain.com` via CNAME
- Per-page SEO: meta title, description, OG image upload
- RSS 2.0 feed auto-generated per public workspace
- Embeddable pages via iframe snippet (respects visibility rules)
- Sitemap auto-generated and updated on every publish/unpublish
- Three public layout modes: **Docs** (sidebar), **Blog** (feed), **Wiki** (table of contents)
- Custom CSS injection on public pages for branding control

### 3.5 Search

- Full-text search: title + body + tags, response < 200ms on 10,000 docs
- Filters: workspace, tag, author, date range, visibility, status
- Search result previews with highlighted keyword context
- Keyboard-first: `Cmd/Ctrl+K` global search shortcut

### 3.6 Collaboration

- Inline paragraph-level commenting (like Google Docs)
- `@mention` users in comments; email notification sent
- Suggestion/review mode: propose edits without directly modifying content
- Activity feed per page: edits, comments, access changes, publish events
- Real-time collaborative editing *(v2 scope — requires CRDT implementation)*

### 3.7 AI Features

- **AI Summarize**: generate TL;DR for any page (< 3 sentences)
- **AI Improve**: rewrite selected text (improve clarity, fix grammar, change tone)
- **AI Q&A**: ask natural language questions across your entire knowledge base (RAG)
- **AI Auto-tag**: suggest tags based on page content
- **AI Draft from Outline**: expand a bullet-point outline into a full draft

### 3.8 Import / Export

- Import: Notion export ZIP, Obsidian vault (`.md` files), Confluence HTML export
- Export per page or workspace: Markdown, PDF, HTML, EPUB
- GitHub Sync: two-way sync a workspace with a GitHub repo (markdown files)
- CLI tool: push/pull notes from terminal via API token

### 3.9 Theming & Customization

- Light / Dark / System mode
- Custom accent color per workspace (hex input)
- Cover image and emoji icon per page
- Font choice for public read view: Serif, Sans-serif, Monospace
- Custom CSS injection per public workspace

### 3.10 Analytics

- Page view counts (private to owner; optionally public)
- Average read time and scroll depth per public page
- Traffic source breakdown (referrer, direct, search)
- Privacy-first: no third-party tracking scripts; all data self-hosted

### 3.11 Developer & Power User

- REST API: full CRUD on pages, workspaces, access groups, publish state
- Webhooks: fire on page publish, comment, access change
- Browser extension: clip web content into Talion as a new page or append to existing
- Mobile PWA: offline read, create/edit notes, syncs on reconnect

---

## 4. Technical Specifications

### 4.1 Architecture Overview

Talion follows a monorepo structure with a clear separation between the core API, the editor client, and the public-facing renderer.

| Layer | Technology (Recommended) | Responsibility |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Editor UI, sidebar, settings, auth flows |
| Editor Core | CodeMirror 6 or TipTap | Markdown editing, slash commands, WYSIWYG |
| API | Node.js + Hono (or Fastify) | REST endpoints, auth middleware, business logic |
| Database | PostgreSQL | Users, pages, workspaces, access rules, versions |
| Search | PostgreSQL FTS or Meilisearch | Full-text search index, tag filtering |
| File Storage | S3-compatible (MinIO self-hosted) | Images, attachments, export files |
| Auth | NextAuth.js or Lucia Auth | Session management, OAuth, magic links |
| Public Renderer | Next.js SSG/ISR | Public pages, SEO, custom domains |
| AI | Anthropic Claude API (`claude-sonnet-4`) | Summarize, improve, Q&A, auto-tag |
| Background Jobs | BullMQ + Redis | Search re-index, email notifications, webhooks |

### 4.2 Data Models

#### Core Entities

```
User
  id, email, name, avatar, role (owner|member), created_at

Workspace
  id, owner_id, name, slug, visibility_default, theme, custom_domain

Page
  id, workspace_id, parent_id, title, slug
  content_md, content_html, status, visibility
  frontmatter (JSONB), version, created_at, updated_at

PageVersion
  id, page_id, content_md, diff, author_id, created_at

AccessGroup
  id, workspace_id, name
  members: [{ user_id, role }]

PageAccess
  id, page_id, subject_type (user|group|link)
  subject_id, role, expiry, password_hash

Comment
  id, page_id, author_id, anchor (paragraph hash)
  body, resolved, created_at

Tag
  id, workspace_id, name

PageTag
  page_id, tag_id
```

### 4.3 API Design

- **Base URL**: `/api/v1`
- **Auth**: Bearer token (JWT) on all private routes
- **Pagination**: cursor-based on all list endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET / POST` | `/workspaces` | List or create workspaces |
| `GET / PUT / DELETE` | `/pages/:id` | Read, update, or delete a page |
| `POST` | `/pages/:id/publish` | Toggle publish state |
| `GET` | `/pages/:id/versions` | List version history |
| `POST` | `/access-groups` | Create a new access group |
| `GET` | `/search?q=&workspace=&tags=` | Full-text search with filters |
| `POST` | `/webhooks` | Register a webhook endpoint |

Webhooks are signed with `HMAC-SHA256` using the user's webhook secret.

### 4.4 Access Control Enforcement

- Every API request resolves effective permission via a centralized `checkAccess(userId, pageId, requiredRole)` function.
- **Permission resolution order**: Page-level explicit grant → Group membership → Workspace default → **Deny**
- Public pages skip auth check but still enforce `visibility = public` flag in DB.
- Share links validated against `PageAccess` table: check expiry, password hash, and target page.
- All permission checks occur **server-side**; the frontend only receives data it is authorized to see.

### 4.5 Security & Privacy

- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Passwords hashed with `bcrypt` (cost factor 12)
- Share link tokens: 32-byte cryptographically random, stored as SHA-256 hash
- Rate limiting: 100 req/min per IP for public endpoints; 500 req/min for authenticated
- CSRF protection on all state-mutating endpoints
- Content Security Policy headers on all public pages
- Audit log retained for 90 days; no PII logged beyond user ID and action
- GDPR: data export and account deletion available via settings

---

## 5. Non-Goals

The following are explicitly **out of scope** for V1 to protect the timeline:

- Real-time multiplayer collaborative editing *(deferred to v2 — requires CRDT)*
- Native iOS / Android apps *(PWA covers mobile in v1)*
- Built-in email newsletter sending *(export + third-party integration only)*
- Database views (Notion-style tables with formulas) — plain Markdown tables only
- White-label multi-tenant SaaS mode *(Talion is single-owner, self-hosted)*
- Built-in payments or subscriptions for gating content
- Figma / design tool embeds *(YouTube, Twitter embeds supported)*

---

## 6. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Access control bug leaks private pages | **Critical** | Automated permission tests in CI; penetration test before v1 launch |
| Search performance degrades at scale | **High** | Use Meilisearch if PG FTS exceeds 200ms; benchmark at 50k docs |
| Custom domain setup friction for non-devs | **Medium** | Provide step-by-step DNS guide; validate CNAME automatically |
| Markdown editor UX feels incomplete vs Notion | **Medium** | Ship slash commands and callout blocks in MVP; gather feedback early |
| AI Q&A costs blow up with large knowledge bases | **Low** | Cap context window per query; add usage limits in settings |
| GitHub sync conflicts on concurrent edits | **Low** | Last-write-wins with conflict log; manual merge UI in v2 |

---

## 7. Phased Roadmap

### MVP — Core Loop
> Goal: A working personal knowledge base. **Ship in 4–6 weeks.**

1. Authentication (email/password, magic link)
2. Single workspace with nested pages (max 3 levels)
3. Markdown editor with live preview, auto-save, syntax highlighting
4. Private / Public visibility toggle per page
5. Full-text search (PostgreSQL FTS)
6. Basic tags and filtering
7. Clean public read view (docs layout)

---

### V1 — Access & Publishing
> Goal: Full access control + publishing. **Ship 4–6 weeks after MVP.**

1. Multiple workspaces
2. Access groups + role-based permissions
3. Share links (password-protected, expiring)
4. Custom slugs, SEO metadata, OG image upload
5. Version history (last 50 versions, diff view)
6. RSS feed, sitemap generation
7. Page status workflow (Draft → Published → Archived)
8. Inline commenting and @mentions

---

### V2 — Intelligence & Integrations
> Goal: AI features + developer integrations. **Ship 6–8 weeks after V1.**

1. AI Summarize, Improve, Auto-tag
2. AI Q&A across knowledge base (RAG with Claude API)
3. Backlinks panel + Graph view
4. `[[wikilink]]` internal linking
5. Import: Notion, Obsidian, Confluence
6. Export: PDF, EPUB, HTML
7. REST API + Webhooks
8. GitHub Sync (two-way Markdown)

---

### V3 — Polish & Power
> Goal: Production-quality publishing platform. **Ship 6–8 weeks after V2.**

1. Custom domain support (CNAME)
2. Custom CSS injection per workspace
3. Analytics dashboard (page views, read time, traffic sources)
4. Browser extension for web clipping
5. Mobile PWA with offline editing
6. CLI tool (`talion push` / `talion pull`)
7. Real-time collaborative editing (CRDT — Yjs)

---

## 8. Open Questions

- [ ] **Tech stack confirmation**: Next.js + Hono + PostgreSQL, or alternative?
- [ ] **Hosting**: self-hosted on VPS (Railway, Render, Fly.io) or local Docker?
- [ ] **Editor choice**: TipTap (WYSIWYG-first) or CodeMirror 6 (Markdown-first)?
- [ ] **Search**: PostgreSQL FTS sufficient for MVP, or start with Meilisearch?
- [ ] **Auth**: magic link only, or also OAuth (GitHub, Google)?
- [ ] **AI Q&A**: embed all notes per query (small KB) or build a vector search index (pgvector)?

---

*Talion PRD · v1.0 · March 2026 · Confidential*
