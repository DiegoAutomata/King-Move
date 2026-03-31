'use server'

import { Chess } from 'chess.js'
import { createClient } from '@/lib/supabase/server'
import { parseStoredMoves } from '@/shared/types/storedMove'
import type { PositionEval } from '@/types/database'

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

// Converts eval to centipawns from White's perspective. Mates use ±10000.
function toCp(ev: PositionEval): number {
  if (ev.mate !== undefined) return ev.mate > 0 ? 10000 : -10000
  return ev.cp ?? 0
}

// Centipawn loss for the side that just moved (always ≥ 0).
function cpLoss(prevCp: number, nextCp: number, isWhiteMove: boolean): number {
  return isWhiteMove
    ? Math.max(0, prevCp - nextCp)
    : Math.max(0, nextCp - prevCp)
}

// Maps cp loss to a 0-100 quality score for accuracy averaging.
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
 * - Computes accuracy % for both players (cp-loss based)
 * - Computes ACPL (Average Centipawn Loss) — the primary anti-cheat metric
 * - Detects engine correlation (exact best-move match rate) — secondary signal
 * - Flags players if ACPL < 30cp over 20+ moves OR exact match rate ≥ 90% over 15+ moves
 *
 * Idempotent: if anti_cheat_checked is already true, returns immediately.
 */
export async function analyzeGame(gameId: string): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { data: game } = await supabase
    .from('games')
    .select('player_white, player_black, moves, status, anti_cheat_checked')
    .eq('id', gameId)
    .single()

  if (!game || game.status !== 'finished') return { success: false }
  if (game.anti_cheat_checked) return { success: true }

  // Validate JSONB structure with Zod before processing
  const moves = parseStoredMoves(game.moves)

  if (moves.length < 6) {
    await supabase.from('games').update({ anti_cheat_checked: true }).eq('id', gameId)
    return { success: true }
  }

  // Build FEN list: initial + post-move FENs (N+1 total)
  const initialFen = new Chess().fen()
  const fens: string[] = [initialFen, ...moves.map(m => m.fen)]

  // Evaluate each position via Lichess cloud-eval (sequential, 150ms between calls)
  const evals: (PositionEval | null)[] = []
  for (const fen of fens) {
    evals.push(await fetchPositionEval(fen))
    await new Promise(r => setTimeout(r, 150))
  }

  // Per-move stats
  const whiteScores:  number[] = []
  const blackScores:  number[] = []
  const whiteCpLoss:  number[] = []
  const blackCpLoss:  number[] = []
  let whiteMatches = 0, whiteMoveCount = 0
  let blackMatches = 0, blackMoveCount = 0

  for (let i = 0; i < moves.length; i++) {
    const isWhiteMove = i % 2 === 0
    const evalBefore  = evals[i]
    const evalAfter   = evals[i + 1]
    const actualMove  = moves[i].from + moves[i].to + (moves[i].promotion ?? '')

    // Anti-cheat signal 1: exact UCI best-move match rate
    if (evalBefore?.bestMove) {
      if (isWhiteMove) {
        whiteMoveCount++
        if (actualMove === evalBefore.bestMove) whiteMatches++
      } else {
        blackMoveCount++
        if (actualMove === evalBefore.bestMove) blackMatches++
      }
    }

    // Accuracy + ACPL require both evals present and non-empty
    if (!evalBefore || !evalAfter) continue
    if (evalBefore.cp === undefined && evalBefore.mate === undefined) continue
    if (evalAfter.cp  === undefined && evalAfter.mate  === undefined) continue

    const loss  = cpLoss(toCp(evalBefore), toCp(evalAfter), isWhiteMove)
    const score = moveScore(loss)

    if (isWhiteMove) {
      whiteScores.push(score)
      whiteCpLoss.push(loss)
    } else {
      blackScores.push(score)
      blackCpLoss.push(loss)
    }
  }

  // Accuracy (0-100 scale from quality scores)
  const accuracyWhite = whiteScores.length > 0 ? average(whiteScores) : null
  const accuracyBlack = blackScores.length > 0 ? average(blackScores) : null

  // ACPL — average centipawn loss (lower = more engine-like)
  const acplWhite = whiteCpLoss.length > 0 ? average(whiteCpLoss) : null
  const acplBlack = blackCpLoss.length > 0 ? average(blackCpLoss) : null

  // Exact match rate
  const cheatScoreWhite = whiteMoveCount > 0 ? Math.round(whiteMatches / whiteMoveCount * 100) : null
  const cheatScoreBlack = blackMoveCount > 0 ? Math.round(blackMatches / blackMoveCount * 100) : null

  // Flag if either signal is triggered:
  // — ACPL < 30cp over 20+ evaluated moves (suspiciously engine-like)
  // — Exact match rate ≥ 90% over 15+ moves (textbook engine correlation)
  const cheatFlaggedWhite =
    (whiteCpLoss.length >= 20 && (acplWhite ?? 999) < 30) ||
    (whiteMoveCount >= 15     && (cheatScoreWhite ?? 0) >= 90)

  const cheatFlaggedBlack =
    (blackCpLoss.length >= 20 && (acplBlack ?? 999) < 30) ||
    (blackMoveCount >= 15     && (cheatScoreBlack ?? 0) >= 90)

  const moveEvals: PositionEval[] = evals.map(e => e ?? {})

  await supabase
    .from('games')
    .update({
      accuracy_white:      accuracyWhite,
      accuracy_black:      accuracyBlack,
      acpl_white:          acplWhite,
      acpl_black:          acplBlack,
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
