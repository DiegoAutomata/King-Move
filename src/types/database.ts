export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  elo: number
  xp: number
  level: number
  token_balance: number
  win_streak: number
  puzzle_count: number
  last_daily_login: string | null
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  updated_at: string
}

export interface PositionEval {
  cp?: number       // centipawns from White's perspective
  mate?: number     // positive = White mates, negative = Black mates
  bestMove?: string // UCI format e.g. "e2e4" or "e7e8q"
}

export interface Game {
  id: string
  player_white: string | null
  player_black: string | null
  fen_final: string | null
  pgn: string | null
  result: 'white' | 'black' | 'draw' | null
  game_type: 'free' | 'token'
  bet_amount: number
  time_control: string
  status: 'waiting' | 'active' | 'finished' | 'aborted'
  moves: unknown[]
  white_time_ms: number | null
  black_time_ms: number | null
  last_move_at: string | null
  created_at: string
  finished_at: string | null
  // Analysis & anti-cheat (populated async after game finishes)
  accuracy_white:      number | null
  accuracy_black:      number | null
  cheat_score_white:   number | null
  cheat_score_black:   number | null
  cheat_flagged_white: boolean
  cheat_flagged_black: boolean
  anti_cheat_checked:  boolean
  move_evals:          PositionEval[] | null
}

export interface Transaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'bet_win' | 'bet_loss' | 'fee' | 'demo'
  amount: number
  game_id: string | null
  description: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'elo'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      wallets: {
        Row: Wallet
        Insert: Omit<Wallet, 'id' | 'updated_at'>
        Update: Partial<Omit<Wallet, 'id' | 'user_id'>>
      }
      games: {
        Row: Game
        Insert: Omit<Game, 'id' | 'created_at'>
        Update: Partial<Omit<Game, 'id' | 'created_at'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: never
      }
    }
  }
}
