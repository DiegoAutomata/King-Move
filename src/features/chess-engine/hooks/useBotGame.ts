'use client'

import { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { getBotMove, BOT_DEPTHS, type BotDifficulty } from '../lib/botEngine'

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

  const chessRef = useRef(new Chess())

  const resolveStatus = (chess: Chess, playerColor: 'white' | 'black'): { status: BotGameStatus; reason: string | null } => {
    if (chess.isCheckmate()) {
      const loser = chess.turn() === 'w' ? 'white' : 'black'
      return {
        status: loser === playerColor ? 'lost' : 'won',
        reason: 'Checkmate',
      }
    }
    if (chess.isStalemate())  return { status: 'draw', reason: 'Stalemate' }
    if (chess.isDraw())       return { status: 'draw', reason: 'Draw' }
    return { status: 'playing', reason: null }
  }

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

    // Si el jugador eligió negras, el bot mueve primero
    if (playerColor === 'black') {
      setTimeout(() => runBotMove(chess, playerColor, difficulty), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runBotMove = (chess: Chess, playerColor: 'white' | 'black', difficulty: BotDifficulty) => {
    setState(prev => ({ ...prev, isThinking: true }))

    // setTimeout para no bloquear el hilo principal
    setTimeout(() => {
      const depth = BOT_DEPTHS[difficulty]
      const botMove = getBotMove(chess.fen(), depth)

      if (!botMove) {
        setState(prev => ({ ...prev, isThinking: false }))
        return
      }

      const result = chess.move({ from: botMove.from, to: botMove.to, promotion: botMove.promotion ?? 'q' })
      if (!result) {
        setState(prev => ({ ...prev, isThinking: false }))
        return
      }

      const { status, reason } = resolveStatus(chess, playerColor)

      setState(prev => ({
        ...prev,
        fen: chess.fen(),
        lastMove: { from: botMove.from, to: botMove.to },
        moves: [...prev.moves, { san: result.san, from: botMove.from, to: botMove.to }],
        isThinking: false,
        status,
        resultReason: reason,
      }))
    }, 50)
  }

  const makePlayerMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    const chess = chessRef.current

    if (state.status !== 'playing' || state.isThinking) return false

    // Verificar que es el turno del jugador
    const isWhiteTurn = chess.turn() === 'w'
    if (state.playerColor === 'white' && !isWhiteTurn) return false
    if (state.playerColor === 'black' && isWhiteTurn) return false

    // Intentar el movimiento
    let result
    try {
      result = chess.move({ from, to, promotion: promotion ?? 'q' })
    } catch {
      return false
    }
    if (!result) return false

    const { status, reason } = resolveStatus(chess, state.playerColor)

    setState(prev => ({
      ...prev,
      fen: chess.fen(),
      lastMove: { from, to },
      moves: [...prev.moves, { san: result.san, from, to }],
      status,
      resultReason: reason,
    }))

    // Si la partida sigue, que el bot responda
    if (status === 'playing') {
      runBotMove(chess, state.playerColor, state.difficulty)
    }

    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

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
