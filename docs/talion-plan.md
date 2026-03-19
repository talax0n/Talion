# Talion — LLM Build Plan
> Machine-readable project plan for Claude multi-agent execution.
> Queen agent reads this file to coordinate all sub-agents.

---

## Project Identity

```
name: Talion
type: Personal knowledge & publishing platform
stack:
  frontend:    Next.js 14 (App Router) + TypeScript
  styling:     Tailwind CSS + shadcn/ui
  editor:      TipTap
  database:    Supabase (Postgres + RLS) — data only, no Supabase Auth
  orm:         Prisma — all app DB queries go through Prisma Client
  auth:        BetterAuth (standalone, uses Supabase Postgres via DATABASE_URL)
  storage:     Supabase Storage (direct SDK, not through Prisma)
  public_urls: Next.js dynamic routes + ISR
  ai:          Anthropic Claude API
  obsidian:    Bidirectional local vault sync daemon (talion-sync)
root_dir:      ./talion
package_manager: pnpm
```

---

## Stack Decisions

```
PRISMA ROLE:
  - Single source of truth for all application DB schema (schema.prisma)
  - All app queries use Prisma Client — never raw SQL or supabase-js for data reads/writes
  - Prisma manages migrations via: pnpm prisma migrate dev
  - Supabase SQL migrations folder is ONLY used for:
      - RLS policies (Prisma cannot manage RLS)
      - Storage bucket creation
      - Postgres functions / RPCs
      - pg_trgm / pgvector extensions
  - BetterAuth STILL uses its own pg Pool (not Prisma) for auth tables
  - Prisma schema reflects app tables only — NOT BetterAuth tables

SUPABASE ROLE:
  - Postgres host (Prisma connects via DATABASE_URL)
  - RLS enforcement (defined in supabase/migrations/*.sql)
  - Supabase Storage for file uploads (SDK only, not Prisma)
  - Supabase Realtime for live features (comments, presence)
  - Supabase Auth is NOT used — never import or call supabase.auth.*

BETTERAUTH ROLE:
  - All authentication: email/password, magic link, sessions
  - Uses its own pg Pool pointed at DATABASE_URL
  - Manages tables: user, session, account, verification
  - Exposes /api/auth/[...all] route handler
  - Server: auth.api.getSession() — Client: authClient.useSession()

SHADCN/UI ROLE:
  - All UI primitives from shadcn/ui
  - Never hand-roll what shadcn provides
  - CSS variables use shadcn-compatible naming

OBSIDIAN SYNC ROLE:
  - talion-sync: separate local daemon process (not part of Next.js)
  - Watches local Obsidian vault folder via chokidar
  - Calls Talion REST API to push/pull changes
  - Handles conflict resolution (last-write-wins + conflict log)
  - Optionally packaged as Obsidian community plugin
```

---

## Agent Architecture

```
QUEEN (claude-sonnet-4)
  Role: Orchestrator. Reads plan, spawns sub-agents, tracks state.
  Rules:
    - Never writes code
    - One task per coder agent
    - Waits for ALL coders before spawning reviewer
    - haiku for reads/planning, sonnet for spawning

CODER (claude-sonnet-4) x6 per phase
  Role: Implementer. One task spec → writes code → returns file list.
  Rules:
    - No scope creep
    - Return: { status, files_written, notes }

REVIEWER (claude-sonnet-4) x1 per phase
  Role: Quality gate after ALL coders complete.
  Rules:
    - Check cross-task imports, env vars, Prisma usage, no Supabase Auth leaks
    - Return: { approved, issues, fix_instructions }
```

---

## Token Optimization Rules

```
USE claude-haiku-4-5 FOR:
  - Reading/summarizing existing files
  - Checking exports and file existence
  - Config snippets under 20 lines
  - Planning decomposition
  - Parsing agent JSON outputs

USE claude-sonnet-4 FOR:
  - Any implementation file over 20 lines
  - Spawning sub-agents
  - Reviewer synthesis
  - Resolving conflicts
  - Prisma schema, migrations, TypeScript types

NEVER USE opus.
```

---

## Shared Context (injected into every agent)

```
project:         Talion
root_dir:        ./talion
package_manager: pnpm

env_vars:
  DATABASE_URL                    # Supabase Postgres direct — used by Prisma AND BetterAuth
  NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL — used by Storage SDK only
  NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon key — used by Storage SDK only
  SUPABASE_SERVICE_ROLE_KEY       # Supabase service role — used by server Storage SDK
  BETTER_AUTH_SECRET              # BetterAuth random secret
  BETTER_AUTH_URL                 # App base URL e.g. http://localhost:3000
  NEXT_PUBLIC_APP_URL             # Public app URL
  TALION_API_TOKEN                # Long-lived token for talion-sync daemon API calls

file_conventions:
  components:    src/components/{feature}/ComponentName.tsx
  hooks:         src/hooks/use-{name}.ts
  lib:           src/lib/{name}.ts
  types:         src/types/{name}.ts
  prisma_schema: prisma/schema.prisma
  rls_sql:       supabase/migrations/YYYYMMDDHHMMSS_{name}.sql  # RLS + extensions only
  api_routes:    src/app/api/{route}/route.ts
  sync_daemon:   talion-sync/src/{name}.ts

coding_rules:
  - TypeScript strict mode always
  - ALL app data queries use Prisma Client from src/lib/prisma.ts
  - NEVER use supabase-js for data queries (only for Storage and Realtime)
  - All auth via src/lib/auth.ts (server) or src/lib/auth-client.ts (browser)
  - NEVER call supabase.auth.*
  - All UI primitives from shadcn/ui
  - All icons from lucide-react
  - Tailwind utility classes only
  - Server components by default; 'use client' only when needed
  - Always use @/* import alias
```

---

## Prisma Schema (canonical reference for all agents)

```prisma
// prisma/schema.prisma
// This is the source of truth for all app tables.
// BetterAuth tables (user, session, account, verification) are NOT here.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}

model Profile {
  id        String   @id                     // matches BetterAuth user.id
  email     String   @unique
  fullName  String?  @map("full_name")
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  workspaces Workspace[]
  pages      Page[]
  versions   PageVersion[]
  comments   Comment[]

  @@map("profiles")
}

model Workspace {
  id           String   @id @default(uuid())
  ownerId      String   @map("owner_id")
  name         String
  slug         String   @unique
  description  String?
  visibility   String   @default("private")  // private | public
  customDomain String?  @map("custom_domain")
  theme        Json     @default("{}")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  owner    Profile         @relation(fields: [ownerId], references: [id])
  pages    Page[]
  tags     Tag[]
  groups   AccessGroup[]

  @@map("workspaces")
}

model Page {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  parentId    String?  @map("parent_id")
  authorId    String   @map("author_id")
  title       String   @default("Untitled")
  slug        String
  contentMd   String   @default("") @map("content_md")
  contentHtml String   @default("") @map("content_html")
  status      String   @default("draft")    // draft | published | archived
  visibility  String   @default("private")  // private | group | specific | public
  icon        String?
  coverUrl    String?  @map("cover_url")
  position    Int      @default(0)
  frontmatter Json     @default("{}")
  // Obsidian sync fields
  vaultPath         String?   @map("vault_path")      // relative path in vault e.g. "Notes/ideas.md"
  obsidianSyncedAt  DateTime? @map("obsidian_synced_at")
  obsidianChecksum  String?   @map("obsidian_checksum") // md5 of last synced content
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace   Workspace     @relation(fields: [workspaceId], references: [id])
  parent      Page?         @relation("PageTree", fields: [parentId], references: [id])
  children    Page[]        @relation("PageTree")
  author      Profile       @relation(fields: [authorId], references: [id])
  versions    PageVersion[]
  tags        PageTag[]
  comments    Comment[]
  links       PageLink[]    @relation("SourcePage")
  backlinks   PageLink[]    @relation("TargetPage")
  access      PageAccess[]

  @@unique([workspaceId, slug])
  @@map("pages")
}

model PageVersion {
  id        String   @id @default(uuid())
  pageId    String   @map("page_id")
  authorId  String   @map("author_id")
  contentMd String   @map("content_md")
  createdAt DateTime @default(now()) @map("created_at")

  page   Page    @relation(fields: [pageId], references: [id], onDelete: Cascade)
  author Profile @relation(fields: [authorId], references: [id])

  @@map("page_versions")
}

model Tag {
  id          String @id @default(uuid())
  workspaceId String @map("workspace_id")
  name        String
  color       String @default("#6366f1")

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  pages     PageTag[]

  @@unique([workspaceId, name])
  @@map("tags")
}

model PageTag {
  pageId String @map("page_id")
  tagId  String @map("tag_id")

  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([pageId, tagId])
  @@map("page_tags")
}

model PageLink {
  id       String @id @default(uuid())
  sourceId String @map("source_id")
  targetId String @map("target_id")

  source Page @relation("SourcePage", fields: [sourceId], references: [id], onDelete: Cascade)
  target Page @relation("TargetPage", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetId])
  @@map("page_links")
}

model AccessGroup {
  id          String @id @default(uuid())
  workspaceId String @map("workspace_id")
  name        String

  workspace Workspace           @relation(fields: [workspaceId], references: [id])
  members   AccessGroupMember[]
  access    PageAccess[]

  @@map("access_groups")
}

model AccessGroupMember {
  groupId String @map("group_id")
  userId  String @map("user_id")
  role    String @default("viewer")  // viewer | editor | admin

  group AccessGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@id([groupId, userId])
  @@map("access_group_members")
}

model PageAccess {
  id           String    @id @default(uuid())
  pageId       String    @map("page_id")
  subjectType  String    @map("subject_type")   // user | group | link
  subjectId    String?   @map("subject_id")
  role         String    @default("viewer")
  token        String?   @unique                // for share links
  passwordHash String?   @map("password_hash")
  expiresAt    DateTime? @map("expires_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  page  Page         @relation(fields: [pageId], references: [id], onDelete: Cascade)
  group AccessGroup? @relation(fields: [subjectId], references: [id])

  @@map("page_access")
}

model Comment {
  id        String   @id @default(uuid())
  pageId    String   @map("page_id")
  authorId  String   @map("author_id")
  anchor    String?                         // paragraph hash for inline anchoring
  body      String
  resolved  Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  page   Page    @relation(fields: [pageId], references: [id], onDelete: Cascade)
  author Profile @relation(fields: [authorId], references: [id])

  @@map("comments")
}

model ObsidianSyncLog {
  id          String   @id @default(uuid())
  pageId      String   @map("page_id")
  vaultPath   String   @map("vault_path")
  direction   String                        // vault_to_talion | talion_to_vault
  status      String                        // success | conflict | error
  conflictMd  String?  @map("conflict_md") // saved conflict content if any
  message     String?
  syncedAt    DateTime @default(now()) @map("synced_at")

  @@map("obsidian_sync_log")
}
```

---

## Phase Registry

```
PHASE_0: Project Scaffolding          | Week 1      | 6 tasks | prerequisite for all
PHASE_1: Core Editor + Pages          | Weeks 2–3   | 6 tasks | requires PHASE_0
PHASE_2: Access Control + Public URLs | Weeks 4–5   | 8 tasks | requires PHASE_1
PHASE_3: Theming + Collaboration      | Weeks 6–7   | 6 tasks | requires PHASE_2
PHASE_4: AI + Power Features          | Weeks 8–11  | 7 tasks | requires PHASE_3
```

---

## Phase 0 — Project Scaffolding

### Queen Instructions
```
1. Read this phase block (haiku)
2. Spawn 6 coder agents in parallel
3. Each receives: shared_context + task spec
4. Wait for all 6 → { status, files_written, notes }
5. Spawn reviewer with files_written + checklist
6. If approved=false: spawn fix coders, re-run reviewer
7. Phase done when approved=true
```

---

#### TASK-0-A · Monorepo Setup
```
agent:         coder-0-a
model:         sonnet
parallel_safe: true
depends_on:    []

goal: Scaffold Next.js 14 monorepo with all tooling ready.

deliverables:
  talion/package.json
  talion/next.config.ts
  talion/tsconfig.json
  talion/tailwind.config.ts
  talion/postcss.config.js
  talion/.eslintrc.json
  talion/.prettierrc
  talion/.env.example              # all vars from shared_context env_vars, no values
  talion/.gitignore
  talion/src/app/layout.tsx        # html/body shell only
  talion/src/app/page.tsx          # redirect to /dashboard

implementation_notes:
  - next.config.ts: experimental.typedRoutes = true
  - tsconfig paths: "@/*": ["./src/*"]
  - tailwind.config.ts: content ["./src/**/*.{ts,tsx}"], darkMode "class"
  - Do NOT install shadcn here — that is TASK-0-E
  - package.json dependencies:
      next react react-dom typescript tailwindcss postcss autoprefixer
      @prisma/client @supabase/supabase-js better-auth
      lucide-react next-themes swr
  - devDependencies:
      prisma @types/node @types/react @types/react-dom
      eslint prettier eslint-config-next @typescript-eslint/eslint-plugin
  - .env.example must include ALL 7 vars from shared_context.env_vars
```

---

#### TASK-0-B · Prisma Setup + Supabase Storage Client
```
agent:         coder-0-b
model:         sonnet
parallel_safe: true
depends_on:    []

goal: >
  Set up Prisma Client as the app data layer.
  Set up Supabase JS client for Storage and Realtime ONLY (no data queries, no auth).

deliverables:
  talion/prisma/schema.prisma      # full schema from Prisma Schema section of this plan
  talion/src/lib/prisma.ts         # singleton Prisma Client
  talion/src/lib/storage.ts        # Supabase Storage helpers (upload, getUrl, delete)
  talion/src/lib/realtime.ts       # Supabase Realtime client (browser only)
  talion/src/middleware.ts         # stub middleware with matcher — auth added by TASK-0-D

implementation_notes:
  prisma/schema.prisma:
    Copy full schema from "Prisma Schema" section of this plan verbatim.

  src/lib/prisma.ts:
    Singleton pattern to avoid multiple Prisma Client instances in dev (hot reload):
      import { PrismaClient } from '@prisma/client'
      const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
      export const prisma = globalForPrisma.prisma ?? new PrismaClient()
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

  src/lib/storage.ts:
    import { createClient } from '@supabase/supabase-js'
    const storageClient = createClient(url, serviceRoleKey)
    export async function uploadFile(file: File, path: string): Promise<string>
    export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string>
    export async function deleteFile(path: string): Promise<void>
    IMPORTANT: storageClient is used ONLY for .storage.* calls — NEVER for .auth.* or .from().select()

  src/lib/realtime.ts ('use client'):
    Browser-only Supabase client for Realtime subscriptions
    export const realtimeClient = createClient(url, anonKey)
    Used ONLY for .channel() subscriptions — never for data queries

  middleware.ts:
    Empty stub — matcher only:
      matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
    Real auth check added by TASK-0-D
```

---

#### TASK-0-C · Database Migration + RLS Policies
```
agent:         coder-0-c
model:         sonnet
parallel_safe: true
depends_on:    []

goal: >
  Write Supabase SQL migration for RLS policies and Postgres extensions.
  Prisma manages table creation via prisma migrate — this file ONLY handles
  what Prisma cannot: RLS, storage buckets, extensions, RPCs.

deliverables:
  talion/supabase/migrations/20240101000000_rls_and_extensions.sql
  talion/supabase/migrations/20240101000001_storage_buckets.sql
  talion/supabase/seed.sql

implementation_notes:
  20240101000000_rls_and_extensions.sql:
    -- Extensions
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS vector;  -- for Phase 4 AI Q&A

    -- Enable RLS on all app tables (Prisma creates the tables)
    ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
    ALTER TABLE workspaces       ENABLE ROW LEVEL SECURITY;
    ALTER TABLE pages            ENABLE ROW LEVEL SECURITY;
    ALTER TABLE page_versions    ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tags             ENABLE ROW LEVEL SECURITY;
    ALTER TABLE page_tags        ENABLE ROW LEVEL SECURITY;
    ALTER TABLE page_links       ENABLE ROW LEVEL SECURITY;
    ALTER TABLE access_groups    ENABLE ROW LEVEL SECURITY;
    ALTER TABLE page_access      ENABLE ROW LEVEL SECURITY;
    ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;
    ALTER TABLE obsidian_sync_log ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    -- profiles: own row only
    CREATE POLICY "profiles_own" ON profiles
      USING (id = current_setting('app.user_id', true));

    -- workspaces: owner full access; public SELECT for authenticated
    CREATE POLICY "workspaces_owner" ON workspaces
      USING (owner_id = current_setting('app.user_id', true));
    CREATE POLICY "workspaces_public_read" ON workspaces FOR SELECT
      USING (visibility = 'public');

    -- pages: author full access; public SELECT; private = author only
    CREATE POLICY "pages_author" ON pages
      USING (author_id = current_setting('app.user_id', true));
    CREATE POLICY "pages_public_read" ON pages FOR SELECT
      USING (visibility = 'public' AND status = 'published');

    NOTE: app.user_id is set per-request by the API layer before queries.
          Prisma middleware will call SET LOCAL app.user_id = '{userId}' in a transaction.

  20240101000001_storage_buckets.sql:
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'page-assets', 'page-assets', false, 52428800,
      ARRAY['image/jpeg','image/png','image/gif','image/webp',
            'application/pdf','text/plain','video/mp4']
    ) ON CONFLICT DO NOTHING;

  seed.sql: comment only — no inserts (BetterAuth handles user creation)
```

---

#### TASK-0-D · BetterAuth Setup
```
agent:         coder-0-d
model:         sonnet
parallel_safe: true
depends_on:    []

goal: >
  Configure BetterAuth with Supabase Postgres adapter.
  Email/password + magic link. Next.js API handler + middleware.

deliverables:
  talion/src/lib/auth.ts
  talion/src/lib/auth-client.ts
  talion/src/app/api/auth/[...all]/route.ts
  talion/src/middleware.ts                            # OVERWRITE TASK-0-B stub
  talion/src/app/(auth)/login/page.tsx
  talion/src/app/(auth)/signup/page.tsx
  talion/src/app/(auth)/verify/page.tsx
  talion/src/app/(auth)/layout.tsx
  talion/src/components/auth/LoginForm.tsx
  talion/src/components/auth/SignupForm.tsx
  talion/src/hooks/use-session.ts

implementation_notes:
  auth.ts:
    import { betterAuth } from "better-auth"
    import { Pool } from "pg"
    export const auth = betterAuth({
      database: new Pool({ connectionString: process.env.DATABASE_URL }),
      emailAndPassword: { enabled: true },
      plugins: [magicLink({ sendMagicLink: async ({ email, url }) => { /* TODO */ } })]
    })

  auth-client.ts:
    import { createAuthClient } from "better-auth/react"
    export const authClient = createAuthClient({ baseURL: process.env.NEXT_PUBLIC_APP_URL })
    export const { useSession, signIn, signOut, signUp } = authClient

  API route:
    export const { GET, POST } = auth.handler

  middleware.ts (OVERWRITES stub from TASK-0-B):
    Protect /dashboard/* and /(app)/* — redirect to /login if no session
    Use auth.api.getSession({ headers: request.headers })
    Public: /login /signup /verify /api/auth/* /[workspace]/*

  After sign-in: upsert Profile row in Postgres via prisma.profile.upsert()
    Import prisma from @/lib/prisma — NOT supabase-js

  LoginForm: shadcn Card + Tabs (Password | Magic Link) + Input + Button + Label
  SignupForm: shadcn Card + Input + Button + Label
  use-session: wraps authClient.useSession() → { user, session, isPending }
```

---

#### TASK-0-E · Theming System + shadcn/ui
```
agent:         coder-0-e
model:         sonnet
parallel_safe: true
depends_on:    []

goal: Install shadcn/ui, configure CSS variable theming, light/dark mode, accent tokens.

deliverables:
  talion/components.json
  talion/src/styles/globals.css
  talion/src/lib/utils.ts                   # cn() helper
  talion/src/types/theme.ts
  talion/src/lib/theme.ts                   # ACCENT_PRESETS, applyAccentColor()
  talion/src/components/theme/ThemeProvider.tsx
  talion/src/components/theme/ThemeToggle.tsx
  # shadcn components:
  talion/src/components/ui/button.tsx
  talion/src/components/ui/input.tsx
  talion/src/components/ui/label.tsx
  talion/src/components/ui/card.tsx
  talion/src/components/ui/tabs.tsx
  talion/src/components/ui/dropdown-menu.tsx
  talion/src/components/ui/avatar.tsx
  talion/src/components/ui/separator.tsx
  talion/src/components/ui/skeleton.tsx
  talion/src/components/ui/tooltip.tsx
  talion/src/components/ui/badge.tsx
  talion/src/components/ui/dialog.tsx
  talion/src/components/ui/sheet.tsx
  talion/src/components/ui/scroll-area.tsx
  talion/src/components/ui/breadcrumb.tsx
  talion/src/components/ui/collapsible.tsx

implementation_notes:
  components.json:
    { "style":"default","rsc":true,"tsx":true,
      "tailwind":{"config":"tailwind.config.ts","css":"src/styles/globals.css",
                  "baseColor":"slate","cssVariables":true},
      "aliases":{"components":"@/components","utils":"@/lib/utils"} }

  globals.css: shadcn-compatible CSS vars in :root + .dark
    Core: --background --foreground --card --popover --primary --secondary
          --muted --accent --destructive --border --input --ring --radius
    Talion extensions: --sidebar-bg --sidebar-border --sidebar-text
                       --font-sans --font-serif --font-mono

  Accent presets (5): indigo (default), teal, violet, rose, amber
  tailwind.config.ts: wire CSS vars, font families, border radius
  ThemeProvider: next-themes, attribute="class", defaultTheme="system"
  ThemeToggle: Button variant="ghost" size="icon", cycles light→dark→system
```

---

#### TASK-0-F · App Shell Layout
```
agent:         coder-0-f
model:         sonnet
parallel_safe: true
depends_on:    []

goal: Authenticated app shell — sidebar, top nav, user menu, protected layout.

deliverables:
  talion/src/app/(app)/layout.tsx
  talion/src/app/(app)/dashboard/page.tsx
  talion/src/components/shell/AppShell.tsx
  talion/src/components/shell/Sidebar.tsx
  talion/src/components/shell/SidebarNav.tsx
  talion/src/components/shell/TopNav.tsx
  talion/src/components/shell/UserMenu.tsx

implementation_notes:
  (app)/layout.tsx:
    Server component. auth.api.getSession() — redirect /login if null.
    Wrap children in <AppShell user={session.user}>

  AppShell ('use client'):
    flex row h-screen. Left: Sidebar 240px (Sheet on mobile). Right: TopNav + main.

  Sidebar:
    ScrollArea for nav. Nav links via shadcn Button variant="ghost".
    Active: variant="secondary" via usePathname().
    Bottom: Separator + ThemeToggle + UserMenu.

  UserMenu:
    shadcn DropdownMenu. Trigger: Avatar (initials fallback).
    Items: Profile, Settings, Separator, Sign out.
    Sign out: authClient.signOut() → router.push('/login').
    Import authClient from @/lib/auth-client.

  dashboard/page.tsx:
    Heading "Welcome to Talion" + 2 placeholder shadcn Cards.
    Fetch user's workspace count: await prisma.workspace.count({ where: { ownerId: user.id } })
```

---

### Phase 0 Reviewer Checklist

```
reviewer_model: sonnet
triggered_after: all 6 coder-0-* return status=done

PRISMA:
  [ ] prisma/schema.prisma exists with all models from plan
  [ ] src/lib/prisma.ts uses singleton pattern
  [ ] ZERO raw supabase-js data queries (.from().select() etc.) in any Phase 0 file
  [ ] Dashboard page uses prisma.workspace.count() not supabase-js

AUTH:
  [ ] BetterAuth route at src/app/api/auth/[...all]/route.ts
  [ ] middleware.ts protects /dashboard/* and /(app)/*
  [ ] ZERO supabase.auth.* calls anywhere
  [ ] src/lib/auth.ts uses pg Pool with DATABASE_URL
  [ ] After sign-in: Profile upserted via prisma.profile.upsert()

STORAGE / REALTIME:
  [ ] src/lib/storage.ts uses supabase-js ONLY for .storage.* calls
  [ ] src/lib/realtime.ts uses supabase-js ONLY for .channel() calls
  [ ] Neither file calls .from().select() or .auth.*

ENV VARS:
  [ ] .env.example has all 7 vars including TALION_API_TOKEN
  [ ] No hardcoded secrets

SHADCN:
  [ ] components.json exists with rsc=true
  [ ] src/lib/utils.ts exports cn()
  [ ] All 16 shadcn components exist in src/components/ui/

CONVENTIONS:
  [ ] All imports use @/* alias
  [ ] No 'use client' on pure server components

output_format:
  approved: boolean
  checks_passed: number
  checks_failed: number
  issues: string[]
  fix_instructions: string[]
```

---

## Phase 1 — Core Editor + Pages

### Queen Instructions
```
1. Confirm PHASE_0 approved=true
2. Read Phase 1 block (haiku)
3. Spawn 6 coder agents in parallel
4. Wait for all 6 → collect outputs
5. Spawn reviewer
6. Phase done when approved=true
```

---

#### TASK-1-A · TipTap Editor
```
agent:         coder-1-a
model:         sonnet
parallel_safe: true
depends_on:    [TASK-0-E]

goal: TipTap editor with Markdown, WYSIWYG toggle, code blocks, slash commands.

deliverables:
  talion/src/components/editor/Editor.tsx
  talion/src/components/editor/EditorToolbar.tsx
  talion/src/components/editor/SlashMenu.tsx
  talion/src/components/editor/EditorContent.tsx
  talion/src/lib/editor/extensions.ts
  talion/src/lib/editor/markdown.ts
  talion/src/hooks/use-editor.ts
  talion/src/types/editor.ts

packages:
  @tiptap/react @tiptap/pm @tiptap/starter-kit
  @tiptap/extension-code-block-lowlight @tiptap/extension-placeholder
  @tiptap/extension-typography @tiptap/extension-task-list
  @tiptap/extension-task-item @tiptap/extension-table
  @tiptap/extension-table-row @tiptap/extension-table-header
  @tiptap/extension-table-cell lowlight highlight.js
  pnpm dlx shadcn@latest add command

implementation_notes:
  Editor.tsx ('use client'):
    Props: { content: string, onChange(md: string): void, mode?: 'wysiwyg'|'markdown', readOnly?: bool }
    WYSIWYG mode: TipTap + EditorToolbar
    Markdown mode: plain textarea (font-mono)
    Toggle button top-right

  SlashMenu: trigger "/" → shadcn Command → H1/H2/H3/CodeBlock/BulletList/Table/etc.
  EditorToolbar: shadcn Button variant="ghost" + lucide icons
  EditorContent (read-only): renders content_html with Tailwind prose
  use-editor: wraps TipTap useEditor → { editor, mode, setMode, wordCount, isEmpty }
```

---

#### TASK-1-B · Nested Pages Tree
```
agent:         coder-1-b
model:         sonnet
parallel_safe: true
depends_on:    [TASK-0-B, TASK-0-F]

goal: Nested page tree, drag-and-drop sidebar, breadcrumbs — all via Prisma.

deliverables:
  talion/src/components/pages/PageTree.tsx
  talion/src/components/pages/PageTreeItem.tsx
  talion/src/components/pages/NewPageButton.tsx
  talion/src/components/pages/PageBreadcrumb.tsx
  talion/src/lib/pages.ts
  talion/src/hooks/use-page-tree.ts
  talion/src/types/page.ts
  talion/src/app/api/pages/route.ts           # GET (tree) + POST (create)
  talion/src/app/api/pages/[id]/route.ts      # PATCH + DELETE

packages: @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities swr

implementation_notes:
  pages.ts (uses prisma — NOT supabase-js):
    createPage({ workspaceId, parentId?, title }):
      prisma.page.create(...) — enforce depth ≤ 5 by counting ancestors
    getPageTree(workspaceId):
      prisma.page.findMany({ where: { workspaceId, status: { not: 'archived' } },
                             include: { children: true, tags: { include: { tag: true } } } })
    updatePage(id, updates): prisma.page.update(...)
    deletePage(id): prisma.page.update({ data: { status: 'archived' } })  -- soft delete
    movePage(id, newParentId, newPosition): prisma.page.update(...)

  API routes: auth check via auth.api.getSession() then call pages.ts helpers

  PageTree: recursive, SWR hook, @dnd-kit DndContext + SortableContext
  PageTreeItem: shadcn Collapsible for expand/collapse + DropdownMenu for actions
  PageBreadcrumb: shadcn Breadcrumb, walks parent chain
```

---

#### TASK-1-C · Auto-save + Version History
```
agent:         coder-1-c
model:         sonnet
parallel_safe: true
depends_on:    [TASK-0-B, TASK-1-A]

goal: Debounced auto-save + PageVersion via Prisma + diff view.

deliverables:
  talion/src/hooks/use-autosave.ts
  talion/src/components/editor/SaveStatus.tsx
  talion/src/components/versions/VersionHistory.tsx
  talion/src/components/versions/VersionDiff.tsx
  talion/src/lib/versions.ts
  talion/src/app/api/pages/[id]/versions/route.ts

packages: diff2html

implementation_notes:
  versions.ts (uses prisma):
    createVersion(pageId, authorId, contentMd):
      prisma.pageVersion.create(...)
      then prune: prisma.pageVersion.deleteMany on oldest if count > 50
    getVersions(pageId): prisma.pageVersion.findMany({ orderBy: { createdAt: 'desc' } })
    restoreVersion(pageId, versionId): fetch version, call updatePage with its contentMd

  use-autosave: debounce 1500ms → PATCH /api/pages/[id] → createVersion()
  SaveStatus: Loader2 | Check | AlertCircle — lucide + shadcn Badge
  VersionHistory: shadcn Sheet slide-over
  VersionDiff: diff2html inside shadcn ScrollArea
```

---

#### TASK-1-D · File Uploads
```
agent:         coder-1-d
model:         sonnet
parallel_safe: true
depends_on:    [TASK-0-B]

goal: Drag-and-drop uploads to Supabase Storage, TipTap inline embed.

deliverables:
  talion/src/hooks/use-upload.ts
  talion/src/components/editor/ImageUpload.tsx
  talion/src/app/api/upload/route.ts

packages: pnpm dlx shadcn@latest add progress

implementation_notes:
  /api/upload:
    Auth: auth.api.getSession()
    Parse multipart, validate size ≤ 50MB + MIME type
    Call uploadFile() from @/lib/storage (supabase Storage SDK — correct use)
    Return { url, path, type }

  ImageUpload TipTap extension:
    On drop/paste image → POST /api/upload → insert img node with URL
    shadcn Progress bar during upload

  use-upload: { isUploading, progress, error, url }
  NOTE: storage.ts already set up in TASK-0-B — just import and use it
```

---

#### TASK-1-E · Workspaces CRUD + Switcher
```
agent:         coder-1-e
model:         sonnet
parallel_safe: true
depends_on:    [TASK-0-B, TASK-0-F]

goal: Workspace CRUD via Prisma, switcher in sidebar, settings page.

deliverables:
  talion/src/lib/workspaces.ts
  talion/src/hooks/use-workspaces.ts
  talion/src/contexts/WorkspaceContext.tsx
  talion/src/components/workspace/WorkspaceSwitcher.tsx
  talion/src/components/workspace/CreateWorkspaceDialog.tsx
  talion/src/components/workspace/WorkspaceSettings.tsx
  talion/src/app/(app)/settings/workspace/page.tsx
  talion/src/app/api/workspaces/route.ts
  talion/src/app/api/workspaces/[id]/route.ts

implementation_notes:
  workspaces.ts (uses prisma):
    getUserWorkspaces(userId): prisma.workspace.findMany({ where: { ownerId: userId } })
    createWorkspace({ ownerId, name, slug, visibility }): prisma.workspace.create(...)
    updateWorkspace(id, updates): prisma.workspace.update(...)
    deleteWorkspace(id): prisma.workspace.delete(...)   -- hard delete, cascade handles pages
    generateSlug(name): kebab-case + check uniqueness via prisma.workspace.findUnique

  WorkspaceContext: React context { workspace, setWorkspace }
    Wrap (app)/layout.tsx with WorkspaceProvider
  WorkspaceSwitcher: shadcn Popover + Command
  CreateWorkspaceDialog: shadcn Dialog + Select
  WorkspaceSettings: shadcn Card + AlertDialog for delete
```

---

#### TASK-1-F · Tags System + Filter
```
agent:         coder-1-f
model:         sonnet
parallel_safe: true
depends_on:    [TASK-0-B, TASK-1-B]

goal: Tag system with Prisma, # autocomplete, sidebar AND/OR filter.

deliverables:
  talion/src/lib/tags.ts
  talion/src/hooks/use-tags.ts
  talion/src/components/tags/TagInput.tsx
  talion/src/components/tags/TagBadge.tsx
  talion/src/components/tags/TagFilter.tsx
  talion/src/components/pages/PageList.tsx
  talion/src/app/api/tags/route.ts

implementation_notes:
  tags.ts (uses prisma):
    getWorkspaceTags(workspaceId): prisma.tag.findMany({ where: { workspaceId } })
    createTag({ workspaceId, name, color }): prisma.tag.create(...)
    addTagToPage(pageId, tagId): prisma.pageTag.create(...)
    removeTagFromPage(pageId, tagId): prisma.pageTag.delete(...)
    getPagesWithTags(workspaceId, tagIds, mode: 'AND'|'OR'):
      AND: pages where count of matching page_tags = tagIds.length
      OR:  pages where any page_tag matches

  TagInput: shadcn Command popover, # trigger, creates if no match
  TagBadge: shadcn Badge with dynamic bg color
  TagFilter: toggleable pills + shadcn Switch for AND/OR
  PageList: shadcn Table — icon, title, tags, updated_at
```

---

### Phase 1 Reviewer Checklist

```
reviewer_model: sonnet

PRISMA (most important check):
  [ ] pages.ts uses prisma.page.* for ALL queries — zero supabase-js .from() calls
  [ ] workspaces.ts uses prisma.workspace.*
  [ ] tags.ts uses prisma.tag.* and prisma.pageTag.*
  [ ] versions.ts uses prisma.pageVersion.*
  [ ] deletePage uses prisma.page.update status='archived' (soft delete)

EDITOR:
  [ ] Editor.tsx has content + onChange(md) props
  [ ] SlashMenu uses shadcn Command
  [ ] EditorToolbar uses shadcn Button + lucide only

PAGES:
  [ ] createPage enforces depth ≤ 5 by counting ancestors
  [ ] PageBreadcrumb uses shadcn Breadcrumb
  [ ] DnD uses @dnd-kit only

AUTOSAVE:
  [ ] Debounce exactly 1500ms
  [ ] Prune versions when count > 50

STORAGE:
  [ ] /api/upload uses auth.api.getSession() (BetterAuth)
  [ ] /api/upload calls uploadFile() from @/lib/storage (correct — supabase Storage SDK)

WORKSPACES:
  [ ] WorkspaceContext wraps (app)/layout.tsx
  [ ] deleteWorkspace uses shadcn AlertDialog

TAGS:
  [ ] AND/OR logic in getPagesWithTags()
  [ ] page_tags uses Prisma @@id([pageId, tagId])

INTEGRATION:
  [ ] New API routes use auth.api.getSession() from @/lib/auth
  [ ] shadcn command + progress installed in src/components/ui/

output_format:
  approved: boolean
  checks_passed: number
  checks_failed: number
  issues: string[]
  fix_instructions: string[]
```

---

## Phase 2 — Access Control + Public URLs

### Tasks (summary)
```
TASK-2-A: RLS middleware — SET LOCAL app.user_id per request in Prisma middleware
TASK-2-B: Access groups (prisma.accessGroup.* + prisma.accessGroupMember.*)
TASK-2-C: Share links (prisma.pageAccess.* — token, passwordHash, expiresAt)
TASK-2-D: Public URL routing /[workspace]/[slug] with ISR (generateStaticParams)
TASK-2-E: Public read view — Docs/Blog/Wiki layouts + SEO + OG image
TASK-2-F: Custom domain middleware resolver
TASK-2-G: Full-text search (pg_trgm via Prisma $queryRaw + Cmd+K modal)
TASK-2-H: RSS feed /[workspace]/feed.xml
```

---

## Phase 3 — Theming + Collaboration

### Tasks (summary)
```
TASK-3-A: Per-workspace accent color + font + custom CSS (stored in workspace.theme JSON via Prisma)
TASK-3-B: Dark/light/system mode (next-themes, preference persisted via Prisma profile)
TASK-3-C: Page cover image + emoji icon picker
TASK-3-D: Inline comments (prisma.comment.* + Supabase Realtime for live updates)
TASK-3-E: Activity feed (new Prisma model PageActivity)
TASK-3-F: Wikilinks + backlinks (prisma.pageLink.*) + D3 graph view
```

---

## Phase 4 — AI + Power Features + Obsidian Sync

### Tasks (summary)
```
TASK-4-A: AI summarize + improve (Claude API)
TASK-4-B: AI Q&A over notes (pgvector + Prisma $queryRaw for vector search + Claude API)
TASK-4-C: Obsidian import — one-time vault ingestion (replaces old TASK-4-C)
TASK-4-D: Export to PDF / Markdown / HTML
TASK-4-E: REST API /api/v1 + HMAC webhooks
TASK-4-F: Analytics (new Prisma model PageAnalytic)
TASK-4-G: Obsidian Sync Daemon (talion-sync) — see full spec below
```

---

#### TASK-4-G · Obsidian Sync Daemon (Full Spec)
```
agent:         coder-4-g
model:         sonnet
parallel_safe: false
depends_on:    [TASK-4-C, TASK-4-E]   # needs import logic + REST API

goal: >
  Build talion-sync — a local background daemon that watches an Obsidian vault
  folder and syncs changes bidirectionally with Talion via the REST API.
  Handles conflict detection, last-write-wins resolution, and conflict logging.

structure:
  talion-sync/                        # separate package in monorepo
    package.json
    tsconfig.json
    talion-sync.config.json.example   # user config template
    src/
      index.ts                        # entrypoint — start/stop daemon
      watcher.ts                      # chokidar vault folder watcher
      parser.ts                       # .md file → Talion page schema
      transformer.ts                  # bidirectional content transformation
      conflict.ts                     # conflict detection + resolution
      api.ts                          # Talion REST API client
      sync-engine.ts                  # orchestrates watcher + api + conflict
      logger.ts                       # structured console + file logging
      config.ts                       # load + validate talion-sync.config.json

packages (talion-sync/package.json):
  chokidar        # vault folder watcher (cross-platform)
  gray-matter     # frontmatter parser (Obsidian YAML frontmatter)
  remark          # markdown AST processing
  remark-wiki-link # [[wikilink]] parsing
  md5             # file checksum for change detection
  node-fetch      # REST API calls
  zod             # config validation
  winston         # structured logging
  commander       # CLI interface

config schema (talion-sync.config.json):
  {
    "vaultPath":      "/absolute/path/to/your/obsidian/vault",
    "workspaceId":    "uuid-of-target-talion-workspace",
    "talonUrl":       "http://localhost:3000",
    "apiToken":       "your-TALION_API_TOKEN",
    "syncInterval":   5000,            // ms between poll cycles for remote changes
    "conflictMode":   "last-write-wins",  // last-write-wins | create-conflict-file
    "ignorePaths":    [".obsidian", ".trash", "templates"],
    "logLevel":       "info"
  }

implementation — parser.ts:
  parseVaultFile(filePath: string): VaultFile
    - Read .md file from disk
    - gray-matter to extract YAML frontmatter + body
    - remark + remark-wiki-link to parse [[wikilinks]] → extract link targets
    - Return:
        {
          vaultPath: string,           // relative path from vault root
          title: string,               // frontmatter.title or filename without .md
          contentMd: string,           // raw markdown body
          frontmatter: Record<string, unknown>,
          tags: string[],              // frontmatter.tags array
          wikilinks: string[],         // extracted [[link]] targets
          checksum: string             // md5(contentMd)
        }

implementation — transformer.ts:
  vaultToTalion(vaultFile: VaultFile): Partial<Page>
    - Map title → page.title
    - Map frontmatter.tags → Talion tag names
    - Rewrite [[wikilink]] → Talion internal link format
    - Map frontmatter.aliases → page.frontmatter.aliases
    - Map frontmatter.date → page.createdAt (if present)
    - Map vaultPath → page.vaultPath (stored for reverse sync)

  talionToVault(page: Page): string
    - Reconstruct YAML frontmatter: title, tags, aliases, date
    - Rewrite Talion internal links → [[wikilink]] format
    - Return full .md file string

implementation — conflict.ts:
  ConflictMode: 'last-write-wins' | 'create-conflict-file'

  detectConflict(vaultFile: VaultFile, talonPage: Page): boolean
    - Return true if:
        vaultFile.checksum !== talonPage.obsidianChecksum
        AND talonPage.updatedAt > talonPage.obsidianSyncedAt
        (both sides changed since last sync)

  resolveConflict(mode, vaultFile, talonPage, vaultPath):
    last-write-wins:
      Compare vaultFile.mtimeMs vs talonPage.updatedAt
      Winner overwrites loser
      Log conflict to ObsidianSyncLog via API

    create-conflict-file:
      Keep both: write {basename} (conflict {timestamp}).md alongside original
      Log to ObsidianSyncLog

implementation — sync-engine.ts:
  SyncEngine class:
    constructor(config: TalionSyncConfig)

    start():
      1. Initial full sync: walk vault, compare checksums with /api/v1/pages?vaultPaths=...
         Push new/changed vault files → POST /api/v1/pages or PATCH /api/v1/pages/:id
         Pull new/changed Talion pages → write .md files to vault
      2. Start chokidar watcher (watcher.ts) for vault file events
      3. Start poll interval (config.syncInterval) for remote Talion changes

    onVaultChange(event: 'add'|'change'|'unlink', filePath: string):
      add/change:
        Parse file → check conflict → push to Talion API
        Update page.obsidianChecksum + obsidianSyncedAt via PATCH
      unlink:
        Soft-delete page via PATCH status='archived'

    pollRemoteChanges():
      GET /api/v1/pages?workspaceId=...&updatedAfter={lastPollTime}
      For each changed page:
        If vaultPath set: write talionToVault(page) to vault
        Update local checksum record

implementation — api.ts:
  TalionApiClient class:
    baseUrl: string, apiToken: string

    getPages(params): GET /api/v1/pages
    createPage(data): POST /api/v1/pages
    updatePage(id, data): PATCH /api/v1/pages/:id
    logSync(entry): POST /api/v1/obsidian-sync-log

  All requests: Authorization: Bearer {apiToken} header

implementation — index.ts (CLI):
  Commands:
    talion-sync start    # start daemon, keep process alive
    talion-sync stop     # stop daemon (PID file)
    talion-sync status   # show sync status + last sync time
    talion-sync sync     # run one-time manual sync then exit
    talion-sync init     # interactive setup, writes talion-sync.config.json

  Use commander for CLI parsing
  On SIGTERM/SIGINT: graceful shutdown — finish in-progress sync before exit

Talion API additions needed (add to TASK-4-E scope):
  GET  /api/v1/pages?workspaceId=&vaultPaths=&updatedAfter=
  POST /api/v1/obsidian-sync-log
  The obsidian_sync_log Prisma model already exists in schema

obsidian_sync_log table (already in Prisma schema):
  Used to display sync history in Talion UI (Phase 4 stretch goal)
  Shows: direction, status, conflict details, timestamp per page

Talion UI additions (stretch — same task):
  talion/src/app/(app)/settings/obsidian/page.tsx
    - Connect vault: input for vault path + workspace selection
    - Sync status: last synced, conflicts, total synced pages
    - Uses shadcn Card + Table (from src/components/ui)

edge cases to handle:
  - Attachment files (images in vault): detect, upload to Supabase Storage, rewrite path in MD
  - Circular [[wikilinks]]: detect and skip, log warning
  - Files with same name in different folders: use full vaultPath as unique key
  - Obsidian .obsidian/ folder: always in ignorePaths — never sync
  - Binary files: skip (only sync .md files)
  - Vault rename: detect via old path + new path from chokidar rename event

deliverables:
  talion-sync/package.json
  talion-sync/tsconfig.json
  talion-sync/talion-sync.config.json.example
  talion-sync/src/index.ts
  talion-sync/src/watcher.ts
  talion-sync/src/parser.ts
  talion-sync/src/transformer.ts
  talion-sync/src/conflict.ts
  talion-sync/src/api.ts
  talion-sync/src/sync-engine.ts
  talion-sync/src/logger.ts
  talion-sync/src/config.ts
  talion/src/app/(app)/settings/obsidian/page.tsx    # Talion UI settings page
  talion/src/app/api/v1/obsidian-sync-log/route.ts  # API endpoint for sync log
```

---

## State Tracking Schema

```json
{
  "current_phase": "PHASE_0",
  "phase_status": {
    "PHASE_0": "pending",
    "PHASE_1": "pending",
    "PHASE_2": "pending",
    "PHASE_3": "pending",
    "PHASE_4": "pending"
  },
  "agents": {}
}
```
