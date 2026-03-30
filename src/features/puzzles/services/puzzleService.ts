import type { LichessPuzzle } from '../types'

interface LichessApiResponse {
  puzzle: {
    id: string
    initialPly: number
    rating: number
    solution: string[]
    themes: string[]
  }
  game: {
    pgn: string
  }
}

// Obtener puzzle del día de Lichess
export async function getDailyPuzzle(): Promise<LichessPuzzle> {
  const res = await fetch('https://lichess.org/api/puzzle/daily', {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 }, // cache 1 hora (Next.js)
  })

  if (!res.ok) throw new Error('Failed to fetch daily puzzle')

  const data: LichessApiResponse = await res.json()
  return parsePuzzle(data)
}

// Obtener un puzzle nuevo (distinto al daily) para Puzzle Rush
export async function getNextPuzzle(): Promise<LichessPuzzle> {
  try {
    const res = await fetch('https://lichess.org/api/puzzle/next', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('no puzzle/next')
    const data: LichessApiResponse = await res.json()
    return parsePuzzle(data)
  } catch {
    return getDailyPuzzle()
  }
}

function parsePuzzle(data: LichessApiResponse): LichessPuzzle {
  // La API de Lichess devuelve la solución como array de movimientos UCI
  // El primer movimiento es del oponente, los siguientes son del jugador alternando
  const moves = data.puzzle.solution

  // Extraer FEN inicial del PGN (posición después de initialPly movimientos)
  const fen = extractFenFromPgn(data.game.pgn, data.puzzle.initialPly)

  return {
    id: data.puzzle.id,
    fen,
    moves,
    rating: data.puzzle.rating,
    themes: data.puzzle.themes,
    initialPly: data.puzzle.initialPly,
  }
}

function extractFenFromPgn(pgn: string, targetPly: number): string {
  const { Chess } = require('chess.js')
  const chess = new Chess()

  // Parsear el PGN y ejecutar los movimientos hasta el ply indicado
  // El PGN viene como lista de movimientos en notación estándar
  const moveSection = pgn.replace(/\[[^\]]*\]\s*/g, '').trim()
  const tokens = moveSection
    .split(/\s+/)
    .filter(t => t && !t.match(/^\d+\./) && !t.match(/^(1-0|0-1|1\/2-1\/2|\*)$/))

  let ply = 0
  for (const token of tokens) {
    if (ply >= targetPly) break
    try {
      chess.move(token)
      ply++
    } catch {
      // ignorar tokens inválidos
    }
  }

  return chess.fen()
}
