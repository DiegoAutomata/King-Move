# Plan de Acción — King Move
> Última actualización: 2026-03-30 (Sesión 7)
> Presupuesto escaso. Prioridad: funcionalidad core sobre cosmética.

---

## Changelog

### 2026-03-29 — Sesión 1
**Completado:**
- ✅ Base de datos: tablas `wallets`, `games`, `transactions` + función `resolve_game()` + demo credits
- ✅ Hook `useWallet` con Supabase Realtime (balance en vivo)
- ✅ Matchmaking con Supabase Realtime (`useMatchmaking`)
- ✅ Partidas online en tiempo real (`useOnlineGame`) + página `/game/[id]`
- ✅ Botones "Find Opponent" y "PLAY $X" funcionales
- ✅ Leaderboard real en `/social` (datos de Supabase)
- ✅ Historial de partidas en `/social`
- ✅ Settings funcional: editar perfil + historial de transacciones
- ✅ ELO real en `/puzzles`
- ✅ Puzzles interactivos con Lichess API (puzzle del día, tablero con validación de movimientos)

### 2026-03-30 — Sesión 2: Sistema XP + Token $KING
**Completado:**
- ✅ BD: columnas `xp`, `level`, `token_balance`, `win_streak` en `profiles`
- ✅ BD: tabla `achievements` con RLS
- ✅ BD: funciones `award_xp()`, `puzzle_solved()`, `claim_daily_login_bonus()`, `grant_achievement()`
- ✅ BD: `resolve_game(game_id, winner_id)` reescrito con XP + win_streak + achievements
- ✅ Hook `usePlayerLevel` con Realtime (xp, level, tokenBalance, canPlayToken)
- ✅ Sidebar: nivel, barra XP, balance $KING en tiempo real
- ✅ Server actions: `awardPuzzleXp()` + `claimDailyLoginBonus()`
- ✅ Puzzle `onSolved` → +5 XP + toast + logro "Puzzle Addict" si llega a 10
- ✅ `DailyLoginBonus` component: +10 XP automático al entrar por primera vez en el día
- ✅ Logros activos: First Blood, ELO Climber, Streak Master, Diamond Hands, Puzzle Addict
- ✅ Página `/play` rediseñada: Free vs Token Play, Level 10 lock, XP rewards info
- ✅ Página `/cash` con balance $KING, historial, cómo ganar tokens
- ✅ Tipos `database.ts` actualizados con todos los campos nuevos

### 2026-03-30 — Sesión 3: Producción — Fase 1 y 2
**Completado:**
- ✅ Reloj de tiempo real en `/game/[id]`: columnas `white_time_ms`, `black_time_ms`, `last_move_at`; trigger DB; `useGameClock`; deducción de tiempo en cada movimiento; rojo pulsante <30s; RPC `flag_timeout`
- ✅ Forgot Password + Reset Password con flows completos
- ✅ Dashboard real (`/dashboard`): stats reales (W/D/L, win rate, puzzles, logros), barra XP, partidas recientes
- ✅ Watch page real (`/watch`): partidas `active` en tiempo real vía Realtime
- ✅ Puzzle Rush (`/puzzles/rush`): timer 5 min, puzzles en cadena vía Lichess, pre-fetch background, XP por solve
- ✅ Números reales en landing: Players, Games Played, Puzzles Solved desde BD
- ✅ AI Tutor verificado: Gemini 2.5 Flash via OpenRouter

### 2026-03-30 — Sesión 4: Beta Cerrada — Seguridad + Calidad
**Completado:**
- ✅ Matchmaking timeout: `pg_cron` cada minuto aborta games `waiting` > 5 min
- ✅ ELO matching ±200: columna `creator_elo` en `games`; matchmaking filtra por rango ELO
- ✅ Historial de movimientos en UI: panel PGN en right panel del juego; último movimiento resaltado; auto-scroll
- ✅ Sentry: `@sentry/nextjs` instalado; configs creadas; activado solo en producción

### 2026-03-30 — Sesión 5: Apertura Pública — Seguridad + Features
**Completado:**
- ✅ Validación server-side de movimientos: Edge Function `submit-move` con chess.js server-side, JWT, timers atómicos, PGN
- ✅ Rate limiting: middleware in-memory 10 req/min `/api/chat`, 60 req/min `/api/puzzle/next`
- ✅ Search de jugadores: búsqueda por nombre/email con debounce 300ms, ELO/liga/nivel/streak
- ✅ PGN estándar: trigger `trg_auto_build_pgn` escribe `games.pgn` automáticamente al terminar
- ✅ Avatar upload: bucket `avatars` + RLS + Settings UI + Sidebar

### 2026-03-30 — Sesión 6: Features Finales — Engagement + Growth
**Completado:**
- ✅ Browser notifications: notificación nativa cuando el oponente mueve y la pestaña está en segundo plano
- ✅ Comeback King: server action con Lichess cloud-eval API detecta posición ≤ -2.0 antes de ganar
- ✅ Análisis post-partida: `/game/[id]/analysis` con tablero interactivo, barra eval visual, nav teclado
- ✅ Torneos básicos: tablas `tournaments`, `tournament_participants`, `tournament_matches` + RPCs + bracket visual

---

## Estado Actual

### ✅ Completado y funcionando
- Auth completa: login, register, Google OAuth, reset password
- Sistema XP + niveles (1–20), daily login bonus
- Matchmaking real + reloj en tiempo real
- Wallet $KING token (custodial off-chain)
- Leaderboard, historial, settings, search de jugadores
- Puzzles interactivos + Puzzle Rush + XP al resolver
- Watch page + Dashboard con stats reales
- AI Tutor (Gemini 2.5 Flash)
- Validación server-side de movimientos (Edge Function)
- Análisis post-partida + Torneos básicos + Sentry

### ❌ Pendiente

---

## Áreas Pendientes

---

### ÁREA E — Bot / Jugar contra el motor (bloqueador UX)

**E.1 — Motor Stockfish.js via Web Worker** ← PRÓXIMA PRIORIDAD

**Problema actual:**
El bot en `/game/bot` usa un minimax propio que corre en el **hilo principal de JS**.
Aunque hay un `setTimeout(..., 50)`, el cálculo minimax bloquea el browser varios segundos en positions complejas, haciendo la UI irresponsable. Además el ELO real máximo del engine custom es ~1500, no los ~1800 que dice la UI.

**Solución: Stockfish.js como Web Worker**
- Stockfish es el motor de ajedrez más fuerte del mundo, compilado a WebAssembly
- Corre en un Web Worker (hilo separado → no bloquea la UI nunca)
- Protocolo UCI: se le manda el FEN, devuelve el mejor movimiento
- `setoption name Skill Level value N` (0–20) → ELO calibrado real:
  - Skill 3 → ~800 ELO (Beginner)
  - Skill 8 → ~1200 ELO (Intermediate)
  - Skill 13 → ~1600 ELO (Advanced)
  - Skill 17 → ~2000 ELO (Expert)
  - Skill 20 → ~2800 ELO (Master)
- Completamente gratuito, sin API key, sin servidor
- Lo usan Lichess, Chess.com, ChessKid — estándar de la industria

**Implementación:**
1. Descargar `stockfish.js` (WASM build) → `/public/stockfish.js`
2. Reemplazar `botEngine.ts` con `StockfishWorker` usando `new Worker('/stockfish.js')`
3. Actualizar `useBotGame.ts` para comunicarse via UCI (async, promesa por movimiento)
4. Mapear las 4 dificultades a Skill Level: easy=3, medium=8, hard=13, expert=17

**Costo:** Archivo ~6MB en `/public/`, carga lazy al entrar a `/game/bot`. 0€/mes.

---

### ÁREA F — Escalabilidad de Producción

**F.1 — Rate limiting con Upstash Redis**
- El rate limiter actual (`middleware.ts`) es in-memory
- Falla con múltiples instancias de Vercel (cada instancia tiene su propio contador)
- Fix: reemplazar con `@upstash/ratelimit` + `@upstash/redis`
- Costo: plan gratuito de Upstash cubre hasta 10k requests/día

**F.2 — Deploy a producción**
- Variables de entorno configuradas en Vercel
- Sentry DSN activo en producción
- Dominio personalizado

---

### ÁREA D — Crecimiento (post primeros usuarios)

**D.3 — Token on-chain ($KING)**
- Prematuro hasta tener volumen off-chain real
- ERC-20 o SPL + WalletConnect + bridge custodial↔on-chain
- Activar cuando: >500 usuarios activos o >10k transacciones off-chain mensuales

---

## Orden de Ejecución Recomendado

```
Inmediato (bloqueador UX):
  [ ] E.1 Motor Stockfish.js via Web Worker en /game/bot

Antes de escalar:
  [ ] F.1 Upstash Redis para rate limiting multi-instancia
  [ ] F.2 Deploy a producción en Vercel

Cuando haya volumen real:
  [ ] D.3 Token on-chain ($KING)
```

---

## Lo Que NO Hacer Todavía

- ❌ Contrato on-chain (costoso, prematuro sin usuarios)
- ❌ Mobile app / PWA push notifications (la web funciona bien)
- ❌ Análisis server-side con Stockfish (costoso en servidor — el cliente es suficiente)
- ❌ Chat en vivo entre jugadores
- ❌ Sistema de amigos/seguidores
- ❌ Pagos fiat (Stripe/Polar) → el modelo es tokens ganados jugando

---

## Deuda Técnica

- `games.moves` tipo `unknown[]` → mejorar tipado a `StoredMove[]`
- `useWallet.ts` redundante con `usePlayerLevel` para `token_balance` → considerar unificar
- Rate limiting in-memory no escala con múltiples instancias Vercel (ver F.1)

---

## Arquitectura Actual — Resumen

```
BD (Supabase):
  profiles → id, email, full_name, elo, xp, level, token_balance,
             win_streak, puzzle_count, last_daily_login, avatar_url
  games    → id, player_white, player_black, game_type, bet_amount,
             time_control, status, moves, result, white_time_ms,
             black_time_ms, last_move_at, fen_final, pgn, creator_elo
  transactions → user_id, type, amount, game_id, description
  achievements → user_id, achievement_key, xp_awarded, unlocked_at
  tournaments / tournament_participants / tournament_matches

RPCs:
  resolve_game(game_id, winner_id)  → ELO + XP + tokens + achievements
  puzzle_solved()                    → +5 XP + puzzle_count + Puzzle Addict
  claim_daily_login_bonus()          → +10 XP (idempotente por día)
  award_xp(user_id, amount)          → suma XP + recalcula nivel
  grant_achievement(user_id, key, xp)→ INSERT achievements + award_xp (idempotente)
  flag_timeout(game_id)              → valida tiempo + resolve_game
  join_tournament() / start_tournament() / advance_tournament()

Edge Functions:
  submit-move                        → validación server-side con chess.js

Rutas activas:
  / (landing con stats reales)
  /play (Free vs Token, Level 10 lock)
  /game/[id] (tablero online + reloj real)
  /game/bot (bot con motor custom — pendiente Stockfish)
  /game/[id]/analysis (análisis post-partida)
  /puzzles (daily puzzle + XP)
  /puzzles/rush (Puzzle Rush 5 min)
  /learn (AI Tutor Gemini 2.5 Flash)
  /watch (partidas activas en tiempo real)
  /social (leaderboard + historial)
  /cash (balance $KING + historial)
  /dashboard (stats personales reales)
  /settings (perfil + level + logros + avatar)
  /tournaments / /tournaments/[id]
  /search (búsqueda de jugadores)
  /login, /register, /forgot-password, /update-password
```

---

## Resumen Ejecutivo

El producto está **feature-complete para apertura pública**. Todas las áreas A-D están completadas.

Loop de engagement funcional:
> Registrarse → jugar gratis → ganar XP → subir niveles → desbloquear token betting → apostar $KING → ganar más tokens

**Único bloqueador UX antes del lanzamiento: E.1 (bot con Stockfish.js).**
El juego contra el bot actualmente bloquea la UI en posiciones complejas por correr en el hilo principal.
El resto está listo para producción.
