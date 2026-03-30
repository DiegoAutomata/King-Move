# Plan de Acción — King Move
> Última actualización: 2026-03-30 (Sesión 4)
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

### 2026-03-30 — Sesión 6: Features Finales — Engagement + Growth
**Completado:**
- ✅ **C.4 Browser notifications**: `requestNotificationPermission()` al entrar al juego; notificación nativa cuando el oponente mueve y la pestaña está en segundo plano; tag único para reemplazar notificación anterior
- ✅ **B.3 Comeback King**: server action `checkComebackKing()` usa Lichess cloud-eval API para detectar si el jugador estaba en posición < -2.0 antes de ganar; trigger en game page al terminar; toast de celebración; API proxy `/api/lichess-eval`
- ✅ **D.1 Análisis post-partida**: página `/game/[id]/analysis` con tablero interactivo, barra de evaluación visual, evaluación de Lichess por posición con cache, navegación por teclado (←→), lista de movimientos clickeable; botón "Analyze" en result overlay
- ✅ **D.2 Torneos básicos**: tablas `tournaments`, `tournament_participants`, `tournament_matches` con RLS; RPCs `join_tournament()`, `start_tournament()` (auto al llegar al cupo), `advance_tournament()` (avanza bracket y distribuye premio); páginas `/tournaments` (lista + crear) y `/tournaments/[id]` (bracket visual + participantes); Tournaments en Sidebar

### 2026-03-30 — Sesión 5: Apertura Pública — Seguridad + Features
**Completado:**
- ✅ **A.2 Validación server-side de movimientos**: Edge Function `submit-move` desplegada en Supabase; valida JWT, verifica turno, valida movimiento con chess.js server-side, actualiza timers atómicamente, llama `resolve_game` si partida termina, escribe PGN; `useOnlineGame.makeMove` ahora usa `supabase.functions.invoke('submit-move')` con rollback optimista
- ✅ **A.3 Rate limiting**: middleware.ts actualizado con rate limiter in-memory: 10 req/min para `/api/chat`, 60 req/min para `/api/puzzle/next`; documentado que requiere Upstash/Redis para escalar
- ✅ **B.4 Search de jugadores**: `/search` ahora funcional con debounce 300ms, búsqueda por nombre/email vía `ilike`, resultados con ELO, liga, nivel, streak; botón "challenge" redirige a `/play`
- ✅ **C.2 PGN estándar**: función SQL `build_pgn_from_moves()` + trigger `trg_auto_build_pgn` que escribe `games.pgn` automáticamente cuando una partida pasa a `finished`; Edge Function también construye PGN directamente
- ✅ **C.3 Avatar upload**: bucket `avatars` en Supabase Storage (público, 2MB, jpg/png/webp); RLS policies para upload/update/delete propios; columna `avatar_url` en `profiles`; Settings tiene upload con preview; Sidebar muestra avatar si existe

### 2026-03-30 — Sesión 4: Beta Cerrada — Seguridad + Calidad
**Completado:**
- ✅ **A.1 Matchmaking timeout**: `pg_cron` habilitado en Supabase; cron job cada minuto que aborta games `waiting` con más de 5 min de antigüedad
- ✅ **B.1 ELO matching ±200**: columna `creator_elo` en `games` + índice; matchmaking filtra por rango ELO al buscar y almacena ELO del creador al crear partida
- ✅ **B.2 Historial de movimientos**: `moves: StoredMove[]` expuesto desde `useOnlineGame`; panel con lista PGN (1. e4 e5 2. Nf3...) en right panel del juego; último movimiento resaltado en amarillo-verde; auto-scroll al último movimiento
- ✅ **C.1 Sentry**: `@sentry/nextjs` instalado; `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` creados; `next.config.ts` envuelto con `withSentryConfig`; variables en `.env.local.example`; activado solo en producción

### 2026-03-30 — Sesión 3: Producción — Fase 1 y 2
**Completado:**
- ✅ **Reloj de tiempo real en `/game/[id]`**: columnas `white_time_ms`, `black_time_ms`, `last_move_at`; trigger DB inicializa timers al activarse la partida; `useGameClock` hook client-side con countdown MM:SS; deducción de tiempo en cada movimiento; rojo pulsante <30s; RPC `flag_timeout` server-side
- ✅ **Forgot Password**: página `/forgot-password` + `ForgotPasswordForm` con confirmación de envío
- ✅ **Reset Password**: página `/update-password` + `UpdatePasswordForm` con toggle visibilidad + validación de coincidencia
- ✅ **Dashboard real** (`/dashboard`): stats reales (W/D/L, win rate, puzzles, logros), barra XP, partidas recientes, quick actions — agregado al Sidebar
- ✅ **Watch page real** (`/watch`): partidas `active` en tiempo real vía Realtime, vacío elegante, botón Spectate
- ✅ **Puzzle Rush** (`/puzzles/rush`): timer 5 min, puzzles en cadena vía Lichess `/api/puzzle/next`, pre-fetch background, XP por solve, pantalla final con rating
- ✅ **Números reales en landing**: Players, Games Played, Puzzles Solved desde BD (muestra "—" si es 0)
- ✅ **AI Tutor verificado**: OPENROUTER_API_KEY presente, `/api/chat` usa Gemini 2.5 Flash correctamente
- ✅ `.env.local.example` documentado con todas las keys necesarias

---

## Estado Actual — Inventario Real

### ✅ Completado y funcionando
- Landing page con stats reales
- Layout con Sidebar responsive (nivel, XP, $KING, Dashboard)
- Auth completa: login, register, Google OAuth, reset password (todos los flows)
- Sistema XP + niveles (1–20), daily login bonus, progression bar
- Tabla `profiles` con ELO, xp, level, token_balance, win_streak, puzzle_count
- Tabla `achievements` con 5 logros activos (falta Comeback King)
- Matchmaking real con Supabase Realtime
- Partidas online en `/game/[id]` con **reloj real** (MM:SS)
- Wallet $KING token (custodial off-chain)
- Leaderboard y historial en `/social`
- Settings: perfil, level/XP, logros (accordion)
- Puzzles interactivos con Lichess API + XP al resolver
- **Puzzle Rush** en `/puzzles/rush` (5 min, puzzles en cadena)
- Watch page con partidas activas reales
- Dashboard con stats reales del jugador
- AI Tutor en `/learn` (Gemini 2.5 Flash via OpenRouter)

### ❌ Pendiente — Ordenado por prioridad

---

## Áreas Pendientes

---

### ÁREA A — Seguridad (alta prioridad para apertura pública)

**A.1 — Race condition en matchmaking ✅ COMPLETADO**
- Timeout automático implementado con pg_cron: cron job cada minuto aborta games `waiting` > 5 min

**A.2 — Validación server-side de movimientos ✅ COMPLETADO**
- Edge Function `submit-move` valida con chess.js server-side; cliente usa `supabase.functions.invoke`

**A.3 — Rate limiting en APIs ✅ COMPLETADO**
- Middleware in-memory: 10 req/min chat, 60 req/min puzzles. Nota: requiere Upstash para multi-instancia

---

### ÁREA B — Features de Engagement

**B.1 — ELO Matching real ✅ COMPLETADO**
- `creator_elo` almacenado al crear game; matchmaking filtra ±200 ELO al buscar oponente

**B.2 — Historial de movimientos en UI del juego ✅ COMPLETADO**
- Panel PGN en right panel del juego; último movimiento resaltado; auto-scroll

**B.3 — Comeback King achievement ✅ COMPLETADO**
- Usa Lichess cloud-eval API; server action post-partida detecta posición ≤ -2.0 → ganó → award

**B.4 — Search de jugadores ✅ COMPLETADO**
- Búsqueda en tiempo real por nombre/email con debounce; muestra ELO, liga, nivel, streak

---

### ÁREA C — Calidad y Operaciones

**C.1 — Error monitoring (Sentry) ✅ COMPLETADO**
- `@sentry/nextjs` instalado; configs creadas; `withSentryConfig` en next.config.ts; activado solo en producción

**C.2 — PGN estándar ✅ COMPLETADO**
- Trigger `trg_auto_build_pgn` escribe `games.pgn` automáticamente al terminar partida

**C.3 — Avatar upload ✅ COMPLETADO**
- Bucket `avatars` + RLS; upload en Settings con preview; Sidebar muestra avatar

**C.4 — Notificaciones browser ✅ COMPLETADO**
- Notification API nativa; se dispara cuando el oponente mueve y document.hidden = true

---

### ÁREA D — Crecimiento (post primeros usuarios)

**D.1 — Análisis post-partida ✅ COMPLETADO**
- `/game/[id]/analysis`: tablero interactivo, barra eval visual, Lichess cloud-eval por posición, nav teclado

**D.2 — Torneos básicos ✅ COMPLETADO**
- DB completa: tournaments + participants + matches + RPCs; UI: lista, crear, bracket visual

**D.3 — Token on-chain ($KING)**
- Aún prematuro. Hacer cuando haya volumen off-chain real.
- ERC-20 o SPL + WalletConnect + bridge custodial↔on-chain

---

## Orden de Ejecución Recomendado

```
Esta semana (lanzamiento beta cerrado): ✅ COMPLETADO
  [x] A.1 Timeout automático de matchmaking (pg_cron cada minuto)
  [x] B.1 ELO matching ±200 en matchmaking (creator_elo column)
  [x] B.2 Historial de movimientos en UI del juego (panel PGN)
  [x] C.1 Sentry para error monitoring (@sentry/nextjs)

Siguiente semana (apertura pública): ✅ COMPLETADO
  [x] A.2 Validación server-side de movimientos (Edge Function submit-move)
  [x] A.3 Rate limiting en APIs (middleware in-memory)
  [x] B.4 Search de jugadores (búsqueda por nombre/email)
  [x] C.2 PGN estándar al terminar partidas (trigger SQL)
  [x] C.3 Avatar upload (Supabase Storage + Settings UI)

Cuando haya usuarios reales: ✅ COMPLETADO (excepto D.3)
  [x] B.3 Comeback King achievement (Lichess cloud-eval)
  [x] C.4 Notificaciones browser
  [x] D.1 Análisis post-partida (/game/[id]/analysis)
  [x] D.2 Torneos básicos (single elimination + $KING prizes)
  [ ] D.3 Token on-chain — PENDIENTE hasta tener volumen real
```

---

## Lo Que NO Hacer Todavía

- ❌ Contrato on-chain (costoso, prematuro sin usuarios)
- ❌ Mobile app / PWA push notifications (la web funciona bien)
- ❌ Análisis server-side con Stockfish (costoso en servidor)
- ❌ Chat en vivo entre jugadores
- ❌ Sistema de amigos/seguidores
- ❌ Pagos fiat (Stripe/Polar) → el modelo es tokens ganados jugando

---

## Deuda Técnica

- `search/page.tsx` → vacía, sin funcionalidad. Dejar para ÁREA B.4
- `dashboard/page.tsx` → implementado ✅ (antes era placeholder)
- `watch/page.tsx` → implementado con partidas reales ✅
- `games.pgn` → campo existe en BD pero nunca se escribe (ÁREA C.2)
- `games.moves` tipo `unknown[]` → mejorar tipado a `StoredMove[]`
- `useWallet.ts` → hook redundante con usePlayerLevel para token_balance, considerar unificar
- `Comeback King` achievement → único logro sin implementar

---

## Arquitectura Actual — Resumen

```
BD (Supabase):
  profiles → id, email, full_name, elo, xp, level, token_balance,
             win_streak, puzzle_count, last_daily_login
  games    → id, player_white, player_black, game_type, bet_amount,
             time_control, status, moves, result, white_time_ms,
             black_time_ms, last_move_at, fen_final, pgn
  transactions → user_id, type, amount, game_id, description
  achievements → user_id, achievement_key, xp_awarded, unlocked_at

RPCs:
  resolve_game(game_id, winner_id)  → ELO + XP + tokens + achievements
  puzzle_solved()                    → +5 XP + puzzle_count + Puzzle Addict
  claim_daily_login_bonus()          → +10 XP (idempotente por día)
  award_xp(user_id, amount)          → suma XP + recalcula nivel
  grant_achievement(user_id, key, xp)→ INSERT achievements + award_xp (idempotente)
  flag_timeout(game_id)              → valida tiempo + resolve_game

Rutas activas:
  / (landing con stats reales)
  /play (Free vs Token, Level 10 lock)
  /game/[id] (tablero online + reloj real)
  /puzzles (daily puzzle + XP)
  /puzzles/rush (Puzzle Rush 5 min)
  /learn (AI Tutor Gemini 2.5 Flash)
  /watch (partidas activas en tiempo real)
  /social (leaderboard + historial)
  /cash (balance $KING + historial)
  /dashboard (stats personales reales)
  /settings (perfil + level + logros)
  /login, /register, /forgot-password, /update-password
```

---

## Resumen Ejecutivo

El producto tiene **loop de engagement completo**:
> Registrarse → jugar gratis → ganar XP → subir niveles → desbloquear token betting → apostar $KING → ganar más tokens

El stack técnico funciona en producción. Las próximas prioridades son **seguridad** (validación server-side de movimientos) y **calidad de experiencia** (ELO matching, historial de movimientos, error monitoring).

**Bloqueador real para escalar: validación server-side de movimientos (A.2).**
Sin esto, cualquier usuario puede manipular el resultado de una partida con tokens.
