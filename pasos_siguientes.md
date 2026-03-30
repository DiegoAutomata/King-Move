# Plan de Acción — King Move
> Última actualización: 2026-03-30
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

**A.1 — Race condition en matchmaking (parcialmente OK)**
- El código ya usa `update ... where status='waiting' and player_black=null` (atómico a nivel Postgres)
- Lo que falta: timeout automático si nadie se une en 5 min → marcar game como `aborted`
- Implementar: cron job en Supabase o Edge Function que limpie games `waiting` > 5 min

**A.2 — Validación server-side de movimientos**
- Hoy los movimientos se validan solo en el cliente con chess.js
- Un usuario malicioso puede enviar movimientos inválidos directamente a Supabase
- Solución: crear Edge Function `POST /functions/v1/submit-move` que valide con chess.js server-side
- La tabla `games.moves` solo se escribe desde esta función (revocar permisos directos)

**A.3 — Rate limiting en APIs**
- `/api/chat` y `/api/puzzle/next` son públicas sin rate limiting
- Agregar `@upstash/ratelimit` o middleware de Vercel para limitar requests por IP/usuario

---

### ÁREA B — Features de Engagement

**B.1 — ELO Matching real**
- El matchmaking actual acepta cualquier oponente sin filtro de ELO
- Implementar: buscar games en rango ±200 ELO, expandir ±50 cada 30 seg de espera
- Evitar que un principiante (800 ELO) juegue contra un experto (2000 ELO)

**B.2 — Historial de movimientos en UI del juego**
- La partida muestra solo el tablero, sin historial de movimientos
- Los movimientos ya se guardan en `games.moves[]` con SAN notation
- Agregar panel lateral con la lista de movimientos: `1. e4 e5 2. Nf3 Nc6...`
- Resaltar el movimiento actual, poder hacer click para retroceder (modo espectador)

**B.3 — Comeback King achievement**
- El único logro no implementado: "ganar desde posición perdedora"
- Requiere análisis de evaluación de posición durante la partida (Stockfish)
- Detectar: evaluación < -2.0 (perdiendo) → luego gana → award achievement
- Stockfish.js en browser es viable (sin costo de servidor)

**B.4 — Search de jugadores**
- `/search` está vacía sin funcionalidad
- Buscar jugadores por nombre/username
- Ver perfil público: ELO, logros, win rate, historial reciente

---

### ÁREA C — Calidad y Operaciones

**C.1 — Error monitoring (Sentry)**
- Sin monitoring, los bugs en producción son invisibles
- Instalar `@sentry/nextjs`, configurar `SENTRY_DSN`
- Capturar errores en server actions, API routes, y client-side

**C.2 — PGN estándar**
- Los movimientos se guardan como array JSON (from/to/san) pero no como PGN estándar
- El campo `games.pgn` existe pero no se escribe
- Construir el PGN al terminar la partida y guardarlo
- Permite: análisis post-partida, exportar, análisis con engines externos

**C.3 — Avatar upload**
- Settings solo permite cambiar nombre
- Supabase Storage bucket `avatars` + input de archivo en Settings
- Mostrar avatar en Sidebar, partidas, leaderboard

**C.4 — Notificaciones browser**
- Cuando el oponente hace un movimiento y la pestaña no está en foco → notificación browser
- `Notification API` nativa (sin PWA requerida)
- "Magnus hizo un movimiento en tu partida"

---

### ÁREA D — Crecimiento (post primeros usuarios)

**D.1 — Análisis post-partida**
- Ver la partida movimiento a movimiento después de terminar
- Integrar Stockfish.js (browser, sin costo servidor)
- Mostrar evaluación de cada posición (+1.2, -0.8, etc.)

**D.2 — Torneos básicos**
- Sistema de brackets: 8 o 16 jugadores
- Premio en $KING tokens al ganador
- Tabla de posiciones durante el torneo

**D.3 — Token on-chain ($KING)**
- Solo cuando el modelo funcione off-chain y haya volumen real
- Desplegar contrato ERC-20 o SPL token
- Integrar WalletConnect / MetaMask
- Bridge entre balance custodial y on-chain

---

## Orden de Ejecución Recomendado

```
Esta semana (lanzamiento beta cerrado):
  [ ] A.1 Timeout automático de matchmaking (Supabase cron)
  [ ] B.1 ELO matching ±200 en matchmaking
  [ ] B.2 Historial de movimientos en UI del juego
  [ ] C.1 Sentry para error monitoring

Siguiente semana (apertura pública):
  [ ] A.2 Validación server-side de movimientos (Edge Function)
  [ ] A.3 Rate limiting en APIs
  [ ] B.4 Search de jugadores
  [ ] C.2 PGN estándar al terminar partidas
  [ ] C.3 Avatar upload

Cuando haya usuarios reales:
  [ ] B.3 Comeback King achievement (Stockfish.js)
  [ ] C.4 Notificaciones browser
  [ ] D.1 Análisis post-partida
  [ ] D.2 Torneos básicos
  [ ] D.3 Token on-chain
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
