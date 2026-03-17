# BUSINESS_LOGIC.md - Chess Factory

> Generado por SaaS Factory | Fecha: 2026-03-16

## 1. Problema de Negocio
**Dolor:** Los jugadores de ajedrez no tienen una plataforma profesional tipo chess.com que integre nativamente la posibilidad de jugar partidas y torneos apostando dinero real de forma segura.
**Costo actual:** Los jugadores que desean monetizar sus habilidades recurren a apuestas informales fuera de plataforma, con alto riesgo de estafas, o a plataformas menos profesionales.

## 2. Solución
**Propuesta de valor:** Una plataforma de ajedrez completa con la estructura y profesionalismo de chess.com (juego, puzzles, aprendizaje), añadiendo una capa de economía real (Modo Cash) donde la gente puede jugar contra otros apostando dinero real de forma segura.

**Flujo principal (Happy Path):**
1. El usuario se registra e inicia sesión.
2. Ingresa a la sección "Jugar por Dinero" (Cash Games).
3. Deposita fondos o usa saldo existente.
4. Crea o acepta un reto por una cantidad específica (ej. $5).
5. Juegan la partida. El ganador recibe automáticamente los fondos (menos un pequeño fee para la plataforma).

## 3. Usuario Objetivo
**Rol:** Jugadores de ajedrez (amateurs a profesionales) competitivos que buscan monetizar su habilidad.
**Contexto:** Acostumbrados a interfaces limpias y rápidas (como chess.com/lichess), necesitan retiros/depósitos instantáneos y un sistema antitrampas robusto.

## 4. Arquitectura de Datos
**Input:**
- Usuarios, Depósitos, Movimientos de Ajedrez (FEN/PGN), Configuración de Partida.

**Output:**
- Actualización de elo/rating, Historial de transacciones, Historial de partidas, Leaderboards.

**Storage (Supabase tables sugeridas):**
- `profiles`: Datos de usuario, elo, avatar.
- `wallets`: Saldo en dinero real para el usuario.
- `games`: Partidas (jugador blanco, jugador negro, apuestas, estado, PGN, resultado).
- `transactions`: Historial de depósitos, retiros y apuestas procesadas.

## 5. KPI de Éxito
**Métrica principal:** Volumen total de apuestas mensuales y DAU (Daily Active Users) en modo Cash.

## 6. Especificación Técnica (Para el Agente)

### Features a Implementar (Feature-First)
```
src/features/
├── auth/           # Autenticación Email/Password (Supabase)
├── chess-engine/   # Integración de tablero, validación de movimientos (chess.js / react-chessboard)
├── cash-games/     # Matchmaking y apuestas
├── wallet/         # Gestión de depósitos y balances (stripe/polar)
└── social/         # Leaderboards y perfil
```

### Stack Confirmado
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 3.4 + shadcn/ui
- **Backend:** Supabase (Auth + Database + Storage)
- **Motor Ajedrez:** react-chessboard y chess.js
- **Validación:** Zod
- **MCPs:** Next.js DevTools + Playwright + Supabase

### Próximos Pasos
1. [x] Setup proyecto base
2. [ ] Construir layout estructural (Sidebar estilo chess.com)
3. [ ] Página de inicio interactiva
4. [ ] Integrar tablero de ajedrez (Mockup)
5. [ ] Diseñar sección de apuestas
