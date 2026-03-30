'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { createClient } from '@/lib/supabase/client'
import type { Game } from '@/types/database'

interface StoredMove {
  from: string
  to: string
  promotion?: string
  san: string
  fen: string
}

export type GameResult = 'white' | 'black' | 'draw' | null

interface OnlineGameState {
  game: Chess
  fen: string
  moves: StoredMove[]
  myColor: 'white' | 'black' | null
  isMyTurn: boolean
  isWhiteTurn: boolean
  status: Game['status'] | null
  result: GameResult
  lastMove: { from: string; to: string } | null
  whitePlayer: { id: string; elo?: number; name?: string } | null
  blackPlayer: { id: string; elo?: number; name?: string } | null
  betAmount: number
  gameType: Game['game_type']
  whiteTimeMs: number | null
  blackTimeMs: number | null
  lastMoveAt: string | null
  loading: boolean
  error: string | null
}

interface UseOnlineGameReturn extends OnlineGameState {
  makeMove: (from: string, to: string, promotion?: string) => Promise<boolean>
  resign: () => Promise<void>
  flagTimeout: () => Promise<void>
}

export function useOnlineGame(gameId: string, userId: string): UseOnlineGameReturn {
  const [state, setState] = useState<OnlineGameState>({
    game: new Chess(),
    fen: new Chess().fen(),
    moves: [],
    myColor: null,
    isMyTurn: false,
    isWhiteTurn: true,
    status: null,
    result: null,
    lastMove: null,
    whitePlayer: null,
    blackPlayer: null,
    betAmount: 0,
    gameType: 'free',
    whiteTimeMs: null,
    blackTimeMs: null,
    lastMoveAt: null,
    loading: true,
    error: null,
  })

  const gameRef = useRef(new Chess())
  // Keep player IDs available in callbacks without stale closures
  const playersRef = useRef<{ white: string | null; black: string | null }>({ white: null, black: null })

  const applyMoves = useCallback((moves: StoredMove[]) => {
    const chess = new Chess()
    for (const m of moves) {
      chess.move({ from: m.from, to: m.to, promotion: m.promotion })
    }
    return chess
  }, [])

  const resolveGame = useCallback(async (winnerId: string | null) => {
    const supabase = createClient()
    await supabase.rpc('resolve_game', { p_game_id: gameId, p_winner_id: winnerId })
  }, [gameId])

  const loadGame = useCallback(async () => {
    const supabase = createClient()

    const { data: gameData, error: gameErr } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single<Game>()

    if (gameErr || !gameData) {
      setState(prev => ({ ...prev, loading: false, error: 'Game not found.' }))
      return
    }

    const myColor = gameData.player_white === userId
      ? 'white'
      : gameData.player_black === userId
        ? 'black'
        : null

    const moves = (gameData.moves ?? []) as StoredMove[]
    const chess = applyMoves(moves)
    gameRef.current = chess

    const lastMove = moves.length > 0
      ? { from: moves[moves.length - 1].from, to: moves[moves.length - 1].to }
      : null

    const playerIds = [gameData.player_white, gameData.player_black].filter(Boolean) as string[]
    let whitePlayer = null
    let blackPlayer = null

    if (playerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, elo, full_name, email')
        .in('id', playerIds)

      if (profiles) {
        const wp = profiles.find(p => p.id === gameData.player_white)
        const bp = profiles.find(p => p.id === gameData.player_black)
        if (wp) whitePlayer = { id: wp.id, elo: wp.elo, name: wp.full_name ?? wp.email }
        if (bp) blackPlayer = { id: bp.id, elo: bp.elo, name: bp.full_name ?? bp.email }
      }
    }

    playersRef.current = { white: gameData.player_white, black: gameData.player_black }

    const currentTurn = chess.turn() === 'w' ? 'white' : 'black'

    setState({
      game: chess,
      fen: chess.fen(),
      moves,
      myColor,
      isMyTurn: myColor === currentTurn,
      isWhiteTurn: currentTurn === 'white',
      status: gameData.status,
      result: gameData.result as GameResult,
      lastMove,
      whitePlayer,
      blackPlayer,
      betAmount: Number(gameData.bet_amount),
      gameType: gameData.game_type,
      whiteTimeMs: gameData.white_time_ms,
      blackTimeMs: gameData.black_time_ms,
      lastMoveAt: gameData.last_move_at,
      loading: false,
      error: null,
    })
  }, [gameId, userId, applyMoves])

  useEffect(() => {
    loadGame()

    const supabase = createClient()
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          const updated = payload.new as Game
          const moves = (updated.moves ?? []) as StoredMove[]
          const chess = applyMoves(moves)
          gameRef.current = chess

          const lastMove = moves.length > 0
            ? { from: moves[moves.length - 1].from, to: moves[moves.length - 1].to }
            : null

          setState(prev => {
            const currentTurn = chess.turn() === 'w' ? 'white' : 'black'
            return {
              ...prev,
              game: chess,
              fen: chess.fen(),
              isMyTurn: prev.myColor === currentTurn,
              isWhiteTurn: currentTurn === 'white',
              status: updated.status,
              result: updated.result as GameResult,
              lastMove,
              whiteTimeMs: (updated as Game).white_time_ms,
              blackTimeMs: (updated as Game).black_time_ms,
              lastMoveAt: (updated as Game).last_move_at,
            }
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId, userId, loadGame, applyMoves])

  const makeMove = useCallback(async (from: string, to: string, promotion?: string): Promise<boolean> => {
    if (!state.isMyTurn || state.status !== 'active') return false

    const supabase = createClient()
    const chess = new Chess(gameRef.current.fen())

    let moveResult
    try {
      moveResult = chess.move({ from, to, promotion: promotion ?? 'q' })
    } catch {
      return false
    }
    if (!moveResult) return false

    gameRef.current = chess
    setState(prev => ({
      ...prev,
      game: chess,
      fen: chess.fen(),
      isMyTurn: false,
      isWhiteTurn: chess.turn() === 'w',
      lastMove: { from, to },
    }))

    // Leer estado actual de la BD (movimientos + timer)
    const { data: current } = await supabase
      .from('games')
      .select('moves, white_time_ms, black_time_ms, last_move_at')
      .eq('id', gameId)
      .single<{ moves: StoredMove[]; white_time_ms: number | null; black_time_ms: number | null; last_move_at: string | null }>()

    const prevMoves = (current?.moves ?? []) as StoredMove[]
    const newMove: StoredMove = { from, to, promotion, san: moveResult.san, fen: chess.fen() }
    const updatedMoves = [...prevMoves, newMove]

    // Calcular tiempo consumido por el jugador que acaba de mover
    let newWhiteTime = current?.white_time_ms ?? null
    let newBlackTime = current?.black_time_ms ?? null

    if (current?.last_move_at && newWhiteTime !== null && newBlackTime !== null) {
      const elapsed = Date.now() - new Date(current.last_move_at).getTime()
      if (state.myColor === 'white') {
        newWhiteTime = Math.max(0, newWhiteTime - elapsed)
      } else {
        newBlackTime = Math.max(0, newBlackTime - elapsed)
      }
    }

    // Detectar fin de partida
    let newStatus: Game['status'] = 'active'
    let result: GameResult = null
    let winnerId: string | null = null

    if (newWhiteTime !== null && newWhiteTime <= 0) {
      newStatus = 'finished'
      result = 'black'
      winnerId = playersRef.current.black
    } else if (newBlackTime !== null && newBlackTime <= 0) {
      newStatus = 'finished'
      result = 'white'
      winnerId = playersRef.current.white
    } else if (chess.isGameOver()) {
      newStatus = 'finished'
      if (chess.isCheckmate()) {
        result = chess.turn() === 'w' ? 'black' : 'white'
        winnerId = result === 'white' ? playersRef.current.white : playersRef.current.black
      } else {
        result = 'draw'
        winnerId = null
      }
    }

    const { error: updateErr } = await supabase
      .from('games')
      .update({
        moves: updatedMoves,
        fen_final: chess.fen(),
        ...(newWhiteTime !== null ? { white_time_ms: newWhiteTime } : {}),
        ...(newBlackTime !== null ? { black_time_ms: newBlackTime } : {}),
        last_move_at: new Date().toISOString(),
        ...(newStatus === 'finished' ? { status: 'finished', result, finished_at: new Date().toISOString() } : {}),
      })
      .eq('id', gameId)

    if (updateErr) {
      await loadGame()
      return false
    }

    if (newStatus === 'finished') {
      await resolveGame(winnerId)
    }

    return true
  }, [gameId, state.isMyTurn, state.status, state.myColor, loadGame, resolveGame])

  const resign = useCallback(async () => {
    if (!state.myColor || state.status !== 'active') return
    const winnerId = state.myColor === 'white'
      ? playersRef.current.black
      : playersRef.current.white
    await resolveGame(winnerId)
  }, [state.myColor, state.status, resolveGame])

  const flagTimeout = useCallback(async () => {
    const supabase = createClient()
    await supabase.rpc('flag_timeout', { p_game_id: gameId })
  }, [gameId])

  return { ...state, makeMove, resign, flagTimeout }
}
