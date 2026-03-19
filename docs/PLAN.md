# Talion — LLM Build Plan
> Machine-readable project plan for Claude multi-agent execution.
> Queen agent reads this file to coordinate all sub-agents.

---

## Project Identity

```
name: Talion
type: Personal knowledge & publishing platform
stack:
  frontend: Next.js 14 (App Router) + TypeScript
  styling: Tailwind CSS + shadcn/ui
  editor: TipTap
  database: Supabase (Postgres + RLS)
  auth: Supabase Auth
  storage: Supabase Storage
  public_urls: Next.js dynamic routes + ISR
  ai: Anthropic Claude API
root_dir: ./talion
package_manager: pnpm
```

---

## Agent Architecture

```
QUEEN (claude-sonnet-4)
  Role: Orchestrator. Reads this plan, decomposes tasks, spawns sub-agents, tracks state.
  Rules:
    - Never writes code directly
    - Assigns exactly one task per coder agent
    - Waits for ALL coders to finish before spawning reviewer
    - Uses haiku for reading/planning calls, sonnet for spawning coders and reviewer

CODER (claude-sonnet-4) x6 per phase
  Role: Implementer. Receives a single task spec from queen, writes code, returns file list.
  Rules:
    - Only implement what the task spec says
    - No scope creep beyond task boundaries
    - Return: { status, files_written, notes }

REVIEWER (claude-sonnet-4) x1 per phase
  Role: Quality gate. Spawned after ALL coders complete. Reads all written files, checks integration.
  Rules:
    - Check imports resolve across task boundaries
    - Check env vars are consistent
    - Check no duplicate logic
    - Return: { approved: bool, issues: string[], fix_instructions: string[] }
```

---

## Token Optimization Rules

```
USE haiku (claude-haiku-4-5) FOR:
  - Reading files to understand context
  - Summarizing existing code
  - Checking if a file exists
  - Generating short config snippets (<20 lines)
  - Planning sub-task decomposition
  - Status checks between agents

USE sonnet (claude-sonnet-4) FOR:
  - Writing implementation code (any file >20 lines)
  - Spawning sub-agents (tool calls)
  - Reviewer synthesis across multiple files
  - Resolving integration conflicts
  - Writing SQL migrations
  - Writing TypeScript types and interfaces

NEVER USE opus FOR:
  - Any task in this plan (reserved for human-level reasoning only)
```

---

## Shared Context (injected into every agent)

```typescript
// Every agent receives this block prepended to their prompt
const SHARED_CONTEXT = {
  project: "Talion",
  root: "./talion",
  supabase_url: "process.env.NEXT_PUBLIC_SUPABASE_URL",
  supabase_anon: "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY",
  supabase_service: "process.env.SUPABASE_SERVICE_ROLE_KEY",
  conventions: {
    components: "src/components/{feature}/ComponentName.tsx",
    hooks: "src/hooks/use-{name}.ts",
    lib: "src/lib/{name}.ts",
    types: "src/types/{name}.ts",
    migrations: "supabase/migrations/YYYYMMDDHHMMSS_{name}.sql",
    styles: "src/styles/{name}.css",
  },
  rules: [
    "Use TypeScript strict mode",
    "All DB access goes through src/lib/supabase.ts",
    "Never hardcode secrets — use process.env",
    "Export types from src/types/index.ts",
    "All components are server components unless marked 'use client'",
  ],
}
```

---

## Phase Registry

```
PHASE_0: Project Scaffolding        | Week 1      | 6 tasks | prerequisite for all
PHASE_1: Core Editor + Pages        | Weeks 2–3   | 6 tasks | requires PHASE_0
PHASE_2: Access Control + Public URLs | Weeks 4–5 | 8 tasks | requires PHASE_1
PHASE_3: Theming + Collaboration    | Weeks 6–7   | 6 tasks | requires PHASE_2
PHASE_4: AI + Power Features        | Weeks 8–10  | 6 tasks | requires PHASE_3
```

---

## Phase 0 — Project Scaffolding

### Queen Instructions for Phase 0

```
1. Read this phase block (use haiku)
2. Spawn 6 coder agents in parallel — one per task below
3. Each coder receives: shared_context + their task spec
4. Wait for all 6 coders to return { status, files_written, notes }
5. Spawn 1 reviewer with: shared_context + all files_written lists + review checklist
6. If reviewer returns approved=false: spawn fix coders for each issue (1 coder per issue)
7. Phase 0 complete when reviewer returns approved=true
```

### Task Specs

---

#### TASK-0-A: Monorepo Setup
```
agent: coder-0-a
model: sonnet
priority: 1
parallel_safe: true
depends_on: []

goal: >
  Scaffold the Next.js 14 monorepo with all tooling configured and ready.

deliverables:
  - talion/package.json                        # pnpm workspace, scripts
  - talion/next.config.ts                      # App Router, TypeScript strict
  - talion/tsconfig.json                       # strict, paths alias @/*
  - talion/tailwind.config.ts                  # content paths, theme extend placeholder
  - talion/postcss.config.js
  - talion/.eslintrc.json                      # next/core-web-vitals + typescript
  - talion/.prettierrc
  - talion/.env.example                        # all required env vars, no values
  - talion/.gitignore
  - talion/src/app/layout.tsx                  # root layout, html/body shell only
  - talion/src/app/page.tsx                    # redirect to /dashboard placeholder

implementation_notes:
  - Use pnpm as package manager
  - next.config.ts: enable experimental.typedRoutes
  - tsconfig paths: "@/*": ["./src/*"]
  - Do NOT install shadcn yet — that is TASK-0-E
  - tailwind.config.ts content: ["./src/**/*.{ts,tsx}"]
  - .env.example must include: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL
```

---

#### TASK-0-B: Supabase Project + Client Setup
```
agent: coder-0-b
model: sonnet
priority: 1
parallel_safe: true
depends_on: []

goal: >
  Set up Supabase client utilities for both browser and server usage in Next.js App Router.

deliverables:
  - talion/src/lib/supabase/client.ts          # createBrowserClient()
  - talion/src/lib/supabase/server.ts          # createServerClient() with cookie handling
  - talion/src/lib/supabase/middleware.ts      # updateSession() helper
  - talion/src/middleware.ts                   # Next.js middleware — refresh session
  - talion/src/types/supabase.ts               # placeholder Database type (will be generated)

implementation_notes:
  - Use @supabase/ssr package (not deprecated @supabase/auth-helpers-nextjs)
  - client.ts: export createClient() using createBrowserClient
  - server.ts: export createClient() using createServerClient with cookies() from next/headers
  - middleware.ts matcher: exclude _next/static, _next/image, favicon.ico
  - supabase.ts Database type: export type Database = { public: { Tables: {}; Views: {}; Functions: {} } }
  - All Supabase access in the app MUST import from these files, never instantiate directly
```

---

#### TASK-0-C: Database Schema v1
```
agent: coder-0-c
model: sonnet
priority: 1
parallel_safe: true
depends_on: []

goal: >
  Write the initial Supabase SQL migration for users, workspaces, and pages with RLS.

deliverables:
  - talion/supabase/migrations/20240101000000_initial_schema.sql
  - talion/supabase/seed.sql                   # minimal seed: 1 test workspace

implementation_notes:
  Schema requirements:

  TABLE profiles (extends auth.users):
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
    email text NOT NULL
    full_name text
    avatar_url text
    created_at timestamptz DEFAULT now()

  TABLE workspaces:
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
    owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
    name text NOT NULL
    slug text NOT NULL UNIQUE
    description text
    visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public'))
    custom_domain text
    created_at timestamptz DEFAULT now()
    updated_at timestamptz DEFAULT now()

  TABLE pages:
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
    parent_id uuid REFERENCES pages(id) ON DELETE SET NULL
    author_id uuid NOT NULL REFERENCES profiles(id)
    title text NOT NULL DEFAULT 'Untitled'
    slug text NOT NULL
    content_md text DEFAULT ''
    content_html text DEFAULT ''
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived'))
    visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','group','specific','public'))
    icon text
    cover_url text
    position integer DEFAULT 0
    frontmatter jsonb DEFAULT '{}'
    created_at timestamptz DEFAULT now()
    updated_at timestamptz DEFAULT now()
    UNIQUE(workspace_id, slug)

  RLS POLICIES:
    profiles: users can read/update their own row
    workspaces: owner has full access; public workspaces readable by all authenticated
    pages: author has full access; public pages readable by all; private only by author

  INDEXES:
    pages(workspace_id), pages(parent_id), pages(slug), workspaces(slug), workspaces(owner_id)

  TRIGGERS:
    on auth.users insert → insert into profiles
    on workspaces/pages update → set updated_at = now()
```

---

#### TASK-0-D: Auth Foundation
```
agent: coder-0-d
model: sonnet
priority: 1
parallel_safe: true
depends_on: []

goal: >
  Implement Supabase Auth flows — email/password, magic link, session handling, protected routes.

deliverables:
  - talion/src/app/(auth)/login/page.tsx       # login form (email+password + magic link tab)
  - talion/src/app/(auth)/signup/page.tsx      # signup form
  - talion/src/app/(auth)/callback/route.ts    # OAuth/magic link callback handler
  - talion/src/app/(auth)/layout.tsx           # centered card layout, no sidebar
  - talion/src/lib/auth.ts                     # getSession(), getUser(), requireAuth() helpers
  - talion/src/components/auth/LoginForm.tsx
  - talion/src/components/auth/SignupForm.tsx
  - talion/src/components/auth/LogoutButton.tsx

implementation_notes:
  - Login page: two tabs — "Password" and "Magic Link"
  - Magic link: call supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
  - Password: call supabase.auth.signInWithPassword({ email, password })
  - Signup: call supabase.auth.signUp — show "check your email" on success
  - callback/route.ts: exchange code for session via supabase.auth.exchangeCodeForSession
  - requireAuth(): server function — if no session, redirect('/login')
  - All forms: use React Hook Form + zod validation
  - Middleware already set up by TASK-0-B; auth pages must be in (auth) route group
  - After login success: redirect to /dashboard
```

---

#### TASK-0-E: Theming System
```
agent: coder-0-e
model: sonnet
priority: 1
parallel_safe: true
depends_on: []

goal: >
  Build the CSS variable theming system with light/dark mode, font scale, and accent tokens.
  This is the design foundation for ALL future components.

deliverables:
  - talion/src/styles/globals.css              # CSS variables — full light + dark theme
  - talion/src/styles/themes.css               # accent color overrides (--accent-* vars)
  - talion/src/lib/theme.ts                    # ThemeConfig type, applyAccentColor()
  - talion/src/types/theme.ts                  # FontFamily, AccentColor, ThemeMode types
  - talion/src/components/theme/ThemeProvider.tsx  # wraps next-themes Provider
  - talion/src/components/theme/ThemeToggle.tsx    # light/dark/system toggle button

implementation_notes:
  CSS variables to define in :root and .dark:
    --background, --foreground
    --card, --card-foreground
    --popover, --popover-foreground
    --primary, --primary-foreground
    --secondary, --secondary-foreground
    --muted, --muted-foreground
    --accent, --accent-foreground
    --border, --input, --ring
    --sidebar-bg, --sidebar-border, --sidebar-text
    --font-sans, --font-serif, --font-mono
    --radius: 0.5rem

  Accent colors (5 presets):
    indigo (default), teal, violet, rose, amber
    Each maps to: --accent-500, --accent-600, --accent-100

  ThemeProvider: use next-themes, attribute="class", defaultTheme="system"
  ThemeToggle: icon button cycling light → dark → system
  Font families:
    sans: 'Geist', system-ui, sans-serif
    serif: 'Lora', Georgia, serif
    mono: 'Geist Mono', monospace
  tailwind.config.ts: wire CSS vars into theme.extend.colors and theme.extend.fontFamily
```

---

#### TASK-0-F: App Shell Layout
```
agent: coder-0-f
model: sonnet
priority: 1
parallel_safe: true
depends_on: []

goal: >
  Build the authenticated app shell — sidebar, top nav, and protected layout wrapper.
  This is the persistent chrome wrapping all dashboard pages.

deliverables:
  - talion/src/app/(app)/layout.tsx            # protected layout — requireAuth + shell
  - talion/src/app/(app)/dashboard/page.tsx    # placeholder dashboard page
  - talion/src/components/shell/AppShell.tsx   # root shell — sidebar + main area
  - talion/src/components/shell/Sidebar.tsx    # collapsible sidebar with nav sections
  - talion/src/components/shell/TopNav.tsx     # breadcrumb + user menu + theme toggle
  - talion/src/components/shell/UserMenu.tsx   # avatar dropdown — profile, settings, logout
  - talion/src/components/shell/NavItem.tsx    # sidebar nav link with icon + active state
  - talion/src/components/ui/skeleton.tsx      # loading skeleton primitive

implementation_notes:
  AppShell layout:
    - Left sidebar: 240px fixed, collapsible to 56px icon rail on mobile
    - Main area: flex-1, overflow-y-auto, padding 1.5rem
    - Sidebar sections: Workspaces (top), Pages (middle), Settings (bottom)

  Sidebar content (static for Phase 0 — dynamic data in Phase 1):
    - App logo "Talion" at top
    - Workspace name placeholder
    - Nav links: Dashboard, Pages, Search, Settings
    - Bottom: ThemeToggle + UserMenu

  TopNav:
    - Left: breadcrumb (page title for now)
    - Right: ThemeToggle + UserMenu avatar

  UserMenu dropdown items: Profile, Settings, divider, Logout
  Logout calls supabase.auth.signOut() then router.push('/login')

  Use CSS variables from TASK-0-E (assume globals.css is imported in root layout)
  Use Tailwind classes only — no inline styles
  All icons from lucide-react
```

---

### Phase 0 Reviewer Checklist

```
reviewer_model: sonnet
triggered_after: all 6 coder-0-* agents return status=done

checks:
  imports:
    - src/app/(app)/layout.tsx imports requireAuth from src/lib/auth.ts ✓
    - src/lib/supabase/server.ts and client.ts export createClient() ✓
    - ThemeProvider is used in src/app/layout.tsx ✓
    - globals.css is imported in src/app/layout.tsx ✓

  env_vars:
    - .env.example contains all vars referenced in code ✓
    - No hardcoded Supabase URLs or keys in source ✓

  schema:
    - Migration file is valid SQL (no syntax errors) ✓
    - RLS is enabled on all 3 tables ✓
    - Trigger for profile creation on signup exists ✓

  conventions:
    - All files follow the path conventions in shared_context ✓
    - No component imports from absolute paths (use @/* alias) ✓
    - No 'use client' on server components ✓

  integration:
    - Auth callback route exists at /auth/callback ✓
    - Middleware covers all app routes except (auth) group ✓
    - App shell layout uses requireAuth() ✓

output_format:
  approved: boolean
  issues: string[]           # each issue is a one-line description
  fix_instructions: string[] # one instruction per issue, assigned to a fix coder
```

---

## Phase 1 — Core Editor + Pages

> Full task specs follow the same structure as Phase 0.
> Queen reads this after Phase 0 reviewer returns approved=true.

### Tasks (summary)
```
TASK-1-A: TipTap editor integration
TASK-1-B: Nested pages tree + Supabase
TASK-1-C: Auto-save + page_versions table
TASK-1-D: File uploads to Supabase Storage
TASK-1-E: Workspaces CRUD + switcher
TASK-1-F: Tags system + sidebar filter
```

---

## Phase 2 — Access Control + Public URLs

### Tasks (summary)
```
TASK-2-A: RLS policies (Private/Group/User/Public)
TASK-2-B: Access groups + group_members table
TASK-2-C: Share links (expiring, password-protected)
TASK-2-D: Public URL routing /[workspace]/[slug] with ISR
TASK-2-E: Public read view (Docs/Blog/Wiki layouts)
TASK-2-F: Custom domain middleware resolver
TASK-2-G: Full-text search (pg_trgm + Cmd+K modal)
TASK-2-H: RSS feed /[workspace]/feed.xml
```

---

## Phase 3 — Theming + Collaboration

### Tasks (summary)
```
TASK-3-A: Per-workspace accent color + font + custom CSS
TASK-3-B: Dark/light/system mode (next-themes, persisted)
TASK-3-C: Page cover image + emoji icon picker
TASK-3-D: Inline comments (Supabase Realtime + @mentions)
TASK-3-E: Activity feed (page_activity table)
TASK-3-F: Wikilinks + backlinks + D3 graph view
```

---

## Phase 4 — AI + Power Features

### Tasks (summary)
```
TASK-4-A: AI summarize + improve (Claude API)
TASK-4-B: AI Q&A over notes (pgvector RAG)
TASK-4-C: Import from Notion / Obsidian
TASK-4-D: Export to PDF / Markdown / HTML
TASK-4-E: REST API /api/v1 + HMAC webhooks
TASK-4-F: Analytics (page views, read time, traffic source)
```

---

## State Tracking Schema

> Queen agent maintains this state object in memory across the session.

```json
{
  "current_phase": "PHASE_0",
  "phase_status": {
    "PHASE_0": "in_progress",
    "PHASE_1": "pending",
    "PHASE_2": "pending",
    "PHASE_3": "pending",
    "PHASE_4": "pending"
  },
  "agents": {
    "coder-0-a": { "status": "pending", "files_written": [], "notes": "" },
    "coder-0-b": { "status": "pending", "files_written": [], "notes": "" },
    "coder-0-c": { "status": "pending", "files_written": [], "notes": "" },
    "coder-0-d": { "status": "pending", "files_written": [], "notes": "" },
    "coder-0-e": { "status": "pending", "files_written": [], "notes": "" },
    "coder-0-f": { "status": "pending", "files_written": [], "notes": "" },
    "reviewer-0": { "status": "waiting", "approved": null, "issues": [] }
  }
}
```
