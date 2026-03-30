'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Game } from '@/types/database'

export type MatchmakingStatus = 'idle' | 'searching' | 'found' | 'error'

interface MatchmakingOptions {
  gameType: 'free' | 'token'
  timeControl: string
  betAmount: number
  userElo: number
  userId: string
}

interface UseMatchmakingReturn {
  status: MatchmakingStatus
  error: string | null
  startSearch: (opts: MatchmakingOptions) => Promise<void>
  cancelSearch: () => Promise<void>
}

export function useMatchmaking(): UseMatchmakingReturn {
  const router = useRouter()
  const [status, setStatus] = useState<MatchmakingStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const gameIdRef = useRef<string | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const startSearch = useCallback(async (opts: MatchmakingOptions) => {
    const supabase = createClient()
    setStatus('searching')
    setError(null)

    // Verificar tokens si es token game
    if (opts.gameType === 'token' && opts.betAmount > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('token_balance')
        .eq('id', opts.userId)
        .single()

      if (!profile || Number(profile.token_balance) < opts.betAmount) {
        setError('Insufficient $KING tokens.')
        setStatus('error')
        return
      }
    }

    // Buscar partida en espera con ELO compatible (±200) y mismo tiempo/tipo
    const eloMin = opts.userElo - 200
    const eloMax = opts.userElo + 200

    const { data: waiting } = await supabase
      .from('games')
      .select('id, player_white')
      .eq('status', 'waiting')
      .eq('time_control', opts.timeControl)
      .eq('game_type', opts.gameType)
      .eq('bet_amount', opts.betAmount)
      .neq('player_white', opts.userId)
      .gte('creator_elo', eloMin)
      .lte('creator_elo', eloMax)
      .limit(5)

    let gameId: string | null = null

    // Intentar unirse a la primera partida disponible
    if (waiting && waiting.length > 0) {
      for (const candidate of waiting) {
        const { data: joined, error: joinErr } = await supabase
          .from('games')
          .update({ player_black: opts.userId, status: 'active' })
          .eq('id', candidate.id)
          .eq('status', 'waiting')
          .eq('player_black', null as unknown as string)
          .select('id')
          .single()

        if (!joinErr && joined) {
          gameId = joined.id
          break
        }
      }
    }

    // No encontró partida → crear una nueva y esperar
    if (!gameId) {
      const { data: created, error: createErr } = await supabase
        .from('games')
        .insert({
          player_white: opts.userId,
          game_type: opts.gameType,
          time_control: opts.timeControl,
          bet_amount: opts.betAmount,
          status: 'waiting',
          creator_elo: opts.userElo,
        })
        .select('id')
        .single()

      if (createErr || !created) {
        setError('Could not create game. Try again.')
        setStatus('error')
        return
      }

      gameId = created.id

      // Suscribirse a cambios: cuando alguien se una, ir a la partida
      const channel = supabase
        .channel(`matchmaking:${gameId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            const updated = payload.new as Game
            if (updated.status === 'active') {
              setStatus('found')
              router.push(`/game/${gameId}`)
            }
          }
        )
        .subscribe()

      gameIdRef.current = gameId
      channelRef.current = channel
      return
    }

    // Unión exitosa → ir directo a la partida
    gameIdRef.current = gameId
    setStatus('found')
    router.push(`/game/${gameId}`)
  }, [router])

  const cancelSearch = useCallback(async () => {
    const supabase = createClient()

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    if (gameIdRef.current) {
      await supabase
        .from('games')
        .update({ status: 'aborted' })
        .eq('id', gameIdRef.current)
        .eq('status', 'waiting')

      gameIdRef.current = null
    }

    setStatus('idle')
    setError(null)
  }, [])

  return { status, error, startSearch, cancelSearch }
}
