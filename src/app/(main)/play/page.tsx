"use client";
import { useState } from "react";
import { ChessBoardGame } from "@/features/chess-engine/components/ChessBoardGame";
import { HandCoins, Info, Crown, Sword, Lock, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type PlayMode = "free" | "cash";

const leagues = [
  {
    id: "bronze",
    name: "Bronze",
    eloMin: 0,
    eloMax: 1000,
    betRange: "$1 – $5",
    bets: [1, 2, 5],
    color: "from-amber-800/30 to-amber-900/10",
    border: "border-amber-700/40",
    accentColor: "text-amber-500",
    badgeColor: "bg-amber-900/50 text-amber-400 border-amber-700/40",
    icon: "🥉",
  },
  {
    id: "silver",
    name: "Silver",
    eloMin: 1000,
    eloMax: 1400,
    betRange: "$5 – $25",
    bets: [5, 10, 25],
    color: "from-slate-600/30 to-slate-700/10",
    border: "border-slate-500/40",
    accentColor: "text-slate-300",
    badgeColor: "bg-slate-800/50 text-slate-300 border-slate-500/40",
    icon: "🥈",
  },
  {
    id: "gold",
    name: "Gold",
    eloMin: 1400,
    eloMax: 1800,
    betRange: "$25 – $100",
    bets: [25, 50, 100],
    color: "from-yellow-700/30 to-yellow-900/10",
    border: "border-yellow-600/40",
    accentColor: "text-primary-chess",
    badgeColor: "bg-yellow-900/50 text-primary-chess border-yellow-600/40",
    icon: "🥇",
  },
  {
    id: "platinum",
    name: "Platinum",
    eloMin: 1800,
    eloMax: 2200,
    betRange: "$100 – $500",
    bets: [100, 250, 500],
    color: "from-sky-800/30 to-sky-900/10",
    border: "border-sky-600/40",
    accentColor: "text-sky-400",
    badgeColor: "bg-sky-900/50 text-sky-400 border-sky-600/40",
    icon: "💎",
  },
  {
    id: "diamond",
    name: "Diamond",
    eloMin: 2200,
    eloMax: 9999,
    betRange: "$500+",
    bets: [500, 1000, 2000],
    color: "from-violet-800/30 to-violet-900/10",
    border: "border-violet-500/40",
    accentColor: "text-violet-400",
    badgeColor: "bg-violet-900/50 text-violet-400 border-violet-500/40",
    icon: "👑",
  },
];

export default function PlayPage() {
  const { profile } = useAuth();
  const USER_ELO = profile?.elo ?? 1200;

  const [mode, setMode] = useState<PlayMode>("free");
  const [selectedLeague, setSelectedLeague] = useState(leagues[1]);
  const [selectedBet, setSelectedBet] = useState(10);
  const [selectedTime, setSelectedTime] = useState("10 min");

  const timeControls = ["3 min", "10 min", "30 min"];

  function isLeagueUnlocked(league: typeof leagues[0]) {
    return USER_ELO >= league.eloMin;
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

        {/* Wallet */}
        <div className="p-4 border-b border-white/5">
          <div className="bg-bg-panel border border-primary-chess/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <HandCoins size={12} className="text-primary-chess" /> Wallet
              </p>
              <p className="text-2xl font-black text-white mt-1">$50.00</p>
            </div>
            <button className="bg-primary-chess/10 hover:bg-primary-chess/20 border border-primary-chess/30 text-primary-chess text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              Deposit
            </button>
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
              onClick={() => setMode("cash")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all ${
                mode === "cash"
                  ? "bg-primary-chess text-black"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Crown size={15} />
              Leagues
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
                {timeControls.map((t) => (
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

            <div className="mt-auto">
              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black text-lg py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                <Sword size={20} />
                Find Opponent
              </button>
              <p className="text-center text-xs text-gray-600 mt-3">
                Practice mode — no ELO change, no money
              </p>
            </div>
          </div>
        )}

        {/* CASH LEAGUES MODE */}
        {mode === "cash" && (
          <div className="p-4 flex flex-col gap-4 flex-1">

            {/* ELO Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold uppercase">Your ELO</span>
              <span className="bg-primary-chess/10 border border-primary-chess/20 text-primary-chess font-black text-sm px-3 py-1 rounded-full">
                {USER_ELO} ELO
              </span>
            </div>

            {/* League Selector */}
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 block">
                Select League
              </label>
              <div className="flex flex-col gap-2">
                {leagues.map((league) => {
                  const unlocked = isLeagueUnlocked(league);
                  const isSelected = selectedLeague.id === league.id && unlocked;
                  return (
                    <button
                      key={league.id}
                      onClick={() => { if (unlocked) { setSelectedLeague(league); setSelectedBet(league.bets[0]); } }}
                      disabled={!unlocked}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-sm font-bold
                        ${isSelected
                          ? `bg-gradient-to-r ${league.color} ${league.border} border-2`
                          : unlocked
                            ? `bg-bg-panel border-white/5 hover:border-white/10`
                            : "bg-bg-panel border-white/5 opacity-40 cursor-not-allowed"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{league.icon}</span>
                        <div className="text-left">
                          <span className={`font-black ${isSelected ? league.accentColor : unlocked ? "text-gray-200" : "text-gray-600"}`}>
                            {league.name}
                          </span>
                          <p className="text-[10px] text-gray-500 font-semibold">{league.betRange}</p>
                        </div>
                      </div>
                      <div>
                        {!unlocked ? (
                          <div className="flex items-center gap-1 text-gray-600 text-xs">
                            <Lock size={12} />
                            <span>{league.eloMin} ELO</span>
                          </div>
                        ) : isSelected ? (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${league.accentColor}`}>
                            <Check size={12} className="text-current" />
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Control */}
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 block">
                Time Control
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeControls.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedTime === t
                        ? "bg-primary-chess/20 text-primary-chess border border-primary-chess/30"
                        : "bg-bg-panel text-gray-500 hover:text-gray-300 border border-white/5"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Selector */}
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 flex justify-between">
                <span>Bet Amount</span>
                <span className="text-gray-600 normal-case font-normal">5% fee</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {selectedLeague.bets.map((bet) => (
                  <button
                    key={bet}
                    onClick={() => setSelectedBet(bet)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedBet === bet
                        ? "bg-primary-chess text-black"
                        : "bg-bg-panel text-gray-400 hover:text-white border border-white/5"
                    }`}
                  >
                    ${bet}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
                <Info size={12} />
                To win: ${(selectedBet * 2 * 0.95).toFixed(2)}
              </div>
            </div>

            <div className="mt-auto">
              <button className="w-full bg-primary-chess hover:bg-primary-hover text-black font-black text-lg py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-gold flex items-center justify-center gap-2">
                <Crown size={20} />
                PLAY ${selectedBet}
              </button>
              <p className="text-center text-[10px] text-gray-600 mt-3 leading-relaxed">
                By playing you agree to our Terms. Cheating = permanent ban.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
