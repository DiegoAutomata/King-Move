// Types and display labels for the bot difficulty system.
// Engine logic lives in stockfishEngine.ts.

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

export function difficultyFromElo(elo: number): BotDifficulty {
  if (elo < 900)  return 'easy'
  if (elo < 1200) return 'medium'
  if (elo < 1500) return 'hard'
  return 'expert'
}

export const BOT_ELO_LABELS: Record<BotDifficulty, string> = {
  easy:   '~800',
  medium: '~1300',
  hard:   '~1800',
  expert: '~2400',
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
  expert: 'text-red-400   border-red-400/30   bg-red-400/10',
}
