---
name: Arquitectura y stack del proyecto King Move
description: Stack técnico, estructura de archivos, patrones clave y variables de entorno
type: project
---

## Stack

- **Framework**: Next.js 16 + React 19 + TypeScript (App Router + Turbopack)
- **Estilos**: Tailwind CSS 3.4, tema oscuro con dorado `#d4af37`
- **Backend**: Supabase (Auth + PostgreSQL + RLS + Realtime + Storage + Edge Functions)
- **IA**: Vercel AI SDK v5 + OpenRouter → Gemini 2.5 Flash (tutor)
- **Ajedrez**: chess.js (lógica) + react-chessboard (UI) + Stockfish WASM (motor bot)
- **Estado**: Zustand 5
- **Validación**: Zod
- **Testing**: Playwright
- **Monitoring**: Sentry (solo producción)

**Why:** Stack fijo de SaaS Factory V4. No hay decisiones técnicas que tomar.

**How to apply:** Siempre usar este stack. No proponer alternativas.

---

## Estructura de archivos clave

```
src/
├── app/
│   ├── (auth)/          # login, register, forgot-password, update-password, callback
│   ├── (main)/          # rutas protegidas con sidebar
│   └── api/
│       ├── chat/        # AI tutor streaming (rate limited 10 req/min)
│       ├── puzzle/next/ # Lichess puzzle proxy (60 req/min)
│       └── lichess-eval/ # Engine eval proxy
├── features/
│   ├── auth/
│   ├── chess-engine/
│   │   ├── hooks/useBotGame.ts      # Hook principal partida vs bot
│   │   ├── hooks/useMatchmaking.ts  # Emparejamiento online
│   │   ├── hooks/useOnlineGame.ts   # Partida online en tiempo real
│   │   ├── lib/stockfishEngine.ts   # Web Worker UCI wrapper
│   │   └── lib/botEngine.ts         # Motor minimax legacy (reemplazado)
│   ├── dashboard/
│   └── puzzles/
│       └── hooks/usePuzzle.ts
├── shared/
│   ├── lib/supabase/     # client.ts, server.ts
│   ├── stores/           # Zustand global stores
│   ├── hooks/            # useAuth, useWallet, usePlayerLevel
│   └── types/storedMove.ts
├── actions/              # Server actions: auth.ts, wallet.ts, xp.ts, achievements.ts, analyzeGame.ts, reportPlayer.ts
└── types/database.ts     # Tipos generados de Supabase
```

---

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
OPENROUTER_API_KEY        # AI tutor Gemini 2.5 Flash
NEXT_PUBLIC_SENTRY_DSN    # Solo en producción
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
```

---

## Patrones clave

- `middleware.ts`: rate limiting in-memory + refresh de sesión Supabase
- Route groups: `(auth)` = público, `(main)` = protegido con sidebar
- Server actions en `src/actions/` para mutations
- Supabase Realtime para matchmaking, reloj y watch page
- Alias de import: `@/*` → `./src/*`
- Comando type check: `npx tsc --noEmit` (NO existe `npm run typecheck`)

---

## UI Theme

Dark chess-themed, colores:
- `bg-chess` #0a0a0a · `bg-sidebar` #0d0d0d · `bg-panel` #111111
- `primary-chess` #d4af37 (gold) · `board-dark` #b58863 · `board-light` #f0d9b5
- Clases globales: `.gold-glow`, `.text-gold-gradient`, `.border-gold-subtle`, `.animate-float`
- shadcn/ui "new-york" style + Lucide icons
