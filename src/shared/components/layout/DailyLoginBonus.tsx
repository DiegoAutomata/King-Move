"use client"

import { useEffect, useState } from "react"
import { claimDailyLoginBonus } from "@/actions/xp"
import { useAuth } from "@/hooks/useAuth"
import { Zap } from "lucide-react"

export function DailyLoginBonus() {
  const { user } = useAuth()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    claimDailyLoginBonus().then((result) => {
      if (result.success && !result.alreadyClaimed && result.xpGained) {
        setToast(`Daily bonus: +${result.xpGained} XP`)
        setTimeout(() => setToast(null), 4000)
      }
    })
  }, [user])

  if (!toast) return null

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 bg-bg-sidebar border border-primary-chess/40 text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-gold">
        <Zap size={16} className="text-primary-chess" />
        <span>{toast}</span>
      </div>
    </div>
  )
}
