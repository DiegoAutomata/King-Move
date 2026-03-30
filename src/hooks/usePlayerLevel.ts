"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./useAuth"

interface PlayerLevel {
  xp: number
  level: number
  tokenBalance: number
  xpToNextLevel: number
  progressPercent: number
  canPlayToken: boolean
}

const DEFAULT: PlayerLevel = {
  xp: 0,
  level: 1,
  tokenBalance: 0,
  xpToNextLevel: 100,
  progressPercent: 0,
  canPlayToken: false,
}

function computeLevel(xp: number): Pick<PlayerLevel, "level" | "xpToNextLevel" | "progressPercent"> {
  // Nivel N requiere N*100 XP acumulados. Nivel = floor(xp/100)+1, max 20
  const level = Math.min(Math.floor(xp / 100) + 1, 20)
  const xpCurrentLevel = (level - 1) * 100
  const xpNextLevel = level * 100
  const xpToNextLevel = xpNextLevel - xp
  const progressPercent = Math.min(100, Math.round(((xp - xpCurrentLevel) / 100) * 100))
  return { level, xpToNextLevel, progressPercent }
}

export function usePlayerLevel(): PlayerLevel {
  const { user } = useAuth()
  const [data, setData] = useState<PlayerLevel>(DEFAULT)

  useEffect(() => {
    if (!user) {
      setData(DEFAULT)
      return
    }

    const supabase = createClient()

    async function fetch() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level, token_balance")
        .eq("id", user!.id)
        .single()

      if (!profile) return

      const xp = profile.xp ?? 0
      const tokenBalance = Number(profile.token_balance ?? 0)
      const { level, xpToNextLevel, progressPercent } = computeLevel(xp)

      setData({
        xp,
        level,
        tokenBalance,
        xpToNextLevel,
        progressPercent,
        canPlayToken: level >= 10,
      })
    }

    fetch()

    // Suscripción Realtime para XP en vivo
    const channel = supabase
      .channel("player_level")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const p = payload.new as { xp: number; level: number; token_balance: string }
          const xp = p.xp ?? 0
          const tokenBalance = Number(p.token_balance ?? 0)
          const { level, xpToNextLevel, progressPercent } = computeLevel(xp)
          setData({ xp, level, tokenBalance, xpToNextLevel, progressPercent, canPlayToken: level >= 10 })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return data
}
