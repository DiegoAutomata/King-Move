"use client"

import { useState, useTransition } from "react"
import { PuzzleBoard } from "@/features/puzzles/components/PuzzleBoard"
import { awardPuzzleXp } from "@/actions/xp"
import type { LichessPuzzle } from "@/features/puzzles/types"

interface PuzzlesClientProps {
  initialPuzzle: LichessPuzzle
}

export function PuzzlesClient({ initialPuzzle }: PuzzlesClientProps) {
  const [puzzle] = useState<LichessPuzzle>(initialPuzzle)
  const [solved, setSolved] = useState(false)
  const [xpToast, setXpToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleSolved() {
    setSolved(true)
    startTransition(async () => {
      const result = await awardPuzzleXp()
      if (result.success && result.xpGained) {
        const msg = result.achievementUnlocked
          ? `+${result.xpGained} XP · 🏆 Puzzle Addict unlocked!`
          : `+${result.xpGained} XP`
        setXpToast(msg)
        setTimeout(() => setXpToast(null), 4000)
      }
    })
  }

  return (
    <div className="relative w-full h-full">
      <PuzzleBoard
        puzzle={puzzle}
        onSolved={handleSolved}
        onNext={solved ? () => window.location.reload() : undefined}
      />

      {/* XP Toast */}
      {xpToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-primary-chess text-black font-black text-sm px-4 py-2 rounded-full shadow-gold">
            ⚡ {xpToast} earned!
          </div>
        </div>
      )}
    </div>
  )
}
