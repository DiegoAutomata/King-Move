---
name: Estado actual del proyecto King Move
description: Resumen del estado de desarrollo, lo completado y lo pendiente al 2026-03-31
type: project
---

## King Move — Chess SaaS Platform

Plataforma de ajedrez con IA, puzzles, cash games y torneos. Feature-complete para apertura pública.

**Why:** El objetivo es tener un MVP listo para lanzar con usuarios reales. El loop de engagement está completo: registro → jugar gratis → ganar XP → niveles → token betting → ganar $KING.

**How to apply:** No agregar features grandes hasta tener los 3 pendientes resueltos (bot estable, Redis, deploy).

---

## Lo completado (Sesiones 1–7)

### BD (Supabase)
- Tablas: `profiles`, `games`, `transactions`, `achievements`, `tournaments`, `tournament_participants`, `tournament_matches`
- Columnas en profiles: `xp`, `level`, `token_balance`, `win_streak`, `puzzle_count`, `last_daily_login`, `avatar_url`, `creator_elo`
- RPCs: `resolve_game`, `puzzle_solved`, `claim_daily_login_bonus`, `award_xp`, `grant_achievement`, `flag_timeout`, `join_tournament`, `start_tournament`, `advance_tournament`
- Trigger: `trg_auto_build_pgn` → escribe `games.pgn` automáticamente
- pg_cron: aborta games `waiting` > 5 min cada minuto
- Edge Function: `submit-move` con validación chess.js server-side + JWT

### Rutas activas
- `/` landing con stats reales
- `/play` Free vs Token Play, Level 10 lock para token games
- `/game/[id]` tablero online + reloj real + PGN panel
- `/game/bot` bot vs Stockfish WASM (E.1 implementado)
- `/game/[id]/analysis` análisis post-partida con eval bar
- `/puzzles` daily puzzle + XP
- `/puzzles/rush` Puzzle Rush 5 min
- `/learn` AI Tutor Gemini 2.5 Flash via OpenRouter
- `/watch` partidas activas en tiempo real
- `/social` leaderboard + historial
- `/cash` balance $KING + historial
- `/dashboard` stats personales reales
- `/settings` perfil + level + logros + avatar upload
- `/tournaments` y `/tournaments/[id]` bracket visual
- `/search` búsqueda de jugadores con debounce

### Features
- Auth completa: email/password + Google OAuth + reset password
- Sistema XP + niveles 1–20 + daily login bonus
- Matchmaking real ELO ±200 + reloj con RPC flag_timeout
- Wallet $KING token custodial off-chain
- Leaderboard, historial, search de jugadores, avatar upload
- Puzzles interactivos vía Lichess API proxied
- Browser notifications cuando oponente mueve en background
- Comeback King achievement (detección via Lichess eval API)
- Sentry instalado, activo solo en producción
- Rate limiting in-memory: 10 req/min chat, 60 req/min puzzles

---

## Pendiente

### E.1 — Bot Stockfish (BLOQUEADOR UX) — EN PROGRESO
- `stockfishEngine.ts` ya implementado con Web Worker UCI
- `public/stockfish.js` (~6MB WASM) ya en el repo
- `useBotGame.ts` ya usa stockfishEngine
- Última sesión (Corrigiendo_Errores): se refactorizó `game/bot/page.tsx` y `useBotGame.ts` para corregir bugs
- **Estado**: Implementado pero con bugs activos que se estaban corrigiendo

### F.1 — Upstash Redis para rate limiting multi-instancia
- El rate limiter actual es in-memory → no escala con múltiples instancias Vercel
- Fix: `@upstash/ratelimit` + `@upstash/redis`
- Costo: plan gratuito cubre hasta 10k req/día

### F.2 — Deploy a producción en Vercel
- Variables de entorno a configurar en Vercel
- Sentry DSN activo en producción
- Dominio personalizado

### D.3 — Token on-chain ($KING) — FUTURO (post >500 usuarios)
- ERC-20 o SPL + WalletConnect + bridge custodial↔on-chain

---

## Deuda técnica
- `games.moves` tipo `unknown[]` → mejorar a `StoredMove[]` (tipo creado en `src/shared/types/storedMove.ts`)
- `useWallet.ts` redundante con `usePlayerLevel` para `token_balance` → considerar unificar
- Rate limiting in-memory no escala (ver F.1)
