---
name: Estado actual del proyecto King Move
description: Qué está hecho, qué está pendiente, URLs de producción y Vercel al 2026-03-31
type: project
---

## King Move — Estado 2026-03-31

**Why:** Plataforma de ajedrez con IA, puzzles, torneos y tokens $KING. SaaS en producción.

**How to apply:** Referencia para saber qué existe y qué queda por hacer antes de agregar features.

---

## URLs

- **Producción**: https://proyecto-ajedrez-five.vercel.app
- **Vercel project**: diegolezs-projects/proyecto-ajedrez
- **GitHub**: https://github.com/DiegoAutomata/King-Move
- **Supabase**: https://qxgdljstlhzcavwvrlfd.supabase.co

---

## Stack

Next.js 16 · React 19 · TypeScript · Supabase · Tailwind CSS 3.4 · Zustand 5 · chess.js · react-chessboard v5 · Stockfish WASM · Vercel AI SDK v5 + OpenRouter · Sentry · Playwright

---

## Features implementadas ✅

### Auth
- Email/Password login + signup · Google OAuth · Password reset
- Profile con ELO (1200 base), nivel, nombre

### Juego vs Bot (`/game/bot`)
- Stockfish WASM (UCI, depth 1-4)
- Click-to-move (highlight azul) + drag-to-move ✅ FIXED 2026-03-31
- Clocks con countdown · Timeout detection · Panel de movimientos (SAN)
- Play Again / New Game · 4 dificultades

### Puzzles (`/puzzles`)
- Lichess API proxy · Puzzle Rush mode · XP por puzzles

### AI Tutor (`/learn`)
- Chat streaming con OpenRouter · Rate limited: 10 req/min per IP

### Sistema de XP/Niveles
- XP por movidas, puzzles, logros · Niveles progresivos

### Torneos (`/tournaments`)
- Lista y detalle · Brackets

### Tablero de análisis (`/game/[id]/analysis`)
- Stockfish eval vía `/api/lichess-eval`

### Rate Limiting
- In-memory fallback (dev/staging)
- Upstash Redis cuando hay env vars (prod) — código listo, falta configurar

### Observabilidad
- Sentry (solo en producción, `enabled: NODE_ENV === "production"`)

---

## Env vars de producción en Vercel

- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `OPENROUTER_API_KEY` ✅
- `NEXT_PUBLIC_SITE_URL` = `https://proyecto-ajedrez-five.vercel.app` ✅
- `UPSTASH_REDIS_REST_URL` ❌ pendiente (rate limiting real en prod)
- `UPSTASH_REDIS_REST_TOKEN` ❌ pendiente
- `NEXT_PUBLIC_SENTRY_DSN` ❌ pendiente (opcional)

---

## Configuración pendiente en servicios externos

- **Supabase**: Agregar `https://proyecto-ajedrez-five.vercel.app/callback` en Auth > URL Configuration (para OAuth y password reset en producción)
- **Upstash**: Crear DB en console.upstash.com → agregar env vars en Vercel

---

## Features no implementadas

- Matchmaking jugador vs jugador
- $KING token real (gamificación actual es cosmética)
- Pagos con Polar
- PWA / notificaciones push
- Social: amigos, mensajes
- Watch: partidas en vivo
