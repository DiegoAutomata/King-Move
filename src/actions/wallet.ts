'use server'

import { createClient } from '@/lib/supabase/server'

export async function claimDemoCredits(): Promise<{ success: boolean; message: string; amount?: number }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('claim_demo_credits')

  if (error) {
    if (error.message.includes('already claimed')) {
      return { success: false, message: 'You already claimed your demo credits.' }
    }
    if (error.message.includes('Not authenticated')) {
      return { success: false, message: 'You must be logged in.' }
    }
    return { success: false, message: 'Something went wrong. Try again.' }
  }

  return { success: true, message: '$20 demo credits added to your wallet!', amount: data as number }
}
