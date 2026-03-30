"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Trophy, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { PuzzleBoard } from "@/features/puzzles/components/PuzzleBoard";
import { awardPuzzleXp } from "@/actions/xp";
import type { LichessPuzzle } from "@/features/puzzles/types";

const RUSH_SECONDS = 5 * 60; // 5 minutos

function msDisplay(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function PuzzleRushPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [nextPuzzle, setNextPuzzle] = useState<LichessPuzzle | null>(null);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RUSH_SECONDS);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const solvedRef = useRef(0);

  async function fetchPuzzle(): Promise<LichessPuzzle | null> {
    try {
      const res = await fetch("/api/puzzle/next");
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // Pre-fetch next puzzle in background
  async function prefetchNext() {
    const p = await fetchPuzzle();
    setNextPuzzle(p);
  }

  async function startRush() {
    setLoading(true);
    const first = await fetchPuzzle();
    if (!first) { setLoading(false); return; }
    setPuzzle(first);
    prefetchNext();
    setScore(0);
    setXpEarned(0);
    solvedRef.current = 0;
    setTimeLeft(RUSH_SECONDS);
    setPhase("playing");
    setLoading(false);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopRush() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("done");
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSolved = useCallback(() => {
    solvedRef.current += 1;
    setScore(s => s + 1);

    // Award XP
    startTransition(async () => {
      const result = await awardPuzzleXp();
      if (result.success && result.xpGained) {
        setXpEarned(prev => prev + result.xpGained!);
      }
    });

    // Load next puzzle
    if (nextPuzzle) {
      setPuzzle(nextPuzzle);
      setNextPuzzle(null);
      prefetchNext();
    } else {
      fetchPuzzle().then(p => { if (p) setPuzzle(p); });
    }
  }, [nextPuzzle]);

  const urgent = timeLeft <= 30;

  if (phase === "idle") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <div className="w-20 h-20 bg-primary-chess/20 border border-primary-chess/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={36} className="text-primary-chess" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Puzzle Rush</h1>
          <p className="text-gray-400 mb-8">Solve as many puzzles as you can in 5 minutes. Each correct solve earns +5 XP.</p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[["⏱", "5 min", "Time limit"], ["⚡", "+5 XP", "Per puzzle"], ["♟️", "∞", "Puzzles"]].map(([icon, val, label]) => (
              <div key={label} className="bg-bg-panel border border-white/5 rounded-xl p-4">
                <p className="text-2xl mb-1">{icon}</p>
                <p className="text-lg font-black text-white">{val}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={startRush}
            disabled={loading}
            className="w-full bg-primary-chess hover:bg-primary-hover text-black font-black text-xl py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-gold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : <Zap size={22} />}
            {loading ? "Loading..." : "Start Rush!"}
          </button>

          <button
            onClick={() => router.push("/puzzles")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm font-semibold mt-6 mx-auto transition-colors"
          >
            <ArrowLeft size={14} /> Back to Puzzles
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const rating = score >= 20 ? "🏆 Grandmaster" : score >= 10 ? "⭐ Expert" : score >= 5 ? "🎯 Intermediate" : "🌱 Beginner";
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <Trophy size={56} className="text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-black text-white mb-1">Rush Complete!</h1>
          <p className="text-gray-400 mb-8">{rating}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-bg-panel border border-primary-chess/20 rounded-2xl p-6">
              <p className="text-5xl font-black text-white">{score}</p>
              <p className="text-gray-400 text-sm mt-1">Puzzles solved</p>
            </div>
            <div className="bg-bg-panel border border-yellow-500/20 rounded-2xl p-6">
              <p className="text-5xl font-black text-primary-chess">+{xpEarned}</p>
              <p className="text-gray-400 text-sm mt-1">XP earned</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setPhase("idle"); setPuzzle(null); setNextPuzzle(null); }}
              className="flex-1 bg-primary-chess hover:bg-primary-hover text-black font-black py-3.5 rounded-xl transition-all hover:scale-[1.02]"
            >
              Play Again
            </button>
            <button
              onClick={() => router.push("/puzzles")}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all"
            >
              Daily Puzzle
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Board */}
      <div className="flex-1 min-w-0 bg-bg-chess flex items-center justify-center p-4 border-r border-white/5 overflow-hidden">
        <div className="w-full h-full max-w-[600px] max-h-[680px]">
          {puzzle ? (
            <PuzzleBoard
              key={puzzle.id}
              puzzle={puzzle}
              onSolved={handleSolved}
              onNext={undefined}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={32} className="animate-spin text-primary-chess" />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-72 bg-bg-sidebar flex flex-col p-4 gap-4 shrink-0">
        {/* Timer */}
        <div className={`rounded-2xl border p-6 text-center transition-colors ${
          urgent
            ? "bg-red-900/20 border-red-700/40"
            : "bg-bg-panel border-white/5"
        }`}>
          <Clock size={16} className={`mx-auto mb-2 ${urgent ? "text-red-400" : "text-gray-500"}`} />
          <p className={`text-5xl font-black font-mono transition-colors ${
            urgent ? "text-red-400 animate-pulse" : "text-white"
          }`}>
            {msDisplay(timeLeft)}
          </p>
          <p className="text-xs text-gray-500 mt-1">remaining</p>
        </div>

        {/* Score */}
        <div className="bg-bg-panel border border-primary-chess/20 rounded-2xl p-5 text-center">
          <p className="text-5xl font-black text-primary-chess">{score}</p>
          <p className="text-gray-400 text-sm mt-1">Puzzles solved</p>
          {xpEarned > 0 && (
            <p className="text-xs text-yellow-400 font-bold mt-1">+{xpEarned} XP earned</p>
          )}
        </div>

        {/* Tips */}
        <div className="bg-bg-panel border border-white/5 rounded-xl p-4 text-xs text-gray-500 flex-1">
          <p className="font-semibold text-gray-400 mb-2">Tips</p>
          <ul className="space-y-1.5">
            <li>• Puzzles auto-advance on solve</li>
            <li>• Wrong moves don't cost time</li>
            <li>• Each solve = +5 XP</li>
            <li>• Next puzzle pre-loads in background</li>
          </ul>
        </div>

        <button
          onClick={stopRush}
          className="w-full bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 font-bold py-2.5 rounded-xl transition-all text-sm"
        >
          Stop Rush
        </button>
      </div>
    </div>
  );
}
