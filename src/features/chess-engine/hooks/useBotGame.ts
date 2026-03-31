'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Chess } from 'chess.js'
import { stockfishEngine } from '../lib/stockfishEngine'
import type { BotDifficulty } from '../lib/botEngine'

export type BotGameStatus = 'idle' | 'intro' | 'playing' | 'won' | 'lost' | 'draw'

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
  whiteTimeMs: number | null
  blackTimeMs: number | null
}

interface UseBotGameReturn extends BotGameState {
  startGame: (colorChoice: 'white' | 'black' | 'random', difficulty: BotDifficulty, timeLimitMs?: number) => void
  beginPlay: () => void
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
    fen:          new Chess().fen(),
    status:       'idle',
    playerColor:  'white',
    lastMove:     null,
    moves:        [],
    isThinking:   false,
    difficulty:   'medium',
    resultReason: null,
    whiteTimeMs:  null,
    blackTimeMs:  null,
  })

  const chessRef      = useRef(new Chess())
  const stateRef      = useRef(state)
  const botBusyRef    = useRef(false)   // prevents double-fire in StrictMode / async
  stateRef.current    = state

  // Pre-init engine the moment the hook mounts so WASM is ready before first move
  useEffect(() => {
    stockfishEngine.init().catch(() => {})
  }, [])

  // ── Clock: tick every 100ms while playing ──────────────────────────────────
  useEffect(() => {
    if (state.status !== 'playing' || state.whiteTimeMs === null) return

    const id = setInterval(() => {
      setState(prev => {
        if (prev.status !== 'playing' || prev.whiteTimeMs === null) return prev
        const isWhiteTurn = chessRef.current.turn() === 'w'

        if (isWhiteTurn) {
          const next = prev.whiteTimeMs - 100
          if (next <= 0) {
            const flaggedStatus: BotGameStatus = prev.playerColor === 'white' ? 'lost' : 'won'
            return { ...prev, whiteTimeMs: 0, status: flaggedStatus, resultReason: 'Time' }
          }
          return { ...prev, whiteTimeMs: next }
        } else {
          const next = (prev.blackTimeMs ?? 0) - 100
          if (next <= 0) {
            const flaggedStatus: BotGameStatus = prev.playerColor === 'black' ? 'lost' : 'won'
            return { ...prev, blackTimeMs: 0, status: flaggedStatus, resultReason: 'Time' }
          }
          return { ...prev, blackTimeMs: next }
        }
      })
    }, 100)

    return () => clearInterval(id)
  }, [state.status]) // restarts only on status change (not every tick)

  // ── Bot move trigger: fires whenever it becomes the bot's turn ─────────────
  const runBotMove = useCallback(async (
    chess: Chess,
    playerColor: 'white' | 'black',
    difficulty: BotDifficulty,
  ) => {
    if (botBusyRef.current) return
    botBusyRef.current = true

    setState(prev => ({ ...prev, isThinking: true }))

    const sfMove = await stockfishEngine.getBestMove(chess.fen(), difficulty)

    botBusyRef.current = false

    if (!sfMove) {
      setState(prev => ({ ...prev, isThinking: false }))
      return
    }

    let result
    try {
      result = chess.move({ from: sfMove.from, to: sfMove.to, promotion: sfMove.promotion ?? 'q' })
    } catch {
      setState(prev => ({ ...prev, isThinking: false }))
      return
    }
    if (!result) {
      setState(prev => ({ ...prev, isThinking: false }))
      return
    }

    const { status, reason } = resolveStatus(chess, playerColor)
    setState(prev => ({
      ...prev,
      fen:          chess.fen(),
      lastMove:     { from: sfMove.from, to: sfMove.to },
      moves:        [...prev.moves, { san: result.san, from: sfMove.from, to: sfMove.to }],
      isThinking:   false,
      status,
      resultReason: reason,
    }))
  }, [])

  useEffect(() => {
    if (state.status !== 'playing') return
    const chess = chessRef.current
    const isWhiteTurn = chess.turn() === 'w'
    const isBotTurn =
      (state.playerColor === 'white' && !isWhiteTurn) ||
      (state.playerColor === 'black' &&  isWhiteTurn)
    if (isBotTurn) {
      runBotMove(chess, state.playerColor, state.difficulty)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.moves.length])
  // Intentionally omitting runBotMove (stable) and playerColor/difficulty (don't change mid-game)

  // ── Public API ─────────────────────────────────────────────────────────────

  const startGame = useCallback((
    colorChoice: 'white' | 'black' | 'random',
    difficulty: BotDifficulty,
    timeLimitMs?: number,
  ) => {
    const playerColor = colorChoice === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : colorChoice

    const chess = new Chess()
    chessRef.current   = chess
    botBusyRef.current = false

    setState({
      fen:          chess.fen(),
      status:       'intro',         // show matchup screen first
      playerColor,
      lastMove:     null,
      moves:        [],
      isThinking:   false,
      difficulty,
      resultReason: null,
      whiteTimeMs:  timeLimitMs ?? null,
      blackTimeMs:  timeLimitMs ?? null,
    })
  }, [])

  // Called when user clicks "Start Game" on the intro screen
  const beginPlay = useCallback(() => {
    setState(prev => ({ ...prev, status: 'playing' }))
    // Bot turn is detected by the useEffect above once status === 'playing'
  }, [])

  const makePlayerMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    const { status, isThinking, playerColor, difficulty } = stateRef.current
    const chess = chessRef.current

    if (status !== 'playing' || isThinking) return false

    const isWhiteTurn = chess.turn() === 'w'
    if (playerColor === 'white' && !isWhiteTurn) return false
    if (playerColor === 'black' &&  isWhiteTurn) return false

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
    // Bot will be triggered automatically by the useEffect
    return true
  }, [])

  const resetGame = useCallback(() => {
    const chess = new Chess()
    chessRef.current   = chess
    botBusyRef.current = false
    setState(prev => ({
      fen:          chess.fen(),
      status:       'idle',
      playerColor:  prev.playerColor,
      lastMove:     null,
      moves:        [],
      isThinking:   false,
      difficulty:   prev.difficulty,
      resultReason: null,
      whiteTimeMs:  null,
      blackTimeMs:  null,
    }))
  }, [])

  return { ...state, startGame, beginPlay, makePlayerMove, resetGame }
}
