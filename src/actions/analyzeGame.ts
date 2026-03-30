'use server'

import { Chess } from 'chess.js'
import { createClient } from '@/lib/supabase/server'
import type { PositionEval } from '@/types/database'

interface StoredMove {
  from: string
  to: string
  promotion?: string
  san: string
  fen: string
}

// Fetches Lichess cloud-eval including the best move from the principal variation
async function fetchPositionEval(fen: string): Promise<PositionEval | null> {
  try {
    const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}&multiPv=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const pv = data?.pvs?.[0]
    if (!pv) return null
    return {
      cp:       pv.cp,
      mate:     pv.mate,
      bestMove: pv.moves?.split(' ')[0] ?? undefined,
    }
  } catch {
    return null
  }
}

// Converts a PositionEval to a single centipawn number from White's perspective.
// Forced mates use ±10000 so the cp-loss formula works uniformly.
function toCp(ev: PositionEval): number {
  if (ev.mate !== undefined) return ev.mate > 0 ? 10000 : -10000
  return ev.cp ?? 0
}

// Returns the centipawn loss for the side that just moved (always ≥ 0).
// prevCp and nextCp are both from White's perspective.
function cpLoss(prevCp: number, nextCp: number, isWhiteMove: boolean): number {
  return isWhiteMove
    ? Math.max(0, prevCp - nextCp) // White improved = nextCp higher
    : Math.max(0, nextCp - prevCp) // Black improved = nextCp lower
}

// Maps cp loss to a 0-100 quality score used for accuracy averaging.
function moveScore(loss: number): number {
  if (loss <= 10)  return 100
  if (loss <= 25)  return 95
  if (loss <= 50)  return 85
  if (loss <= 100) return 70
  if (loss <= 200) return 40
  return 10
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

/**
 * Analyzes a finished game server-side:
 * - Computes accuracy % for both players (via cp-loss per move)
 * - Detects engine correlation for anti-cheat
 * - Stores results and per-position evals in the games table
 *
 * Idempotent: if anti_cheat_checked is already true, returns immediately.
 * Called fire-and-forget from the game result screen.
 */
export async function analyzeGame(gameId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  // 1. Load game — guard against double processing
  const { data: game } = await supabase
    .from('games')
    .select('player_white, player_black, moves, status, anti_cheat_checked')
    .eq('id', gameId)
    .single()

  if (!game || game.status !== 'finished') return { success: false }
  if (game.anti_cheat_checked) return { success: true } // already done

  const moves = (game.moves ?? []) as StoredMove[]

  // Mark games too short to analyze but still set the flag to avoid re-processing
  if (moves.length < 6) {
    await supabase.from('games').update({ anti_cheat_checked: true }).eq('id', gameId)
    return { success: true }
  }

  // 2. Build the full list of FENs: initial position + FEN after each move (N+1 total)
  const initialFen = new Chess().fen()
  const fens: string[] = [initialFen, ...moves.map(m => m.fen)]

  // 3. Evaluate each position via Lichess cloud-eval (sequential, 150ms apart)
  const evals: (PositionEval | null)[] = []
  for (const fen of fens) {
    evals.push(await fetchPositionEval(fen))
    await new Promise(r => setTimeout(r, 150))
  }

  // 4. Per-move stats
  const whiteScores: number[] = []
  const blackScores: number[] = []
  let whiteMatches = 0, whiteMoveCount = 0
  let blackMatches = 0, blackMoveCount = 0

  for (let i = 0; i < moves.length; i++) {
    const isWhiteMove   = i % 2 === 0
    const evalBefore    = evals[i]
    const evalAfter     = evals[i + 1]
    const actualMove    = moves[i].from + moves[i].to + (moves[i].promotion ?? '')

    // Anti-cheat: exact UCI match against engine's best move
    if (evalBefore?.bestMove) {
      if (isWhiteMove) {
        whiteMoveCount++
        if (actualMove === evalBefore.bestMove) whiteMatches++
      } else {
        blackMoveCount++
        if (actualMove === evalBefore.bestMove) blackMatches++
      }
    }

    // Accuracy: cp loss requires both evals
    if (!evalBefore || !evalAfter) continue
    const loss  = cpLoss(toCp(evalBefore), toCp(evalAfter), isWhiteMove)
    const score = moveScore(loss)
    if (isWhiteMove) whiteScores.push(score)
    else             blackScores.push(score)
  }

  // 5. Aggregate
  const accuracyWhite    = whiteScores.length     > 0 ? average(whiteScores)                                    : null
  const accuracyBlack    = blackScores.length     > 0 ? average(blackScores)                                    : null
  const cheatScoreWhite  = whiteMoveCount         > 0 ? Math.round(whiteMatches / whiteMoveCount * 100)         : null
  const cheatScoreBlack  = blackMoveCount         > 0 ? Math.round(blackMatches / blackMoveCount * 100)         : null
  const cheatFlaggedWhite = whiteMoveCount >= 15 && (cheatScoreWhite ?? 0) >= 90
  const cheatFlaggedBlack = blackMoveCount >= 15 && (cheatScoreBlack ?? 0) >= 90

  // move_evals: one entry per position (N+1), nulls replaced with empty objects
  const moveEvals: PositionEval[] = evals.map(e => e ?? {})

  // 6. Persist
  await supabase
    .from('games')
    .update({
      accuracy_white:      accuracyWhite,
      accuracy_black:      accuracyBlack,
      cheat_score_white:   cheatScoreWhite,
      cheat_score_black:   cheatScoreBlack,
      cheat_flagged_white: cheatFlaggedWhite,
      cheat_flagged_black: cheatFlaggedBlack,
      anti_cheat_checked:  true,
      move_evals:          moveEvals,
    })
    .eq('id', gameId)

  return { success: true }
}
