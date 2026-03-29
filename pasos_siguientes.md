# Plan de Acción — King Move
> Presupuesto escaso. Prioridad: funcionalidad core sobre cosmética.
> Todo lo que está en "Completado" ya funciona y no tocar.

---

## Estado Actual (Inventario Real)

### ✅ Completado
- Landing page (`/`) con hero, ligas, features
- Layout con Sidebar responsive
- Auth real: login, register, Google OAuth, reset password
- Tabla `profiles` en Supabase con ELO (default 1200)
- Tablero de ajedrez local funcional (chess.js + react-chessboard)
- AI Tutor (`/learn`) con streaming real via OpenRouter / Gemini 2.5 Flash
- UI shells de `/puzzles`, `/watch`, `/social`, `/cash`, `/settings` (datos mock)
- Sidebar muestra usuario logueado con ELO real

### ❌ Sin funcionalidad real
- Botón "Find Opponent" y "PLAY $X" → no hacen nada
- Wallet → mock ($50 hardcodeado)
- Matchmaking → no existe
- ELO no se actualiza al ganar/perder
- Partidas no se guardan
- Leaderboard, puzzles, torneos → todos datos falsos

---

## Áreas de Trabajo

---

### ÁREA 1 — Base de Datos (Supabase)
> Prerequisito para todo lo demás. Sin esto nada funciona.

**Paso 1.1 — Tabla `wallets`**
```sql
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  balance numeric(10,2) default 0 not null,
  updated_at timestamptz default now()
);
alter table public.wallets enable row level security;
-- Solo el dueño ve su wallet
create policy "Owner only" on public.wallets
  for all using (auth.uid() = user_id);
-- Trigger: crear wallet automáticamente cuando se crea perfil
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.wallets (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();
```

**Paso 1.2 — Tabla `games`**
```sql
create table public.games (
  id uuid primary key default gen_random_uuid(),
  player_white uuid references public.profiles(id),
  player_black uuid references public.profiles(id),
  fen_final text,
  pgn text,
  result text check (result in ('white', 'black', 'draw')),
  game_type text default 'free' check (game_type in ('free', 'cash')),
  bet_amount numeric(10,2) default 0,
  time_control text default '10+0',
  status text default 'waiting' check (status in ('waiting', 'active', 'finished', 'aborted')),
  moves jsonb default '[]',
  created_at timestamptz default now(),
  finished_at timestamptz
);
alter table public.games enable row level security;
create policy "Players can view their games"
  on public.games for select
  using (auth.uid() = player_white or auth.uid() = player_black);
create policy "Anyone can view finished games"
  on public.games for select
  using (status = 'finished');
```

**Paso 1.3 — Tabla `transactions`**
```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  type text check (type in ('deposit', 'withdrawal', 'bet_win', 'bet_loss', 'fee')),
  amount numeric(10,2) not null,
  game_id uuid references public.games(id),
  description text,
  created_at timestamptz default now()
);
alter table public.transactions enable row level security;
create policy "Owner only" on public.transactions
  for all using (auth.uid() = user_id);
```

**Paso 1.4 — Función para resolver partida (ELO + wallet)**
```sql
-- Función que se llama al terminar una partida: actualiza ELO y wallet
create or replace function public.resolve_game(
  p_game_id uuid,
  p_result text -- 'white', 'black', 'draw'
) returns void as $$
declare
  v_white_elo int;
  v_black_elo int;
  v_white_id uuid;
  v_black_id uuid;
  v_bet numeric;
  v_elo_change int;
  v_expected float;
begin
  select player_white, player_black, bet_amount
  into v_white_id, v_black_id, v_bet
  from public.games where id = p_game_id;

  select elo into v_white_elo from public.profiles where id = v_white_id;
  select elo into v_black_elo from public.profiles where id = v_black_id;

  -- ELO simple K=32
  v_expected := 1.0 / (1.0 + power(10.0, (v_black_elo - v_white_elo) / 400.0));

  if p_result = 'white' then
    v_elo_change := round(32 * (1 - v_expected));
    update public.profiles set elo = elo + v_elo_change where id = v_white_id;
    update public.profiles set elo = elo - v_elo_change where id = v_black_id;
    -- Wallet: ganador cobra, perdedor pierde (5% fee)
    if v_bet > 0 then
      update public.wallets set balance = balance + (v_bet * 1.95) where user_id = v_white_id;
      update public.wallets set balance = balance - v_bet where user_id = v_black_id;
    end if;
  elsif p_result = 'black' then
    v_elo_change := round(32 * v_expected);
    update public.profiles set elo = elo - v_elo_change where id = v_white_id;
    update public.profiles set elo = elo + v_elo_change where id = v_black_id;
    if v_bet > 0 then
      update public.wallets set balance = balance - v_bet where user_id = v_white_id;
      update public.wallets set balance = balance + (v_bet * 1.95) where user_id = v_black_id;
    end if;
  end if;

  update public.games
  set status = 'finished', result = p_result, finished_at = now()
  where id = p_game_id;
end;
$$ language plpgsql security definer;
```

---

### ÁREA 2 — Partidas Reales (Core MVP)
> El corazón del producto. Sin esto la app no tiene valor.
> Usar **Supabase Realtime** (ya incluido, sin costo extra).

**Paso 2.1 — Hook `useMatchmaking`**
- Crear `src/features/chess-engine/hooks/useMatchmaking.ts`
- Al hacer click en "Find Opponent": insertar fila en `games` con `status='waiting'`
- Suscribirse a Realtime en `games` donde `status='waiting'` y ELO cercano (±200)
- Cuando llega un oponente: actualizar `status='active'`, redirigir a `/game/[id]`

**Paso 2.2 — Página `/game/[id]`**
- Crear `src/app/(main)/game/[id]/page.tsx`
- Cargar partida desde Supabase por ID
- Suscribirse a cambios en `games.moves` via Realtime
- Cada movimiento: insertar en `games.moves` y actualizar FEN
- Al terminar: llamar `resolve_game()` desde el cliente

**Paso 2.3 — Actualizar `/play` para usar matchmaking real**
- Botón "Find Opponent" → llama `useMatchmaking`
- Botón "PLAY $X" → verifica saldo en wallet antes de buscar
- Mostrar estado de búsqueda (spinner, "Buscando oponente...")

**Paso 2.4 — Actualizar store de ajedrez para partidas online**
- Extender `useChessStore` para modo online vs modo local
- En modo online: validar movimientos localmente pero sincronizar via Supabase

---

### ÁREA 3 — Wallet (Balance Real)
> Sin pagos reales todavía. Primero: balance funcional.

**Paso 3.1 — Hook `useWallet`**
- Crear `src/hooks/useWallet.ts`
- Leer balance de `wallets` en tiempo real via Realtime
- Exponer `balance`, `transactions`, `loading`

**Paso 3.2 — Conectar Sidebar y `/play` al balance real**
- Reemplazar `$50.00` hardcodeado en `/play` por `useWallet`
- El botón "PLAY $X" bloquear si `balance < selectedBet`

**Paso 3.3 — Créditos de demostración (sin Stripe)**
- Agregar botón "Get Demo Credits" en wallet
- Server Action que suma $20 al balance (para testing/onboarding)
- Esto permite probar el flujo completo de cash games sin integrar pagos

**Paso 3.4 — Historial de transacciones**
- Sección en `/settings` → Billing que lista `transactions` reales del usuario

---

### ÁREA 4 — Conectar Datos Reales a UI existente
> Las páginas tienen UI lista, solo cambiar mock data por DB.

**Paso 4.1 — Leaderboard real en `/social`**
- Query a `profiles` ordenado por `elo` DESC con LEFT JOIN a `wallets`
- Reemplazar array `leaderboard` hardcodeado
- "Your Stats" → leer del `profile` + `wallets` del usuario logueado

**Paso 4.2 — Historial de partidas en `/social` o `/settings`**
- Query a `games` donde `player_white = user_id OR player_black = user_id`
- Mostrar últimas 10 partidas: oponente, resultado, ELO ganado/perdido

**Paso 4.3 — Settings Profile funcional**
- Formulario para actualizar `full_name` y `avatar_url`
- Ya existe `updateProfile()` server action, solo conectar UI

**Paso 4.4 — ELO real en `/puzzles`**
- Leer ELO del `profile` real en lugar de `1,340` hardcodeado

---

### ÁREA 5 — Puzzles Interactivos
> Feature secundaria pero de alto engagement. Se puede hacer con datos gratuitos.

**Paso 5.1 — Integrar Lichess Puzzle API (gratuita)**
- Lichess tiene API pública de puzzles: `lichess.org/api/puzzle/daily`
- Crear `src/features/puzzles/services/puzzleService.ts`
- Obtener puzzle random + solución

**Paso 5.2 — Tablero de puzzles interactivo**
- Reutilizar `ChessBoardGame` con modo puzzle
- Forzar color del jugador según el puzzle
- Validar secuencia de movimientos contra solución correcta

**Paso 5.3 — Tracker de puzzles resueltos**
- Guardar puzzles resueltos en `profiles` (campo JSONB `puzzles_solved`)
- Mostrar racha y conteo real en lugar de "126 Solved"

---

### ÁREA 6 — Pagos Reales (Última Prioridad)
> Solo cuando el flujo de partidas funcione end-to-end.

**Paso 6.1 — Integrar Polar (ya en el stack de SaaS Factory)**
- Usar skill `add-payments` cuando llegue el momento
- Crear productos: "Deposit $10", "Deposit $25", "Deposit $100"
- Webhook de Polar → suma al balance en `wallets`

**Paso 6.2 — Retiros**
- Formulario de retiro → crea `transaction` con type='withdrawal'
- Procesar manualmente al inicio (transferencia bancaria) hasta tener volumen
- No construir automatización de retiros hasta tener usuarios reales

---

## Orden de Ejecución Recomendado

```
Semana 1:
  [x] Auth + BD base (DONE)
  [ ] Área 1: Crear tablas wallets + games + transactions (2h)
  [ ] Área 3, Paso 3.1-3.3: Wallet hook + créditos demo (2h)

Semana 2:
  [ ] Área 2: Matchmaking + página /game/[id] (el más complejo, 1-2 días)
  [ ] Área 2, Paso 2.3: Botones de /play funcionales

Semana 3:
  [ ] Área 4: Conectar leaderboard, historial, settings (4h)
  [ ] Área 5: Puzzles interactivos con Lichess API (4h)

Cuando haya usuarios reales:
  [ ] Área 6: Pagos con Polar
```

---

## Lo Que NO Hacer Todavía (con presupuesto escaso)

- ❌ Anti-cheat (complejo, costoso, no necesario en MVP)
- ❌ Torneos automatizados (bracket management es complejo)
- ❌ Chat en vivo entre jugadores (puede ser chat de texto simple después)
- ❌ /watch con partidas reales (requiere streaming de tableros en vivo)
- ❌ Mobile app / PWA push notifications
- ❌ Análisis de partidas post-game (motor stockfish server-side = costoso)
- ❌ Sistema de amigos/seguidores

---

## Deuda Técnica a No Ignorar

- `search/page.tsx` → vacía, sin funcionalidad. Dejar para el final.
- `dashboard/page.tsx` → no está en la nav, ignorar.
- `cash/page.tsx` → duplica funcionalidad de `/play`. Unificar o eliminar.
- Remover `SUPABASE_SERVICE_ROLE_KEY=pending` del .env cuando se use.

---

## Resumen Ejecutivo

El proyecto tiene **excelente UI** pero cero lógica de negocio real.
El único paso que genera valor real es **Área 2 (Partidas Reales)**.
Todo lo demás son features secundarias que se pueden hacer en horas.

**Foco total: hacer que dos usuarios puedan jugarse $5 reales entre sí.**
Cuando eso funcione, el resto es decoración.
