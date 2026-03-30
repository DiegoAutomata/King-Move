'use server'

import { createClient } from '@/lib/supabase/server'

interface EvalResult {
  cp?: number   // centipawns (positive = white advantage)
  mate?: number // forced mate
}

async function fetchLichessEval(fen: string): Promise<EvalResult | null> {
  try {
    const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // cache eval for 1h
    })
    if (!res.ok) return null
    const data = await res.json()
    const pvs = data?.pvs
    if (!pvs || pvs.length === 0) return null
    return { cp: pvs[0].cp, mate: pvs[0].mate }
  } catch {
    return null
  }
}

// Convert eval to score from current player's perspective (positive = winning)
function evalScore(evalResult: EvalResult, isWhite: boolean): number {
  if (evalResult.mate !== undefined) {
    return evalResult.mate > 0 ? (isWhite ? 99 : -99) : (isWhite ? -99 : 99)
  }
  if (evalResult.cp !== undefined) {
    return isWhite ? evalResult.cp / 100 : -(evalResult.cp / 100)
  }
  return 0
}

/**
 * B.3 — Check if a player made a comeback (was losing badly, then won).
 * Called after a game finishes. Uses Lichess cloud eval on a sample of positions.
 */
export async function checkComebackKing(gameId: string): Promise<{ awarded: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { awarded: false }

  const { data: game } = await supabase
    .from('games')
    .select('player_white, player_black, result, moves')
    .eq('id', gameId)
    .eq('status', 'finished')
    .single()

  if (!game || !game.result || game.result === 'draw') return { awarded: false }

  const isWhite = game.player_white === user.id
  const isBlack = game.player_black === user.id
  if (!isWhite && !isBlack) return { awarded: false }

  // Did this user win?
  const iWon = game.result === (isWhite ? 'white' : 'black')
  if (!iWon) return { awarded: false }

  // Check already unlocked
  const { data: existing } = await supabase
    .from('achievements')
    .select('id')
    .eq('user_id', user.id)
    .eq('achievement_key', 'comeback_king')
    .maybeSingle()
  if (existing) return { awarded: false }

  // Sample every 4th position from the first half of the game to find a losing position
  type StoredMove = { fen: string; san: string }
  const moves = (game.moves ?? []) as StoredMove[]
  if (moves.length < 6) return { awarded: false }

  const sampleSize = Math.min(Math.floor(moves.length / 2), 10)
  const fensToCheck = moves
    .slice(0, sampleSize)
    .filter((_, i) => i % 2 === 0) // every other position
    .map(m => m.fen)
    .filter(Boolean)

  let wasLosingBadly = false
  for (const fen of fensToCheck) {
    const evalRes = await fetchLichessEval(fen)
    if (!evalRes) continue
    // Determine who is to move from the FEN
    const fenIsWhiteTurn = fen.split(' ')[1] === 'w'
    const playerScore = evalScore(evalRes, fenIsWhiteTurn === isWhite)
    if (playerScore <= -2.0) {
      wasLosingBadly = true
      break
    }
  }

  if (!wasLosingBadly) return { awarded: false }

  // Award the achievement
  const { error } = await supabase.rpc('grant_achievement', {
    p_user_id: user.id,
    p_key: 'comeback_king',
    p_xp: 100,
  })

  return { awarded: !error }
}
