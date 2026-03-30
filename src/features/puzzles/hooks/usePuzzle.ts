'use client'

import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { LichessPuzzle, PuzzleState } from '../types'

// Convierte movimiento UCI (e.g. "e2e4", "e7e8q") a { from, to, promotion }
function parseUci(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length === 5 ? uci[4] : undefined,
  }
}

interface UsePuzzleReturn extends PuzzleState {
  tryMove: (from: string, to: string, promotion?: string) => 'correct' | 'wrong' | 'solved' | 'not_your_turn'
  loadPuzzle: (puzzle: LichessPuzzle) => void
  resetPuzzle: () => void
}

export function usePuzzle(): UsePuzzleReturn {
  const [state, setState] = useState<PuzzleState | null>(null)
  const [currentPuzzle, setCurrentPuzzle] = useState<LichessPuzzle | null>(null)

  const initState = useCallback((puzzle: LichessPuzzle): PuzzleState => {
    const chess = new Chess(puzzle.fen)

    // El primer movimiento de moves[] es del oponente — lo aplicamos
    const opponentUci = puzzle.moves[0]
    const { from, to, promotion } = parseUci(opponentUci)
    chess.move({ from, to, promotion })

    // El turno ahora es del jugador
    const playerColor = chess.turn() === 'w' ? 'white' : 'black'

    return {
      puzzle,
      boardFen: chess.fen(),
      playerColor,
      solutionIndex: 1, // siguiente movimiento esperado del jugador
      status: 'playing',
      lastMove: { from, to },
      wrongAttempt: null,
    }
  }, [])

  const loadPuzzle = useCallback((puzzle: LichessPuzzle) => {
    setCurrentPuzzle(puzzle)
    setState(initState(puzzle))
  }, [initState])

  const resetPuzzle = useCallback(() => {
    if (currentPuzzle) setState(initState(currentPuzzle))
  }, [currentPuzzle, initState])

  const tryMove = useCallback((from: string, to: string, promotion?: string): 'correct' | 'wrong' | 'solved' | 'not_your_turn' => {
    if (!state || state.status !== 'playing') return 'not_your_turn'

    const expectedUci = state.puzzle.moves[state.solutionIndex]
    const expected = parseUci(expectedUci)
    const uci = `${from}${to}${promotion ?? ''}`
    const expectedUciNorm = `${expected.from}${expected.to}${expected.promotion ?? ''}`

    if (uci !== expectedUciNorm && `${from}${to}` !== `${expected.from}${expected.to}`) {
      // Movimiento incorrecto — parpadeo y reset posición
      setState(prev => prev ? { ...prev, status: 'wrong', wrongAttempt: { from, to } } : prev)
      setTimeout(() => {
        setState(prev => prev ? { ...prev, status: 'playing', wrongAttempt: null } : prev)
      }, 800)
      return 'wrong'
    }

    // Movimiento correcto — aplicar al tablero
    const chess = new Chess(state.boardFen)
    chess.move({ from: expected.from, to: expected.to, promotion: expected.promotion ?? 'q' })
    const nextIndex = state.solutionIndex + 1

    // ¿Era el último movimiento del jugador?
    const isSolved = nextIndex >= state.puzzle.moves.length

    if (isSolved) {
      setState(prev => prev ? {
        ...prev,
        boardFen: chess.fen(),
        solutionIndex: nextIndex,
        status: 'solved',
        lastMove: { from: expected.from, to: expected.to },
        wrongAttempt: null,
      } : prev)
      return 'solved'
    }

    // Siguiente movimiento es del oponente — aplicarlo automáticamente después de 500ms
    const opponentUci = state.puzzle.moves[nextIndex]
    const opp = parseUci(opponentUci)

    setState(prev => prev ? {
      ...prev,
      boardFen: chess.fen(),
      solutionIndex: nextIndex,
      status: 'correct',
      lastMove: { from: expected.from, to: expected.to },
      wrongAttempt: null,
    } : prev)

    // Aplicar respuesta del oponente
    setTimeout(() => {
      chess.move({ from: opp.from, to: opp.to, promotion: opp.promotion ?? 'q' })
      setState(prev => prev ? {
        ...prev,
        boardFen: chess.fen(),
        solutionIndex: nextIndex + 1,
        status: 'playing',
        lastMove: { from: opp.from, to: opp.to },
      } : prev)
    }, 600)

    return 'correct'
  }, [state])

  // Fallback state si no hay puzzle cargado
  const fallback: PuzzleState = {
    puzzle: { id: '', fen: 'start', moves: [], rating: 0, themes: [], initialPly: 0 },
    boardFen: 'start',
    playerColor: 'white',
    solutionIndex: 0,
    status: 'playing',
    lastMove: null,
    wrongAttempt: null,
  }

  return {
    ...(state ?? fallback),
    tryMove,
    loadPuzzle,
    resetPuzzle,
  }
}
