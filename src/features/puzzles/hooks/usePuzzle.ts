'use client'

import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { LichessPuzzle, PuzzleState } from '../types'

// Aplica un movimiento UCI buscando entre los movimientos legales del tablero.
// Maneja correctamente enroque, en passant y promociones sin lanzar excepciones.
function applyUciMove(chess: Chess, uci: string): { from: string; to: string } | null {
  const from = uci.slice(0, 2)
  const to   = uci.slice(2, 4)
  const promotion = uci.length === 5 ? uci[4] : undefined

  const legal = chess.moves({ verbose: true }).find(
    m => m.from === from && m.to === to && (!promotion || m.promotion === promotion)
  )
  if (!legal) return null

  chess.move(legal)
  return { from: legal.from, to: legal.to }
}

// Solo parsea UCI a partes (sin aplicar el movimiento)
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

  const initState = useCallback((puzzle: LichessPuzzle): PuzzleState | null => {
    const chess = new Chess(puzzle.fen)

    // El primer movimiento de moves[] es del oponente — lo aplicamos
    const opponentUci = puzzle.moves[0]
    const result = applyUciMove(chess, opponentUci)

    // Puzzle con movimiento inicial ilegal — señalizar para saltar
    if (!result) return null

    const playerColor = chess.turn() === 'w' ? 'white' : 'black'

    return {
      puzzle,
      boardFen: chess.fen(),
      playerColor,
      solutionIndex: 1,
      status: 'playing',
      lastMove: result,
      wrongAttempt: null,
    }
  }, [])

  const loadPuzzle = useCallback((puzzle: LichessPuzzle) => {
    setCurrentPuzzle(puzzle)
    const s = initState(puzzle)
    if (s) setState(s)
  }, [initState])

  const resetPuzzle = useCallback(() => {
    if (currentPuzzle) {
      const s = initState(currentPuzzle)
      if (s) setState(s)
    }
  }, [currentPuzzle, initState])

  const tryMove = useCallback((from: string, to: string, promotion?: string): 'correct' | 'wrong' | 'solved' | 'not_your_turn' => {
    if (!state || state.status !== 'playing') return 'not_your_turn'

    const expectedUci = state.puzzle.moves[state.solutionIndex]
    const expected = parseUci(expectedUci)
    const uci = `${from}${to}${promotion ?? ''}`
    const expectedUciNorm = `${expected.from}${expected.to}${expected.promotion ?? ''}`

    if (uci !== expectedUciNorm && `${from}${to}` !== `${expected.from}${expected.to}`) {
      setState(prev => prev ? { ...prev, status: 'wrong', wrongAttempt: { from, to } } : prev)
      setTimeout(() => {
        setState(prev => prev ? { ...prev, status: 'playing', wrongAttempt: null } : prev)
      }, 800)
      return 'wrong'
    }

    // Movimiento correcto — aplicar al tablero usando movimientos legales
    const chess = new Chess(state.boardFen)
    const moved = applyUciMove(chess, expectedUci)
    if (!moved) return 'wrong'

    const nextIndex = state.solutionIndex + 1
    const isSolved = nextIndex >= state.puzzle.moves.length

    if (isSolved) {
      setState(prev => prev ? {
        ...prev,
        boardFen: chess.fen(),
        solutionIndex: nextIndex,
        status: 'solved',
        lastMove: moved,
        wrongAttempt: null,
      } : prev)
      return 'solved'
    }

    // Siguiente movimiento es del oponente — aplicarlo automáticamente
    const opponentUci = state.puzzle.moves[nextIndex]

    setState(prev => prev ? {
      ...prev,
      boardFen: chess.fen(),
      solutionIndex: nextIndex,
      status: 'correct',
      lastMove: moved,
      wrongAttempt: null,
    } : prev)

    setTimeout(() => {
      const oppResult = applyUciMove(chess, opponentUci)
      if (!oppResult) return
      setState(prev => prev ? {
        ...prev,
        boardFen: chess.fen(),
        solutionIndex: nextIndex + 1,
        status: 'playing',
        lastMove: oppResult,
      } : prev)
    }, 600)

    return 'correct'
  }, [state])

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
