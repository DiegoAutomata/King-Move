export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  elo: number
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'elo'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
    }
  }
}
