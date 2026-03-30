"use client";

import { useState, useEffect, useTransition } from "react";
import { Trophy, Users, Clock, Crown, Plus, Loader2, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerLevel } from "@/hooks/usePlayerLevel";

interface Tournament {
  id: string;
  name: string;
  status: "open" | "active" | "finished";
  max_players: number;
  time_control: string;
  prize_pool: number;
  prize_currency: string;
  current_round: number;
  total_rounds: number;
  created_at: string;
  participant_count: number;
  winner_name?: string;
}

const STATUS_BADGE: Record<string, string> = {
  open: "bg-green-900/40 text-green-400 border-green-800/40",
  active: "bg-yellow-900/40 text-yellow-400 border-yellow-800/40",
  finished: "bg-gray-800 text-gray-500 border-gray-700",
};

export default function TournamentsPage() {
  const { user } = useAuth();
  const { tokenBalance, canPlayToken } = usePlayerLevel();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("tournaments")
      .select(`
        id, name, status, max_players, time_control, prize_pool, prize_currency,
        current_round, total_rounds, created_at,
        winner:winner_id(full_name, email),
        tournament_participants(count)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setTournaments(data.map((t) => ({
        ...t,
        participant_count: (t.tournament_participants as unknown as { count: number }[])?.[0]?.count ?? 0,
        winner_name: (t.winner as unknown as { full_name?: string; email?: string } | null)?.full_name ??
                     (t.winner as unknown as { full_name?: string; email?: string } | null)?.email?.split("@")[0],
      })));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="text-primary-chess" size={32} />
          <div>
            <h1 className="text-3xl font-black text-white">Tournaments</h1>
            <p className="text-gray-400 text-sm">Single elimination · Win $KING prizes</p>
          </div>
        </div>
        {user && canPlayToken && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary-chess hover:bg-primary-hover text-black font-black px-5 py-2.5 rounded-xl transition-all hover:scale-105 shadow-gold text-sm"
          >
            <Plus size={16} /> Create Tournament
          </button>
        )}
        {user && !canPlayToken && (
          <div className="flex items-center gap-2 text-gray-500 text-sm bg-white/5 border border-white/5 rounded-xl px-4 py-2">
            <Lock size={14} /> Level 10 to host
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateTournamentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
          tokenBalance={tokenBalance}
          userId={user?.id ?? ""}
        />
      )}

      {/* Tournaments list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary-chess" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-20">
          <Trophy size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold text-lg">No tournaments yet</p>
          <p className="text-gray-600 text-sm mt-1">Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.id}`}
              className="block bg-bg-panel border border-white/5 hover:border-primary-chess/20 rounded-2xl p-5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Status badge */}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_BADGE[t.status]}`}>
                    {t.status}
                  </span>
                  <div>
                    <h3 className="font-black text-white text-lg leading-tight">{t.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {t.participant_count}/{t.max_players} players
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {t.time_control}
                      </span>
                      {t.status === "active" && (
                        <span className="text-yellow-400 font-semibold">
                          Round {t.current_round}/{t.total_rounds}
                        </span>
                      )}
                      {t.status === "finished" && t.winner_name && (
                        <span className="text-primary-chess flex items-center gap-1">
                          <Crown size={11} /> {t.winner_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {t.prize_pool > 0 && (
                    <div className="text-right">
                      <p className="text-xl font-black text-primary-chess">⬡{t.prize_pool}</p>
                      <p className="text-[10px] text-gray-500">prize pool</p>
                    </div>
                  )}
                  <ChevronRight size={16} className="text-gray-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create Tournament Modal ───────────────────────────────────────────────────

function CreateTournamentModal({
  onClose, onCreated, tokenBalance, userId,
}: {
  onClose: () => void;
  onCreated: () => void;
  tokenBalance: number;
  userId: string;
}) {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<4 | 8 | 16>(8);
  const [timeControl, setTimeControl] = useState("10 min");
  const [prizePool, setPrizePool] = useState(0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) { setError("Tournament name required"); return; }
    if (prizePool > tokenBalance) { setError("Not enough $KING tokens"); return; }

    startTransition(async () => {
      const supabase = createClient();

      // Deduct prize pool from creator's balance
      if (prizePool > 0) {
        const { error: balanceErr } = await supabase
          .from("profiles")
          .update({ token_balance: tokenBalance - prizePool })
          .eq("id", userId);
        if (balanceErr) { setError("Failed to deduct tokens"); return; }
      }

      const { error: createErr } = await supabase.from("tournaments").insert({
        name: name.trim(),
        max_players: maxPlayers,
        time_control: timeControl,
        prize_pool: prizePool,
        prize_currency: "KING",
        created_by: userId,
      });

      if (createErr) { setError("Failed to create tournament"); return; }
      onCreated();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-panel border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-black text-white mb-5">Create Tournament</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Friday Night Blitz"
              className="w-full bg-bg-chess border border-white/10 focus:border-primary-chess/50 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">Players</label>
              <div className="flex gap-2">
                {([4, 8, 16] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setMaxPlayers(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${maxPlayers === n ? "bg-primary-chess text-black" : "bg-bg-chess text-gray-400 border border-white/5"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">Time</label>
              <div className="flex gap-2">
                {["3 min", "10 min"].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeControl(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${timeControl === t ? "bg-primary-chess text-black" : "bg-bg-chess text-gray-400 border border-white/5"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">
              Prize Pool (⬡ $KING) · your balance: {tokenBalance.toFixed(0)}
            </label>
            <div className="flex gap-2">
              {[0, 50, 100, 250, 500].map(n => (
                <button
                  key={n}
                  onClick={() => setPrizePool(n)}
                  disabled={n > tokenBalance}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 ${prizePool === n ? "bg-primary-chess text-black" : "bg-bg-chess text-gray-400 border border-white/5"}`}
                >
                  {n === 0 ? "Free" : `⬡${n}`}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-semibold">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-bold py-3 rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isPending || !name.trim()}
              className="flex-1 bg-primary-chess hover:bg-primary-hover text-black font-black py-3 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
