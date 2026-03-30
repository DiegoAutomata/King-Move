import { Chess } from 'chess.js'

// Tablas de bonus posicional (perspectiva blancas, 8x8 fila 0 = a8)
const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
]

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
]

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
]

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
]

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
]

const KING_MID_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
]

const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
}

function squareIndex(square: string): number {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = 8 - parseInt(square[1])
  return rank * 8 + file
}

function getPieceTableValue(type: string, color: string, square: string): number {
  const idx = color === 'w' ? squareIndex(square) : 63 - squareIndex(square)
  switch (type) {
    case 'p': return PAWN_TABLE[idx]
    case 'n': return KNIGHT_TABLE[idx]
    case 'b': return BISHOP_TABLE[idx]
    case 'r': return ROOK_TABLE[idx]
    case 'q': return QUEEN_TABLE[idx]
    case 'k': return KING_MID_TABLE[idx]
    default:  return 0
  }
}

function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -99999 : 99999
  if (chess.isDraw()) return 0

  let score = 0
  const board = chess.board()
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue
      const val = PIECE_VALUES[cell.type] + getPieceTableValue(cell.type, cell.color, cell.square)
      score += cell.color === 'w' ? val : -val
    }
  }
  return score
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) return evaluate(chess)

  const moves = chess.moves({ verbose: true })

  if (maximizing) {
    let best = -Infinity
    for (const move of moves) {
      chess.move(move)
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false))
      chess.undo()
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const move of moves) {
      chess.move(move)
      best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true))
      chess.undo()
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

export interface BotMove {
  from: string
  to: string
  promotion?: string
}

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

export const BOT_DEPTHS: Record<BotDifficulty, number> = {
  easy:   1,
  medium: 2,
  hard:   3,
  expert: 4,
}

export function difficultyFromElo(elo: number): BotDifficulty {
  if (elo < 900)  return 'easy'
  if (elo < 1200) return 'medium'
  if (elo < 1500) return 'hard'
  return 'expert'
}

export const BOT_ELO_LABELS: Record<BotDifficulty, string> = {
  easy:   '~600',
  medium: '~1000',
  hard:   '~1400',
  expert: '~1800',
}

export const DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy:   'Easy',
  medium: 'Medium',
  hard:   'Hard',
  expert: 'Expert',
}

export const DIFFICULTY_COLORS: Record<BotDifficulty, string> = {
  easy:   'text-green-400 border-green-400/30 bg-green-400/10',
  medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  hard:   'text-orange-400 border-orange-400/30 bg-orange-400/10',
  expert: 'text-red-400 border-red-400/30 bg-red-400/10',
}

export function getBotMove(fen: string, depth: number): BotMove | null {
  const chess = new Chess(fen)
  if (chess.isGameOver()) return null

  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) return null

  const isWhiteTurn = chess.turn() === 'w'
  let bestScore = isWhiteTurn ? -Infinity : Infinity
  let bestMove = moves[0]

  // Shuffle para variedad cuando hay empates de puntuación
  const shuffled = [...moves].sort(() => Math.random() - 0.5)

  for (const move of shuffled) {
    chess.move(move)
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !isWhiteTurn)
    chess.undo()

    if (isWhiteTurn ? score > bestScore : score < bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return {
    from: bestMove.from,
    to: bestMove.to,
    promotion: bestMove.promotion,
  }
}
