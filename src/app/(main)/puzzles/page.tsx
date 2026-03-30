import { Suspense } from "react"
import Link from "next/link"
import { Puzzle, Zap, Trophy, Loader2 } from "lucide-react"
import { getDailyPuzzle } from "@/features/puzzles/services/puzzleService"
import { PuzzlesClient } from "./PuzzlesClient"

export default async function PuzzlesPage() {
  let dailyPuzzle = null
  let error = null

  try {
    dailyPuzzle = await getDailyPuzzle()
  } catch (e) {
    error = "Could not load puzzle. Try again later."
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Left: Interactive Board ── */}
      <div className="flex-1 min-w-0 bg-bg-chess flex flex-col items-center justify-center p-4 border-r border-white/5 overflow-hidden">
        {error ? (
          <div className="text-center">
            <p className="text-red-400 font-semibold">{error}</p>
          </div>
        ) : dailyPuzzle ? (
          <div className="w-full h-full max-w-[600px] max-h-[680px]">
            <Suspense fallback={<Loader2 className="animate-spin text-primary-chess" size={32} />}>
              <PuzzlesClient initialPuzzle={dailyPuzzle} />
            </Suspense>
          </div>
        ) : (
          <Loader2 className="animate-spin text-primary-chess" size={32} />
        )}
      </div>

      {/* ── Right Panel ── */}
      <div className="w-72 bg-bg-sidebar flex flex-col overflow-y-auto shrink-0 p-4 gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Puzzle className="text-primary-chess shrink-0" size={24} />
          <div>
            <h1 className="text-xl font-black text-white leading-tight">Puzzles</h1>
            <p className="text-[11px] text-gray-500">Train your tactics</p>
          </div>
        </div>

        {/* Daily puzzle info */}
        {dailyPuzzle && (
          <div className="bg-bg-panel border border-primary-chess/20 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Daily Puzzle</span>
              <span className="text-xs text-primary-chess font-bold bg-primary-chess/10 border border-primary-chess/20 px-2 py-0.5 rounded-full">
                #{dailyPuzzle.id}
              </span>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Rating</p>
                <p className="text-2xl font-black text-white">{dailyPuzzle.rating}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Moves</p>
                <p className="text-2xl font-black text-white">{Math.ceil((dailyPuzzle.moves.length - 1) / 2)}</p>
              </div>
            </div>
            {dailyPuzzle.themes.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full inline-block mr-1 capitalize">
                {t.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            ))}
          </div>
        )}

        {/* Puzzle Rush CTA */}
        <div className="bg-gradient-to-r from-primary-chess/20 to-transparent border border-primary-chess/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-chess/20 rounded-lg flex items-center justify-center">
              <Zap className="text-primary-chess" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Puzzle Rush</h2>
              <p className="text-[10px] text-gray-400">Solve as many as you can in 5 min</p>
            </div>
          </div>
          <Link href="/puzzles/rush" className="block w-full bg-primary-chess hover:bg-primary-hover text-black font-bold py-2 rounded-lg text-sm transition-all hover:scale-[1.02] text-center">
            Start Rush
          </Link>
        </div>

        {/* Stats placeholder */}
        <div className="bg-bg-panel border border-gray-800 rounded-xl p-4">
          <h3 className="font-bold text-gray-400 text-xs uppercase flex items-center gap-2 mb-3">
            <Trophy size={13} className="text-yellow-500" /> Your Progress
          </h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Solved Today</span>
              <span className="font-bold text-white">0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Streak</span>
              <span className="font-bold text-primary-chess">0 🔥</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
