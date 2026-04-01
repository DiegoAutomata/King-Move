# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: King Move — Chess SaaS Platform

A chess platform with AI tutoring, puzzle training, cash games, and tournaments. Built on SaaS Factory V4 (Agent-First template).

---

## Commands

```bash
npm run dev          # Dev server with Turbopack (auto-detects port 3000-3006)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint

npx tsc --noEmit     # Type check (no typecheck script exists)

# E2E tests (requires dev server running)
npx playwright test                    # Run all tests
npx playwright test e2e/core.spec.ts  # Run single test file
npx playwright test --ui              # Interactive mode
```

---

## Architecture

**Stack:** Next.js 16 (App Router + Turbopack) · React 19 · TypeScript · Supabase · Tailwind CSS 3.4 · Zustand 5 · Zod · Vercel AI SDK v5 + OpenRouter · chess.js + react-chessboard · Sentry · Playwright

**Feature-first layout:**
```
src/
├── app/
│   ├── (auth)/           # Public: login, signup, forgot-password, callback
│   ├── (main)/           # Protected: dashboard, play, game, puzzles, cash, learn, tournaments, social, watch, settings, search
│   └── api/
│       ├── chat/         # Streaming AI tutor (rate limited: 10 req/min per IP)
│       ├── puzzle/next/  # Lichess puzzle proxy (60 req/min per IP)
│       └── lichess-eval/ # Chess engine evaluation
├── features/[feature]/   # Self-contained: components/, hooks/, services/, store/, types/
├── shared/               # Generic reusable code (no business logic)
│   ├── lib/supabase/     # Supabase client + SSR config
│   ├── stores/           # Global Zustand stores
│   └── hooks/            # useAuth, useWallet, usePlayerLevel
└── actions/              # Server actions: auth.ts, wallet.ts, xp.ts, achievements.ts
```

**Key patterns:**
- Route groups: `(auth)` = public, `(main)` = protected (session checked in middleware)
- `middleware.ts` handles rate limiting + Supabase session refresh for all routes
- Server actions in `src/actions/` for mutations (auth, wallet, XP, achievements)
- Import alias: `@/*` → `./src/*`

---

## Chess-Specific Context

- **chess.js** — move validation, game logic
- **react-chessboard** — board rendering
- **Lichess API** — puzzle source (proxied via `/api/puzzle/next`)
- **Lichess Eval** — engine evaluation via `/api/lichess-eval`
- Game routes: `/game/bot` (vs AI), `/game/[id]` (view), `/game/[id]/analysis`

---

## UI Theme

Dark chess-themed UI with gold accents. Custom Tailwind tokens:
- `bg-chess` (#0a0a0a), `bg-sidebar` (#0d0d0d), `bg-panel` (#111111)
- `primary-chess` (#d4af37 gold), `board-dark` (#b58863), `board-light` (#f0d9b5)
- Shadows: `shadow-gold`, `shadow-gold-lg`
- Global utilities in `globals.css`: `.gold-glow`, `.text-gold-gradient`, `.border-gold-subtle`, `.animate-float`
- shadcn/ui with "new-york" style, Lucide icons

---

## Environment Variables

Required in `.env.local` (see `.env.local.example`):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
OPENROUTER_API_KEY      # AI tutor
NEXT_PUBLIC_SENTRY_DSN  # Error monitoring
SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN
```

---

## Code Rules

- Max 500 lines per file, max 50 lines per function
- Variables/Functions: `camelCase` · Components: `PascalCase` · Files: `kebab-case`
- Never use `any` (use `unknown`)
- Always validate user input with Zod
- Always enable RLS on Supabase tables
- Never expose secrets in code

---

## SaaS Factory Skills

This project uses SaaS Factory V4. Available skills (invoke with `/skill-name`):

| Skill | When to use |
|-------|-------------|
| `prp` | Plan complex feature before implementing |
| `bucle-agentico` | Multi-phase feature implementation (DB + API + UI) |
| `supabase` | DB tables, RLS, migrations, queries, metrics |
| `playwright-cli` | Automated browser testing |
| `ai` | Add AI capabilities (chat/RAG/vision/tools) |
| `add-payments` | Polar checkout + webhooks |
| `add-emails` | Resend + React Email |
| `add-mobile` | PWA + push notifications |
| `memory-manager` | Persistent project memory in `.claude/memory/` |
| `image-generation` | Generate images with OpenRouter + Gemini |

**Workflow for complex features:** `prp` → user approves → `bucle-agentico` → `playwright-cli`

---

## MCPs Available

- **Next.js DevTools** (`/_next/mcp`) — build/runtime errors in real time
- **Supabase MCP** — `execute_sql`, `apply_migration`, `list_tables`, `get_advisors`
- **Playwright MCP** — browser automation for UI testing

---

## Aprendizajes (Auto-Blindaje)

### 2025-01-09: Usar `npm run dev`, no `next dev`
- Puerto hardcodeado causa conflictos. `npm run dev` auto-detecta.

### 2026-03-30: No existe `npm run typecheck`
- El script no está en package.json. Usar `npx tsc --noEmit` para type check.

### 2026-03-31: react-chessboard v5 — API `options: {}` no props planas
- **Error**: Pasar props directamente a `<Chessboard position={fen} squareStyles={...} />` hace que TODOS sean ignorados.
- **Fix**: La v5 acepta `<Chessboard options={{ position, squareStyles, onSquareClick, ... }} />` — todo va dentro de `options`.
- **Props renombradas en v5**: `customSquareStyles` → `squareStyles`, `arePiecesDraggable` → `allowDragging`, `customDarkSquareStyle` → `darkSquareStyle`, `boardWidth` → `boardStyle: { width, height }`.
- **`onPieceDrop` firma v5**: recibe `{ piece, sourceSquare, targetSquare }` no `(from, to)`.
- **Aplicar en**: Cualquier uso de `react-chessboard` en este proyecto.
