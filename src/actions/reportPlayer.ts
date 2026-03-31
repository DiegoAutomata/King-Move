'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ReportSchema = z.object({
  gameId:     z.string().uuid(),
  reportedId: z.string().uuid(),
  reason:     z.enum(['cheating', 'harassment', 'stalling', 'other']),
  note:       z.string().max(500).optional(),
})

export async function reportPlayer(
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = ReportSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Invalid input' }

  const { gameId, reportedId, reason, note } = parsed.data

  if (reportedId === user.id) return { success: false, error: 'Cannot report yourself' }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id: reportedId,
    game_id:     gameId,
    reason,
    note:        note ?? null,
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already reported this game' }
    return { success: false, error: 'Could not submit report. Try again.' }
  }

  return { success: true }
}
