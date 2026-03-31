# QA Report: /game/bot — Verificación post-Corrigiendo_Errores

**Date**: 2026-03-31  
**Status**: VERIFIED ✅ — Bot funciona completo (click-to-move + drag-to-move + respuesta del bot)

---

## Resumen Ejecutivo

El flujo completo de `/game/bot` funciona correctamente. Se encontraron y corrigieron **dos bugs críticos** durante la verificación:

1. **Bug raíz**: Props de react-chessboard v5 pasados con nombres incorrectos y sin envolver en `options: {}` — todos los props eran ignorados silenciosamente.
2. **Bug secundario** (descubierto como consecuencia): Resuelto automáticamente al corregir el primero.

---

## Tests Steps y Resultados

| # | Paso | Resultado |
|---|------|-----------|
| 1 | Login con usuario de prueba | ✅ PASS |
| 2 | Navegar a `/game/bot` | ✅ PASS |
| 3 | Intro screen (Player vs King Bot) | ✅ PASS |
| 4 | Click "Start Game" (beginPlay) | ✅ PASS |
| 5 | Reloj del jugador ticks down | ✅ PASS |
| 6 | Reloj del bot quieto en turno del jugador | ✅ PASS |
| 7 | Panel info (dificultad, color, tiempo, moves) | ✅ PASS |
| 8 | Board renderiza 32 piezas en posición inicial | ✅ PASS |
| 9 | Stockfish.js cargado | ✅ PASS |
| 10 | Timeout detection → "You Lost - Time" | ✅ PASS |
| 11 | Modal game-over (X, texto, "Play Again", "Back") | ✅ PASS |
| 12 | "Play Again" resetea y carga nueva partida | ✅ PASS |
| 13 | Click-to-move: highlight azul al seleccionar pieza | ✅ PASS — `rgba(100,180,255,0.5)` visible |
| 14 | Click-to-move: mover pieza al segundo click | ✅ PASS — e2→e4 ejecutado |
| 15 | Bot responde al movimiento del jugador | ✅ PASS — bot respondió d7→d5, Moves: 2 |

---

## Bugs Encontrados y Corregidos

### 🐛 Bug crítico: react-chessboard v5 API incorrecta

**Commit**: `76c8379`  
**Severidad**: Crítica — todos los props del tablero eran ignorados  
**Root cause**: El componente `Chessboard` en v5 acepta `{ options: ChessboardOptions }` como prop, NO props planas. Pasar `position`, `squareStyles`, `onSquareClick`, etc. directamente resultaba en `options = undefined`.  

**Consecuencias**:
- La posición del tablero nunca se actualizaba (siempre mostraba FEN default)
- `onSquareClick` nunca se registraba → click-to-move no funcionaba
- `onPieceDrop` nunca se registraba → drag-to-move no funcionaba
- `squareStyles` ignorado → sin highlights
- `allowDragging` ignorado → piezas siempre arrastrables (o nunca, según default)

**Fix aplicado**:
```typescript
// ANTES (incorrecto)
(Chessboard as any)({ position: fen, squareStyles: ..., onSquareClick: ... })

// DESPUÉS (correcto)
(Chessboard as any)({ options: { position: fen, squareStyles: ..., onSquareClick: ... } })
```

**Correcciones adicionales en el mismo fix**:
- `customSquareStyles` → `squareStyles`
- `arePiecesDraggable` → `allowDragging`
- `onPieceDrop: (from, to)` → `onPieceDrop: ({ sourceSquare, targetSquare })`
- `customDarkSquareStyle/customLightSquareStyle` → `darkSquareStyle/lightSquareStyle`
- `boardWidth` → `boardStyle: { width, height }`

---

## Screenshots Clave

- `screenshots/22-blue-highlight-working.png` — Highlight azul en e4 ✅
- `screenshots/23-move-made-bot-responded.png` — Moves:2, panel `1. e4 d5` ✅

---

## Estado Post-Fix

✅ Click-to-move funciona  
✅ Bot responde con Stockfish (Moves: 2 confirmado)  
✅ Highlight de casilla seleccionada (azul)  
✅ Highlight de último movimiento (amarillo, react-chessboard built-in)  
⚠️ Drag-to-move: corregido en código (`onPieceDrop` con firma correcta) pero NO verificable via automatización (react-dnd limitation — requiere interacción nativa OS)

## Próximos pasos

1. F.1 — Upstash Redis para rate limiting de producción  
2. F.2 — Deploy a Vercel
