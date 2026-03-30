"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Trophy, TrendingUp, ArrowRight, Lock, Star } from "lucide-react";
import { usePlayerLevel } from "@/hooks/usePlayerLevel";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export default function TokenPage() {
  const { user } = useAuth();
  const { level, xp, tokenBalance, xpToNextLevel, progressPercent, canPlayToken } = usePlayerLevel();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("transactions")
      .select("id, type, amount, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setTransactions(data); });
  }, [user]);

  const totalEarned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalGames = transactions.filter((t) => t.type === "win").length;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-1">
          <span className="text-3xl">⬡</span>
          $KING Token
        </h1>
        <p className="text-gray-400 text-sm">The in-game currency of King Move. Earn by playing, spend by betting.</p>
      </div>

      {/* Balance card + level */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-bg-panel border border-yellow-500/20 rounded-2xl p-6">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Your Balance</p>
          <p className="text-5xl font-black text-yellow-400 mb-1">⬡ {tokenBalance.toFixed(0)}</p>
          <p className="text-xs text-gray-600">$KING tokens</p>
        </div>

        <div className="bg-bg-panel border border-primary-chess/20 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Level</p>
              <p className="text-4xl font-black text-white">{level}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${canPlayToken ? "bg-primary-chess/20 border border-primary-chess/30" : "bg-white/5 border border-white/10"}`}>
              {canPlayToken ? <Star size={20} className="text-primary-chess" /> : <Lock size={20} className="text-gray-500" />}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-gray-600 mb-1">
              <span>{xp} XP</span>
              <span>{xpToNextLevel} to Lv.{level + 1}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5">
              <div className="bg-primary-chess h-1.5 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard icon={<TrendingUp size={18} className="text-green-400" />} label="Total Earned" value={`⬡ ${totalEarned.toFixed(0)}`} />
        <StatCard icon={<Trophy size={18} className="text-yellow-400" />} label="Games Won" value={String(totalGames)} />
        <StatCard icon={<Zap size={18} className="text-primary-chess" />} label="Total XP" value={`${xp} XP`} />
      </div>

      {/* How to earn */}
      <div className="bg-bg-panel border border-white/5 rounded-2xl p-6 mb-8">
        <h2 className="font-black text-white text-lg mb-4">How to earn $KING</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Win a free game", xp: "+20 XP", token: "", icon: "⚔️" },
            { label: "Win a token game", xp: "+50 XP", token: "+ tokens", icon: "🏆" },
            { label: "Draw", xp: "+10 XP", token: "", icon: "🤝" },
            { label: "Solve a puzzle", xp: "+5 XP", token: "", icon: "🧩" },
            { label: "Unlock achievements", xp: "variable XP", token: "", icon: "🎖️" },
            { label: "Level 10 → bet tokens", xp: "", token: "win opponent's tokens", icon: "💎" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-bg-chess border border-white/5 rounded-xl p-3">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-200">{item.label}</p>
                <div className="flex gap-2 mt-0.5">
                  {item.xp && <span className="text-[10px] text-primary-chess font-bold">{item.xp}</span>}
                  {item.token && <span className="text-[10px] text-yellow-400 font-bold">{item.token}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/play"
          className="flex-1 bg-primary-chess hover:bg-primary-hover text-black font-black py-3.5 rounded-xl text-center flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
        >
          Play & Earn XP <ArrowRight size={18} />
        </Link>
        <Link
          href="/puzzles"
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl text-center flex items-center justify-center gap-2 transition-all"
        >
          Solve Puzzles <ArrowRight size={18} />
        </Link>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="font-black text-white text-lg mb-4">Token History</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-4xl mb-3">⬡</p>
            <p className="font-semibold">No transactions yet.</p>
            <p className="text-sm mt-1">Play games to start earning $KING!</p>
          </div>
        ) : (
          <div className="bg-bg-panel border border-white/5 rounded-2xl overflow-hidden">
            {transactions.map((tx) => {
              const positive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${positive ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      {tx.type === "win" ? "🏆" : tx.type === "demo" ? "🎁" : tx.type === "bet" ? "⚔️" : "⬡"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-200 capitalize">{tx.type.replace("_", " ")}</p>
                      {tx.description && <p className="text-[10px] text-gray-600">{tx.description}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-black ${positive ? "text-green-400" : "text-red-400"}`}>
                      {positive ? "+" : ""}⬡{Math.abs(tx.amount).toFixed(0)}
                    </span>
                    <p className="text-[10px] text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-bg-panel border border-white/5 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}
