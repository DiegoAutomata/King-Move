# Plan de Acción: Plataforma de Ajedrez con Apuestas y Tutor IA (SaaS Factory V4)

Este documento detalla el plan paso a paso (To-Do List) para construir la aplicación de ajedrez inspirada en la interfaz de chess.com, pero incorporando una economía real (matchmaking con apuestas) y un tutor basado en Inteligencia Artificial.

## Fase 1: Setup y Configuración Base
- [ ] Verificar entorno Next.js 16, React 19, Tailwind CSS 3.4 y TypeScript.
- [ ] Configurar variables de entorno iniciales (`.env.local`).
- [ ] Instalar dependencias faltantes: Zustand (estado global), Zod (validación), y shadcn/ui.
- [ ] Implementar un Design System oscuro inspirado en chess.com (Fondo Deep Dark Gray #262421, Brand Green #81b64c).

## Fase 2: Autenticación y Perfiles (Supabase)
- [ ] Configurar el cliente de Supabase SSR.
- [ ] Implementar flujo de Login/Registro (Email/Password).
- [ ] Crear la tabla `profiles` en Supabase (id, username, elo, avatar_url).
- [ ] Sincronizar la creación del usuario en Auth con un trigger automático hacia `profiles`.

## Fase 3: UI/UX - Layout Principal (Estilo Chess.com)
- [ ] Construir un layout persistente con **Sidebar Izquierdo**.
- [ ] Crear la Navegación Principal: Jugar, Aprender (Tutor IA), Perfil, Wallet.
- [ ] Maquetar la página de inicio (Hero Section) enfocada en la conversión y modos de juego.

## Fase 4: Integración del Motor de Ajedrez
- [ ] Instalar y configurar `chess.js` (lógica del juego) y `react-chessboard` (interfaz visual del tablero).
- [ ] Crear componente principal reutilizable `<ChessBoardGame />`.
- [ ] Implementar gestión de estado del juego (Zustand) para manejar el FEN, PGN, turnos y reloj temporal.

## Fase 5: Economía y Billetera (Modo Cash)
- [ ] Crear tabla `wallets` en Supabase vinculada por RLS a cada usuario.
- [ ] Crear tabla `transactions` (depósitos, retiros e ingresos por partidas ganadas).
- [ ] Interfaz de "Mi Billetera": botón para simular fondo inicial o depósito.
- [ ] Funciones del Edge/Backend para validar fondos suficientes antes de entrar a un match.

## Fase 6: Matchmaking con Apuestas Reales
- [ ] Crear tabla `games` (white_id, black_id, bet_amount, status, pgn, winner_id).
- [ ] UI de "Crear Reto": el usuario selecciona el tiempo de partida y el monto a apostar (ej. $5).
- [ ] Sala de Espera (Lobby) para que otros acepten el reto.
- [ ] **Lógica Crítica:** Al finalizar la partida (Jaque Mate, Rendición o Tiempo), deducir los fondos del perdedor y acreditarlos al ganador automáticamente (RPC o Edge Function de Supabase).

## Fase 7: Tutor IA (Vercel AI SDK v5 + OpenRouter)
- [ ] Configurar AI SDK con el proveedor OpenRouter.
- [ ] Crear interfaz de "Análisis/Tutor": el usuario puede pegar un PGN o estar en medio de una partida de práctica.
- [ ] Injectar el estado del tablero (FEN) y el nivel del usuario en el prompt del sistema.
- [ ] El modelo enseñará posibles jugadas o errores desde una perspectiva adaptada al nivel de ELO del jugador (explicaciones simples para novatos, cálculo de variantes profundas para avanzados).

## Fase 8: Automatización y QA
- [ ] Configurar Playwright.
- [ ] Escribir test e2e del Flujo Principal: Registro -> Hacer depósito mock -> Crear Partida de Apuesta.
- [ ] Debug en tiempo real ante errores de consola (Auto-Blindaje).
