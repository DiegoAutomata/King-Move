import { z } from 'zod'

export const StoredMoveSchema = z.object({
  from:       z.string().length(2),
  to:         z.string().length(2),
  promotion:  z.string().optional(),
  san:        z.string().min(1),
  fen:        z.string().min(10),
})

export type StoredMove = z.infer<typeof StoredMoveSchema>

// Parses raw JSONB from the games.moves column.
// Returns an empty array (and logs) if the data is malformed.
export function parseStoredMoves(raw: unknown): StoredMove[] {
  const result = z.array(StoredMoveSchema).safeParse(raw)
  if (!result.success) {
    console.error('[parseStoredMoves] Invalid moves data:', result.error.issues)
    return []
  }
  return result.data
}
