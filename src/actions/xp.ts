'use server'

import { createClient } from '@/lib/supabase/server'

interface XpResult {
  success: boolean
  xpGained?: number
  totalXp?: number
  level?: number
  achievementUnlocked?: boolean
  message?: string
}

export async function awardPuzzleXp(): Promise<XpResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('puzzle_solved')

  if (error) {
    if (error.message.includes('Not authenticated')) {
      return { success: false, message: 'Must be logged in.' }
    }
    return { success: false, message: 'Could not award XP.' }
  }

  const result = data as { xp_gained: number; total_xp: number; level: number; achievement_unlocked: boolean }
  return {
    success: true,
    xpGained: result.xp_gained,
    totalXp: result.total_xp,
    level: result.level,
    achievementUnlocked: result.achievement_unlocked,
  }
}

export async function claimDailyLoginBonus(): Promise<XpResult & { alreadyClaimed?: boolean }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('claim_daily_login_bonus')

  if (error) {
    if (error.message.includes('Not authenticated')) {
      return { success: false, message: 'Must be logged in.' }
    }
    return { success: false, message: 'Could not claim daily bonus.' }
  }

  const result = data as { already_claimed: boolean; xp_gained: number; total_xp?: number; level?: number }

  if (result.already_claimed) {
    return { success: true, alreadyClaimed: true, xpGained: 0 }
  }

  return {
    success: true,
    alreadyClaimed: false,
    xpGained: result.xp_gained,
    totalXp: result.total_xp,
    level: result.level,
  }
}
