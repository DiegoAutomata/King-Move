"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import {
  ArrowLeft, ArrowRight, ChevronFirst, ChevronLast,
  Loader2, TrendingUp, TrendingDown, Minus, ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PositionEval } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredMove {
  from: string
  to: string
  promotion?: string
  san: string
  fen: string
}

interface MoveClassification {
  label: string
  icon:  string
  color: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCp(ev: PositionEval): number {
  if (ev.mate !== undefined) return ev.mate > 0 ? 10000 : -10000
  return ev.cp ?? 0
}

function classifyMove(
  evalBefore: PositionEval,
  evalAfter:  PositionEval,
  isWhiteMove: boolean,
): MoveClassification {
  const prev = toCp(evalBefore)
  const next = toCp(evalAfter)
  const loss = isWhiteMove
    ? Math.max(0, prev - next)
    : Math.max(0, next - prev)

  if (loss <= 10)  return { label: 'Best',       icon: '!!', color: 'text-cyan-400'   }
  if (loss <= 25)  return { label: 'Excellent',  icon: '!',  color: 'text-green-400'  }
  if (loss <= 50)  return { label: 'Good',       icon: '✓',  color: 'text-green-300'  }
  if (loss <= 100) return { label: 'Inaccuracy', icon: '?!', color: 'text-yellow-400' }
  if (loss <= 200) return { label: 'Mistake',    icon: '?',  color: 'text-orange-400' }
  return               { label: 'Blunder',    icon: '??', color: 'text-red-400'    }
}

function accuracyColor(pct: number): string {
  if (pct >= 80) return 'text-green-400'
  if (pct >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

// ─── EvalBar ──────────────────────────────────────────────────────────────────

function EvalBar({ cp, mate }: { cp?: number; mate?: number }) {
  let score = 0
  let label = "0.0"

  if (mate !== undefined) {
    score = mate > 0 ? 100 : -100
    label = `M${Math.abs(mate)}`
  } else if (cp !== undefined) {
    score = Math.max(-10, Math.min(10, cp / 100))
    label = cp >= 0 ? `+${(cp / 100).toFixed(1)}` : (cp / 100).toFixed(1)
  }

  const whitePct = Math.round(((score + 10) / 20) * 100)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-4 h-48 bg-gray-800 rounded-full overflow-hidden flex flex-col-reverse border border-white/10">
        <div
          className="bg-white rounded-full transition-all duration-500"
          style={{ height: `${whitePct}%` }}
        />
      </div>
      <span className={`text-xs font-black font-mono ${cp !== undefined && cp >= 0 ? "text-white" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const [boardWidth, setBoardWidth] = useState(400)

  const [moves,        setMoves]        = useState<StoredMove[]>([])
  const [moveEvals,    setMoveEvals]    = useState<PositionEval[]>([])
  const [accuracyW,    setAccuracyW]    = useState<number | null>(null)
  const [accuracyB,    setAccuracyB]    = useState<number | null>(null)
  const [flaggedW,     setFlaggedW]     = useState(false)
  const [flaggedB,     setFlaggedB]     = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [playerWhite,  setPlayerWhite]  = useState("")
  const [playerBlack,  setPlayerBlack]  = useState("")
  const [myColor,      setMyColor]      = useState<"white" | "black" | null>(null)

  const analysisReady = moveEvals.length > 0

  const currentFen = useCallback(() => {
    if (currentIndex === 0) return new Chess().fen()
    return moves[currentIndex - 1]?.fen ?? new Chess().fen()
  }, [currentIndex, moves])

  const lastMoveHighlight: Record<string, React.CSSProperties> = {}
  if (currentIndex > 0 && moves[currentIndex - 1]) {
    const m = moves[currentIndex - 1]
    lastMoveHighlight[m.from] = { backgroundColor: "rgba(255, 214, 10, 0.35)" }
    lastMoveHighlight[m.to]   = { backgroundColor: "rgba(255, 214, 10, 0.50)" }
  }

  // Load game + pre-computed analysis
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: game } = await supabase
        .from("games")
        .select("*, white:player_white(full_name, email), black:player_black(full_name, email)")
        .eq("id", gameId)
        .single()

      if (!game) { setLoading(false); return }

      const storedMoves = (game.moves ?? []) as StoredMove[]
      setMoves(storedMoves)
      setCurrentIndex(storedMoves.length)

      if (game.move_evals)          setMoveEvals(game.move_evals as PositionEval[])
      if (game.accuracy_white != null) setAccuracyW(game.accuracy_white)
      if (game.accuracy_black != null) setAccuracyB(game.accuracy_black)
      setFlaggedW(game.cheat_flagged_white ?? false)
      setFlaggedB(game.cheat_flagged_black ?? false)

      type PlayerRow = { full_name?: string; email?: string }
      const w = (game as unknown as { white?: PlayerRow }).white
      const b = (game as unknown as { black?: PlayerRow }).black
      setPlayerWhite(w?.full_name ?? w?.email?.split("@")[0] ?? "White")
      setPlayerBlack(b?.full_name ?? b?.email?.split("@")[0] ?? "Black")

      if (user) {
        setMyColor(
          game.player_white === user.id ? "white"
            : game.player_black === user.id ? "black"
            : null
        )
      }
      setLoading(false)
    }
    load()
  }, [gameId, user])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")  setCurrentIndex(i => Math.max(0, i - 1))
      if (e.key === "ArrowRight") setCurrentIndex(i => Math.min(moves.length, i + 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [moves.length])

  // Responsive board
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      setBoardWidth(Math.max(200, Math.min(width, height) - 8))
    }
    measure()
    const obs = new ResizeObserver(measure)
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Eval for the current position
  const currentEval: PositionEval | null = moveEvals[currentIndex] ?? null

  // Classification per move (computed from consecutive pre-stored evals)
  const classifications: (MoveClassification | null)[] = moves.map((_, i) => {
    if (!analysisReady) return null
    const before = moveEvals[i]
    const after  = moveEvals[i + 1]
    if (!before || !after) return null
    if (before.cp === undefined && before.mate === undefined) return null
    if (after.cp  === undefined && after.mate  === undefined) return null
    return classifyMove(before, after, i % 2 === 0)
  })

  const movePairs = moves.reduce<{
    white: string; black?: string
    num: number; wIdx: number; bIdx?: number
  }[]>((acc, m, i) => {
    if (i % 2 === 0) acc.push({ num: Math.floor(i / 2) + 1, white: m.san, wIdx: i + 1 })
    else { acc[acc.length - 1].black = m.san; acc[acc.length - 1].bIdx = i + 1 }
    return acc
  }, [])

  const isFlipped = myColor === "black"

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-chess" />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">

      {/* ── Board area ── */}
      <div className="flex-1 min-w-0 bg-bg-chess flex items-center justify-center p-3 overflow-hidden border-r border-white/5">
        <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center gap-2 max-w-[700px]">

          {/* Anti-cheat banner — only for the flagged player */}
          {((myColor === 'white' && flaggedW) || (myColor === 'black' && flaggedB)) && (
            <div style={{ width: boardWidth }} className="flex items-center gap-2 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2 text-xs text-red-400">
              <ShieldAlert size={14} className="shrink-0" />
              This game has been flagged for review.
            </div>
          )}

          {/* Black player bar */}
          <div style={{ width: boardWidth }} className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg shrink-0">
            <span className="font-bold text-gray-300 text-sm">{isFlipped ? playerWhite : playerBlack}</span>
            {(() => {
              const acc = isFlipped ? accuracyW : accuracyB
              return acc !== null ? <span className={`text-sm font-black ${accuracyColor(acc)}`}>{acc}%</span> : null
            })()}
          </div>

          {/* Board + eval bar */}
          <div className="flex items-center gap-3">
            <EvalBar cp={currentEval?.cp} mate={currentEval?.mate} />

            {(Chessboard as unknown as (props: object) => React.ReactElement)({
              id: "Analysis",
              position: currentFen(),
              boardWidth,
              boardOrientation: isFlipped ? "black" : "white",
              arePiecesDraggable: false,
              customDarkSquareStyle:  { backgroundColor: "#b58863" },
              customLightSquareStyle: { backgroundColor: "#f0d9b5" },
              customSquareStyles: lastMoveHighlight,
            })}
          </div>

          {/* White player bar */}
          <div style={{ width: boardWidth }} className="flex justify-between items-center bg-bg-panel border border-white/5 px-3 py-2 rounded-lg shrink-0">
            <span className="font-bold text-gray-300 text-sm">{isFlipped ? playerBlack : playerWhite}</span>
            {(() => {
              const acc = isFlipped ? accuracyB : accuracyW
              return acc !== null ? <span className={`text-sm font-black ${accuracyColor(acc)}`}>{acc}%</span> : null
            })()}
          </div>

          {/* Navigation controls */}
          <div style={{ width: boardWidth }} className="flex items-center justify-center gap-2 mt-1 shrink-0">
            {[
              { icon: <ChevronFirst size={18} />, action: () => setCurrentIndex(0) },
              { icon: <ArrowLeft    size={18} />, action: () => setCurrentIndex(i => Math.max(0, i - 1)) },
              { icon: <ArrowRight   size={18} />, action: () => setCurrentIndex(i => Math.min(moves.length, i + 1)) },
              { icon: <ChevronLast  size={18} />, action: () => setCurrentIndex(moves.length) },
            ].map(({ icon, action }, k) => (
              <button key={k} onClick={action} className="w-9 h-9 bg-bg-panel border border-white/10 hover:border-primary-chess/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                {icon}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600">← → arrow keys to navigate</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-64 bg-bg-sidebar border-l border-white/5 flex flex-col p-4 gap-4 shrink-0 overflow-y-auto">

        <button
          onClick={() => router.push(`/game/${gameId}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm font-semibold transition-colors shrink-0"
        >
          <ArrowLeft size={16} /> Back to game
        </button>

        {/* Accuracy summary panel */}
        {(accuracyW !== null || accuracyB !== null) && (
          <div className="bg-bg-panel border border-white/5 rounded-xl p-4 shrink-0">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-3">Accuracy</p>
            <div className="flex justify-around">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500 uppercase">White</span>
                <span className={`text-2xl font-black ${accuracyW !== null ? accuracyColor(accuracyW) : 'text-gray-600'}`}>
                  {accuracyW !== null ? `${accuracyW}%` : '—'}
                </span>
              </div>
              <div className="w-px bg-white/5" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500 uppercase">Black</span>
                <span className={`text-2xl font-black ${accuracyB !== null ? accuracyColor(accuracyB) : 'text-gray-600'}`}>
                  {accuracyB !== null ? `${accuracyB}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Analysis pending */}
        {!analysisReady && (
          <div className="bg-bg-panel border border-white/5 rounded-xl p-4 flex items-center gap-3 shrink-0">
            <Loader2 size={14} className="animate-spin text-gray-500 shrink-0" />
            <p className="text-xs text-gray-500">Analysis running in background. Refresh in ~15s.</p>
          </div>
        )}

        {/* Current eval */}
        {currentEval && (currentEval.cp !== undefined || currentEval.mate !== undefined) && (
          <div className="bg-bg-panel border border-white/5 rounded-xl p-4 shrink-0">
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">Evaluation</p>
            <div className="flex items-center gap-2">
              {currentEval.cp !== undefined && currentEval.cp >  50 && <TrendingUp   size={16} className="text-green-400" />}
              {currentEval.cp !== undefined && currentEval.cp < -50 && <TrendingDown  size={16} className="text-red-400"   />}
              {currentEval.cp !== undefined && Math.abs(currentEval.cp) <= 50 && <Minus size={16} className="text-gray-400" />}
              <span className="text-2xl font-black text-white">
                {currentEval.mate !== undefined
                  ? `M${Math.abs(currentEval.mate)}`
                  : currentEval.cp !== undefined
                    ? (currentEval.cp >= 0 ? `+${(currentEval.cp / 100).toFixed(1)}` : (currentEval.cp / 100).toFixed(1))
                    : '—'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {currentEval.cp !== undefined && currentEval.cp >  100 ? 'White is better'
                : currentEval.cp !== undefined && currentEval.cp < -100 ? 'Black is better'
                : currentEval.mate !== undefined ? `Forced mate in ${Math.abs(currentEval.mate)}`
                : 'Equal position'}
            </p>
          </div>
        )}

        {/* Move list with classification icons */}
        <div className="bg-bg-panel border border-white/5 rounded-xl p-3 flex flex-col gap-2 flex-1 min-h-0">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider shrink-0">
            Moves ({moves.length})
          </p>
          <div className="overflow-y-auto flex-1 min-h-0 scrollbar-none">
            {movePairs.map(pair => {
              const wClass = classifications[pair.wIdx - 1]
              const bClass = pair.bIdx !== undefined ? classifications[pair.bIdx - 1] : null
              return (
                <div key={pair.num} className="flex gap-1 text-xs font-mono mb-0.5">
                  <span className="text-gray-600 w-6 shrink-0">{pair.num}.</span>

                  <button
                    onClick={() => setCurrentIndex(pair.wIdx)}
                    className={`w-14 text-left px-1 rounded transition-colors flex items-center gap-0.5 ${
                      currentIndex === pair.wIdx
                        ? 'bg-primary-chess/20 text-primary-chess font-bold'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{pair.white}</span>
                    {wClass && <span className={`text-[9px] ${wClass.color}`}>{wClass.icon}</span>}
                  </button>

                  {pair.black && pair.bIdx !== undefined && (
                    <button
                      onClick={() => setCurrentIndex(pair.bIdx!)}
                      className={`w-14 text-left px-1 rounded transition-colors flex items-center gap-0.5 ${
                        currentIndex === pair.bIdx
                          ? 'bg-primary-chess/20 text-primary-chess font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{pair.black}</span>
                      {bClass && <span className={`text-[9px] ${bClass.color}`}>{bClass.icon}</span>}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
