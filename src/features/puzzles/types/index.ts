export interface LichessPuzzle {
  id: string
  fen: string          // FEN de la posición ANTES del primer movimiento del oponente
  moves: string[]      // Secuencia completa: [movOponente, tuMov1, tuMov2, ...]
  rating: number
  themes: string[]
  initialPly: number   // número de medios-movimientos jugados hasta llegar a `fen`
}

export interface PuzzleState {
  puzzle: LichessPuzzle
  boardFen: string           // FEN actual del tablero
  playerColor: 'white' | 'black'
  solutionIndex: number      // índice en moves[] del siguiente movimiento esperado del jugador
  status: 'playing' | 'correct' | 'wrong' | 'solved'
  lastMove: { from: string; to: string } | null
  wrongAttempt: { from: string; to: string } | null
}
