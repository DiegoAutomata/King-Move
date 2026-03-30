"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Sword, Puzzle, Zap, Trophy, Crown, ArrowRight, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerLevel } from "@/hooks/usePlayerLevel";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  puzzlesSolved: number;
  totalXpThisWeek: number;
  recentGames: RecentGame[];
  unlockedAchievements: number;
}

interface RecentGame {
  id: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  eloChange: number;
  gameType: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { level, xp, tokenBalance, progressPercent, xpToNextLevel, canPlayToken } = usePlayerLevel();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function load() {
      const [gamesRes, achievementsRes, profileRes] = await Promise.all([
        supabase
          .from("games")
          .select("id, player_white, player_black, result, game_type, created_at")
          .or(`player_white.eq.${user!.id},player_black.eq.${user!.id}`)
          .eq("status", "finished")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("achievements")
          .select("id")
          .eq("user_id", user!.id),
        supabase
          .from("profiles")
          .select("puzzle_count")
          .eq("id", user!.id)
          .single(),
      ]);

      const games = gamesRes.data ?? [];
      const achievements = achievementsRes.data ?? [];
      const puzzleCount = profileRes.data?.puzzle_count ?? 0;

      let wins = 0, draws = 0, losses = 0;
      const recentGames: RecentGame[] = [];

      for (const g of games) {
        const isWhite = g.player_white === user!.id;
        const myResult = g.result === "draw" ? "draw" : (g.result === "white") === isWhite ? "win" : "loss";
        if (myResult === "win") wins++;
        else if (myResult === "draw") draws++;
        else losses++;

        if (recentGames.length < 5) {
          recentGames.push({
            id: g.id,
            opponent: "Opponent",
            result: myResult,
            eloChange: myResult === "win" ? 16 : myResult === "draw" ? 0 : -16,
            gameType: g.game_type,
            createdAt: g.created_at,
          });
        }
      }

      const total = games.length;
      setStats({
        gamesPlayed: total,
        wins,
        draws,
        losses,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
        puzzlesSolved: puzzleCount,
        totalXpThisWeek: xp,
        recentGames,
        unlockedAchievements: achievements.length,
      });
      setLoading(false);
    }

    load();
  }, [user, xp]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const name = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Champion";

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gray-500 text-sm font-semibold">{greeting()},</p>
        <h1 className="text-4xl font-black text-white mt-0.5">{name} <span className="text-primary-chess">⬡</span></h1>
        <p className="text-gray-500 text-sm mt-1">
          {profile?.elo ?? 1200} ELO · Level {level} · {tokenBalance.toFixed(0)} $KING
        </p>
      </div>

      {/* XP Progress */}
      <div className="bg-bg-panel border border-primary-chess/20 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary-chess" />
            <span className="font-black text-white">Level {level}</span>
            {canPlayToken && (
              <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold px-2 py-0.5 rounded-full">
                Token Play Unlocked 🔓
              </span>
            )}
          </div>
          <span className="text-sm text-gray-400">{xpToNextLevel} XP to Level {level + 1}</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-primary-chess to-yellow-400 h-2.5 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">{xp} XP total</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Sword size={18} className="text-primary-chess" />} label="Games Played" value={loading ? "—" : String(stats?.gamesPlayed ?? 0)} />
        <StatCard icon={<TrendingUp size={18} className="text-green-400" />} label="Win Rate" value={loading ? "—" : `${stats?.winRate ?? 0}%`} />
        <StatCard icon={<Puzzle size={18} className="text-blue-400" />} label="Puzzles Solved" value={loading ? "—" : String(stats?.puzzlesSolved ?? 0)} />
        <StatCard icon={<Trophy size={18} className="text-yellow-400" />} label="Achievements" value={loading ? "—" : `${stats?.unlockedAchievements ?? 0}/6`} />
      </div>

      {/* Win/Loss breakdown */}
      {!loading && stats && stats.gamesPlayed > 0 && (
        <div className="bg-bg-panel border border-white/5 rounded-2xl p-5 mb-6">
          <h2 className="font-black text-white text-sm uppercase tracking-wider mb-4">Record</h2>
          <div className="flex gap-3">
            <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-green-400">{stats.wins}</p>
              <p className="text-xs text-gray-500">Wins</p>
            </div>
            <div className="flex-1 bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-400">{stats.draws}</p>
              <p className="text-xs text-gray-500">Draws</p>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-red-400">{stats.losses}</p>
              <p className="text-xs text-gray-500">Losses</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent games */}
      {!loading && stats && stats.recentGames.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-white">Recent Games</h2>
            <Link href="/social" className="text-xs text-primary-chess hover:text-primary-hover flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="bg-bg-panel border border-white/5 rounded-2xl overflow-hidden">
            {stats.recentGames.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    g.result === "win" ? "bg-green-500/10 text-green-400" :
                    g.result === "draw" ? "bg-gray-500/10 text-gray-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {g.result === "win" ? "W" : g.result === "draw" ? "D" : "L"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200 capitalize">{g.gameType} game</p>
                    <p className="text-[10px] text-gray-600">{new Date(g.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-sm font-black ${g.eloChange > 0 ? "text-green-400" : g.eloChange < 0 ? "text-red-400" : "text-gray-500"}`}>
                  {g.eloChange > 0 ? "+" : ""}{g.eloChange} ELO
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <QuickAction href="/play" icon={<Sword size={20} />} label="Play Now" desc="Find an opponent" primary />
        <QuickAction href="/puzzles" icon={<Puzzle size={20} />} label="Daily Puzzle" desc="+5 XP" />
        <QuickAction href="/learn" icon={<Flame size={20} />} label="AI Tutor" desc="Improve your game" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-bg-panel border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, desc, primary }: { href: string; icon: React.ReactNode; label: string; desc: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all hover:scale-[1.02] text-center ${
        primary
          ? "bg-primary-chess text-black border-primary-chess hover:bg-primary-hover"
          : "bg-bg-panel border-white/5 hover:border-white/20 text-white"
      }`}
    >
      <div className={primary ? "text-black" : "text-primary-chess"}>{icon}</div>
      <div>
        <p className="font-black text-sm">{label}</p>
        <p className={`text-[11px] ${primary ? "text-black/60" : "text-gray-500"}`}>{desc}</p>
      </div>
    </Link>
  );
}
