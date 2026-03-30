'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Chess } from 'chess.js'
import { stockfishEngine } from '../lib/stockfishEngine'
import type { BotDifficulty } from '../lib/botEngine'

export type BotGameStatus = 'idle' | 'playing' | 'won' | 'lost' | 'draw'

interface MoveRecord {
  san: string
  from: string
  to: string
}

interface BotGameState {
  fen: string
  status: BotGameStatus
  playerColor: 'white' | 'black'
  lastMove: { from: string; to: string } | null
  moves: MoveRecord[]
  isThinking: boolean
  difficulty: BotDifficulty
  resultReason: string | null
}

interface UseBotGameReturn extends BotGameState {
  startGame: (playerColor: 'white' | 'black' | 'random', difficulty: BotDifficulty) => void
  makePlayerMove: (from: string, to: string, promotion?: string) => boolean
  resetGame: () => void
}

function resolveStatus(chess: Chess, playerColor: 'white' | 'black'): { status: BotGameStatus; reason: string | null } {
  if (chess.isCheckmate()) {
    const loser = chess.turn() === 'w' ? 'white' : 'black'
    return { status: loser === playerColor ? 'lost' : 'won', reason: 'Checkmate' }
  }
  if (chess.isStalemate()) return { status: 'draw', reason: 'Stalemate' }
  if (chess.isDraw())      return { status: 'draw', reason: 'Draw' }
  return { status: 'playing', reason: null }
}

export function useBotGame(): UseBotGameReturn {
  const [state, setState] = useState<BotGameState>({
    fen: new Chess().fen(),
    status: 'idle',
    playerColor: 'white',
    lastMove: null,
    moves: [],
    isThinking: false,
    difficulty: 'medium',
    resultReason: null,
  })

  const chessRef  = useRef(new Chess())
  const stateRef  = useRef(state)
  stateRef.current = state

  // Pre-init the engine as soon as the hook mounts
  useEffect(() => {
    stockfishEngine.init().catch(() => {/* ignore init errors */})
    return () => { /* keep engine alive across games; destroy on unmount */ }
  }, [])

  const runBotMove = useCallback(async (
    chess: Chess,
    playerColor: 'white' | 'black',
    difficulty: BotDifficulty,
  ) => {
    setState(prev => ({ ...prev, isThinking: true }))

    const sfMove = await stockfishEngine.getBestMove(chess.fen(), difficulty)

    if (!sfMove) {
      setState(prev => ({ ...prev, isThinking: false }))
      return
    }

    const result = chess.move({
      from: sfMove.from,
      to:   sfMove.to,
      promotion: sfMove.promotion ?? 'q',
    })

    if (!result) {
      setState(prev => ({ ...prev, isThinking: false }))
      return
    }

    const { status, reason } = resolveStatus(chess, playerColor)

    setState(prev => ({
      ...prev,
      fen:         chess.fen(),
      lastMove:    { from: sfMove.from, to: sfMove.to },
      moves:       [...prev.moves, { san: result.san, from: sfMove.from, to: sfMove.to }],
      isThinking:  false,
      status,
      resultReason: reason,
    }))
  }, [])

  const startGame = useCallback((
    colorChoice: 'white' | 'black' | 'random',
    difficulty: BotDifficulty,
  ) => {
    const playerColor = colorChoice === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : colorChoice

    const chess = new Chess()
    chessRef.current = chess

    setState({
      fen: chess.fen(),
      status: 'playing',
      playerColor,
      lastMove: null,
      moves: [],
      isThinking: false,
      difficulty,
      resultReason: null,
    })

    if (playerColor === 'black') {
      runBotMove(chess, playerColor, difficulty)
    }
  }, [runBotMove])

  const makePlayerMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    const { status, isThinking, playerColor, difficulty } = stateRef.current
    const chess = chessRef.current

    if (status !== 'playing' || isThinking) return false

    const isWhiteTurn = chess.turn() === 'w'
    if (playerColor === 'white' && !isWhiteTurn) return false
    if (playerColor === 'black' && isWhiteTurn)  return false

    let result
    try {
      result = chess.move({ from, to, promotion: promotion ?? 'q' })
    } catch {
      return false
    }
    if (!result) return false

    const { status: newStatus, reason } = resolveStatus(chess, playerColor)

    setState(prev => ({
      ...prev,
      fen:          chess.fen(),
      lastMove:     { from, to },
      moves:        [...prev.moves, { san: result.san, from, to }],
      status:       newStatus,
      resultReason: reason,
    }))

    if (newStatus === 'playing') {
      runBotMove(chess, playerColor, difficulty)
    }

    return true
  }, [runBotMove])

  const resetGame = useCallback(() => {
    const chess = new Chess()
    chessRef.current = chess
    setState(prev => ({
      fen: chess.fen(),
      status: 'idle',
      playerColor: prev.playerColor,
      lastMove: null,
      moves: [],
      isThinking: false,
      difficulty: prev.difficulty,
      resultReason: null,
    }))
  }, [])

  return { ...state, startGame, makePlayerMove, resetGame }
}
