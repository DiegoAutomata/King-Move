import { getNextPuzzle } from '@/features/puzzles/services/puzzleService'

export async function GET() {
  try {
    const puzzle = await getNextPuzzle()
    return Response.json(puzzle)
  } catch {
    return Response.json({ error: 'Failed to fetch puzzle' }, { status: 500 })
  }
}
