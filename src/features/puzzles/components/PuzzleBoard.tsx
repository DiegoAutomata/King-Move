"use client"

import { useEffect, useRef, useState } from "react"
import { Chessboard } from "react-chessboard"
import { CheckCircle, XCircle, RotateCcw, ChevronRight, Loader2 } from "lucide-react"
import { usePuzzle } from "../hooks/usePuzzle"
import type { LichessPuzzle } from "../types"

interface PuzzleBoardProps {
  puzzle: LichessPuzzle
  onSolved?: () => void
  onNext?: () => void
}

export function PuzzleBoard({ puzzle, onSolved, onNext }: PuzzleBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [boardWidth, setBoardWidth] = useState(400)
  const { boardFen, playerColor, status, lastMove, wrongAttempt, tryMove, loadPuzzle, resetPuzzle } = usePuzzle()
  const [feedback, setFeedback] = useState<string>("")

  // Cargar puzzle cuando cambie
  useEffect(() => {
    loadPuzzle(puzzle)
    setFeedback("")
  }, [puzzle, loadPuzzle])

  // Feedback sonoro/visual al resolver
  useEffect(() => {
    if (status === 'solved') {
      setFeedback("Puzzle solved!")
      onSolved?.()
    }
  }, [status, onSolved])

  // Responsive board
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      setBoardWidth(Math.max(200, Math.min(width, height) - 4))
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  function onDrop(sourceSquare: string, targetSquare: string, piece: string): boolean {
    const promotion = piece?.toLowerCase().endsWith('p') ? undefined :
      piece?.toLowerCase().slice(1)

    const result = tryMove(sourceSquare, targetSquare, promotion)

    if (result === 'wrong') {
      setFeedback("Not the right move. Try again!")
      return false
    }
    if (result === 'correct') {
      setFeedback("Correct! Keep going...")
    }
    if (result === 'solved') {
      setFeedback("Puzzle solved!")
    }
    return true
  }

  // Highlight squares
  const customSquareStyles: Record<string, React.CSSProperties> = {}

  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: "rgba(255, 214, 10, 0.3)" }
    customSquareStyles[lastMove.to] = { backgroundColor: "rgba(255, 214, 10, 0.5)" }
  }

  if (wrongAttempt) {
    customSquareStyles[wrongAttempt.from] = { backgroundColor: "rgba(239, 68, 68, 0.5)" }
    customSquareStyles[wrongAttempt.to] = { backgroundColor: "rgba(239, 68, 68, 0.5)" }
  }

  if (status === 'solved' && lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: "rgba(34, 197, 94, 0.3)" }
    customSquareStyles[lastMove.to] = { backgroundColor: "rgba(34, 197, 94, 0.5)" }
  }

  const isDraggable = status === 'playing' || status === 'correct'

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full">
      {/* Color indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
        <span className={`w-3 h-3 rounded-full border ${playerColor === 'white' ? 'bg-white border-gray-400' : 'bg-gray-800 border-gray-500'}`} />
        You play as <span className="text-white font-bold capitalize">{playerColor}</span>
        <span className="text-gray-600">· Rating {puzzle.rating}</span>
      </div>

      {/* Board */}
      <div ref={containerRef} className="flex-1 w-full flex items-center justify-center relative">
        {(Chessboard as any)({
          id: `puzzle-${puzzle.id}`,
          position: boardFen,
          onPieceDrop: onDrop,
          boardWidth,
          boardOrientation: playerColor,
          arePiecesDraggable: isDraggable,
          customDarkSquareStyle: { backgroundColor: "#b58863" },
          customLightSquareStyle: { backgroundColor: "#f0d9b5" },
          customSquareStyles,
        })}
      </div>

      {/* Feedback + actions */}
      <div className="w-full" style={{ maxWidth: boardWidth }}>
        {status === 'solved' ? (
          <div className="flex items-center justify-between bg-green-900/30 border border-green-700/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-green-400 font-bold">
              <CheckCircle size={18} />
              {feedback}
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetPuzzle}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 font-semibold px-3 py-1.5 bg-white/5 rounded-lg"
              >
                <RotateCcw size={13} /> Retry
              </button>
              {onNext && (
                <button
                  onClick={onNext}
                  className="flex items-center gap-1.5 text-xs text-primary-chess font-bold px-3 py-1.5 bg-primary-chess/10 border border-primary-chess/30 rounded-lg hover:bg-primary-chess/20"
                >
                  Next <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        ) : status === 'wrong' ? (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 font-bold text-sm">
            <XCircle size={18} />
            {feedback}
          </div>
        ) : (
          <div className="flex items-center justify-between px-2">
            <p className="text-xs text-gray-500 font-semibold">
              {status === 'correct' ? '✓ Correct! Opponent is thinking...' : 'Find the best move'}
            </p>
            <button
              onClick={resetPuzzle}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Themes */}
      {puzzle.themes.length > 0 && status === 'solved' && (
        <div className="flex flex-wrap gap-1.5 justify-center" style={{ maxWidth: boardWidth }}>
          {puzzle.themes.slice(0, 4).map(theme => (
            <span key={theme} className="text-[10px] bg-bg-panel border border-white/10 text-gray-400 px-2 py-0.5 rounded-full capitalize">
              {theme.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
