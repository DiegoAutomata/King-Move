"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface ClockState {
  whiteDisplay: string
  blackDisplay: string
  whiteLow: boolean
  blackLow: boolean
}

function msToDisplay(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function useGameClock({
  whiteTimeMs,
  blackTimeMs,
  lastMoveAt,
  isWhiteTurn,
  status,
  onTimeout,
}: {
  whiteTimeMs: number | null
  blackTimeMs: number | null
  lastMoveAt: string | null
  isWhiteTurn: boolean
  status: string | null
  onTimeout: (loser: "white" | "black") => void
}): ClockState {
  const [white, setWhite] = useState(whiteTimeMs ?? 0)
  const [black, setBlack] = useState(blackTimeMs ?? 0)
  const timedOutRef = useRef(false)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  // Sync when server sends updated times (after each move)
  useEffect(() => {
    setWhite(whiteTimeMs ?? 0)
    setBlack(blackTimeMs ?? 0)
    timedOutRef.current = false
  }, [whiteTimeMs, blackTimeMs, lastMoveAt])

  useEffect(() => {
    if (status !== "active" || whiteTimeMs === null || blackTimeMs === null || !lastMoveAt) return

    timedOutRef.current = false

    const tick = () => {
      const elapsed = Date.now() - new Date(lastMoveAt).getTime()
      if (isWhiteTurn) {
        const remaining = (whiteTimeMs ?? 0) - elapsed
        setWhite(Math.max(0, remaining))
        setBlack(blackTimeMs ?? 0)
        if (remaining <= 0 && !timedOutRef.current) {
          timedOutRef.current = true
          onTimeoutRef.current("white")
        }
      } else {
        const remaining = (blackTimeMs ?? 0) - elapsed
        setBlack(Math.max(0, remaining))
        setWhite(whiteTimeMs ?? 0)
        if (remaining <= 0 && !timedOutRef.current) {
          timedOutRef.current = true
          onTimeoutRef.current("black")
        }
      }
    }

    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [status, whiteTimeMs, blackTimeMs, lastMoveAt, isWhiteTurn])

  return {
    whiteDisplay: msToDisplay(white),
    blackDisplay: msToDisplay(black),
    whiteLow: white > 0 && white < 30_000,
    blackLow: black > 0 && black < 30_000,
  }
}
