"use client";
import { useState } from "react";
import { ChessBoardGame } from "@/features/chess-engine/components/ChessBoardGame";
import { Sword, Crown, Loader2, X, Zap, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerLevel } from "@/hooks/usePlayerLevel";
import { useMatchmaking } from "@/features/chess-engine/hooks/useMatchmaking";

type PlayMode = "free" | "token";

const TIME_CONTROLS = ["3 min", "10 min", "30 min"];

const TOKEN_LEAGUES = [
  { icon: "🥉", name: "Bronze",   bet: "1 – 5 $KING" },
  { icon: "🥈", name: "Silver",   bet: "5 – 25 $KING" },
  { icon: "🥇", name: "Gold",     bet: "25 – 100 $KING" },
  { icon: "💎", name: "Platinum", bet: "100 – 500 $KING" },
  { icon: "👑", name: "Diamond",  bet: "500+ $KING" },
];

export default function PlayPage() {
  const { user, profile } = useAuth();
  const { level, tokenBalance, xp, xpToNextLevel, progressPercent, canPlayToken } = usePlayerLevel();

  const [mode, setMode] = useState<PlayMode>("free");
  const [selectedTime, setSelectedTime] = useState("10 min");

  const { status: matchStatus, error: matchError, startSearch, cancelSearch } = useMatchmaking();
  const isSearching = matchStatus === "searching";

  function handleFindOpponent() {
    if (!user || !profile) return;
    startSearch({
      gameType: "free",
      timeControl: selectedTime,
      betAmount: 0,
      userElo: profile.elo,
      userId: user.id,
    });
  }

  return (
    <div className="flex h-[calc(100vh-0px)] w-full overflow-hidden">

      {/* ── Centre: Chess Board ── */}
      <div className="flex-1 min-w-0 bg-bg-chess flex items-center justify-center border-r border-white/5 overflow-hidden p-2">
        <div className="w-full h-full max-w-[680px] max-h-[680px] flex items-center justify-center">
          <ChessBoardGame />
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-72 bg-bg-sidebar flex flex-col overflow-y-auto shrink-0">

        {/* Player XP Card */}
        <div className="p-4 border-b border-white/5">
          <div className="bg-bg-panel border border-white/10 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-chess/20 border border-primary-chess/30 flex items-center justify-center">
                  <Star size={14} className="text-primary-chess" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold leading-none">Level</p>
                  <p className="text-xl font-black text-white leading-none">{level}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold">$KING Balance</p>
                <p className="text-lg font-black text-yellow-400">⬡ {tokenBalance.toFixed(0)}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                <span>{xp} XP</span>
                <span>{xpToNextLevel} XP to Lv.{level + 1}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div
                  className="bg-primary-chess h-1.5 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mode Switch */}
        <div className="p-4 border-b border-white/5">
          <div className="grid grid-cols-2 bg-bg-panel border border-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode("free")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${
                mode === "free"
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Sword size={15} />
              Free Play
            </button>
            <button
              onClick={() => setMode("token")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${
                mode === "token"
                  ? "bg-primary-chess text-black"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Crown size={15} />
              Token Play
            </button>
          </div>
        </div>

        {/* FREE MODE */}
        {mode === "free" && (
          <div className="p-4 flex flex-col gap-4 flex-1">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 block">
                Time Control
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_CONTROLS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedTime === t
                        ? "bg-white/10 text-white border border-white/20"
                        : "bg-bg-panel text-gray-500 hover:text-gray-300 border border-white/5"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* XP rewards info */}
            <div className="bg-bg-panel border border-white/5 rounded-xl p-3 flex flex-col gap-1.5">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">XP Rewards</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Win</span>
                <span className="text-primary-chess font-bold">+20 XP</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Draw</span>
                <span className="text-gray-300 font-bold">+10 XP</span>
              </div>
            </div>

            <div className="mt-auto">
              {isSearching ? (
                <div className="flex flex-col gap-2">
                  <div className="w-full bg-white/5 border border-white/10 text-white font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary-chess" />
                    Searching for opponent...
                  </div>
                  <button
                    onClick={cancelSearch}
                    className="w-full flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs font-semibold py-2 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleFindOpponent}
                  disabled={!user}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-lg py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sword size={20} />
                  Find Opponent
                </button>
              )}
              {matchError && <p className="text-center text-xs text-red-400 mt-2">{matchError}</p>}
              <p className="text-center text-xs text-gray-600 mt-3">
                Free mode — ELO changes, no tokens
              </p>
            </div>
          </div>
        )}

        {/* TOKEN MODE — Coming Soon */}
        {mode === "token" && (
          <div className="p-4 flex flex-col items-center justify-center flex-1 gap-5 text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary-chess/10 border border-primary-chess/20 flex items-center justify-center">
              <Crown size={28} className="text-primary-chess" />
            </div>

            {/* Title */}
            <div>
              <p className="text-white font-black text-xl">Token Play</p>
              <p className="text-primary-chess font-black text-sm mt-0.5 tracking-widest uppercase">Coming Soon</p>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed max-w-[190px]">
              Bet $KING tokens on your games and win real rewards. Launching soon.
            </p>

            {/* Leagues preview */}
            <div className="w-full bg-bg-panel border border-white/5 rounded-xl p-4 text-left">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-3">Leagues Preview</p>
              <div className="flex flex-col gap-1.5">
                {TOKEN_LEAGUES.map((league) => (
                  <div key={league.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-gray-400">
                      <span>{league.icon}</span>
                      <span className="font-semibold">{league.name}</span>
                    </span>
                    <span className="text-primary-chess font-bold">{league.bet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* XP tip */}
            <div className="w-full bg-primary-chess/5 border border-primary-chess/10 rounded-xl p-3">
              <p className="text-xs text-primary-chess/80 font-semibold flex items-center justify-center gap-1.5">
                <Zap size={11} />
                Keep playing free games to be ready when it launches
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
