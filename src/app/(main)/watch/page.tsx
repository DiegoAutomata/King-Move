"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MonitorPlay, Users, Clock, Zap, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LiveGame {
  id: string;
  white_name: string;
  black_name: string;
  white_elo: number;
  black_elo: number;
  game_type: string;
  bet_amount: number;
  time_control: string;
  move_count: number;
  created_at: string;
}

export default function WatchPage() {
  const router = useRouter();
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadGames() {
      const { data } = await supabase
        .from("games")
        .select(`
          id, game_type, bet_amount, time_control, moves, created_at,
          white:profiles!games_player_white_fkey(full_name, email, elo),
          black:profiles!games_player_black_fkey(full_name, email, elo)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        const mapped: LiveGame[] = data.map((g: any) => ({
          id: g.id,
          white_name: g.white?.full_name ?? g.white?.email?.split("@")[0] ?? "Player",
          black_name: g.black?.full_name ?? g.black?.email?.split("@")[0] ?? "Player",
          white_elo: g.white?.elo ?? 1200,
          black_elo: g.black?.elo ?? 1200,
          game_type: g.game_type,
          bet_amount: Number(g.bet_amount ?? 0),
          time_control: g.time_control ?? "10 min",
          move_count: Array.isArray(g.moves) ? g.moves.length : 0,
          created_at: g.created_at,
        }));
        setGames(mapped);
      }
      setLoading(false);
    }

    loadGames();

    // Realtime: actualizar cuando cambien partidas activas
    const channel = supabase
      .channel("watch:active_games")
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, loadGames)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function elapsed(createdAt: string) {
    const sec = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-10">
        <MonitorPlay className="text-primary-chess" size={36} />
        <div>
          <h1 className="text-4xl font-black text-white">Watch</h1>
          <p className="text-gray-400 font-medium">Live games happening right now</p>
        </div>
        {!loading && (
          <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {games.length} live
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-bg-panel border border-white/5 rounded-xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
            <MonitorPlay size={36} className="text-gray-600" />
          </div>
          <div>
            <p className="text-white font-black text-xl">No games live right now</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to start one!</p>
          </div>
          <button
            onClick={() => router.push("/play")}
            className="bg-primary-chess hover:bg-primary-hover text-black font-black px-6 py-3 rounded-xl transition-all hover:scale-[1.02]"
          >
            Play Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => router.push(`/game/${game.id}`)}
              className="bg-bg-panel border border-gray-800 hover:border-primary-chess/40 rounded-xl p-5 text-left transition-all hover:shadow-gold group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">{game.white_name}</span>
                    <span className="text-gray-600 text-xs">{game.white_elo}</span>
                    <span className="text-gray-500 text-xs">vs</span>
                    <span className="text-white font-bold text-sm">{game.black_name}</span>
                    <span className="text-gray-600 text-xs">{game.black_elo}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-bg-chess border border-white/5 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={9} /> {game.time_control}
                    </span>
                    <span className="text-[10px] bg-bg-chess border border-white/5 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap size={9} /> {game.move_count} moves
                    </span>
                    {game.game_type === "token" && game.bet_amount > 0 && (
                      <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold px-2 py-0.5 rounded-full">
                        ⬡{game.bet_amount} TOKEN
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30">LIVE</span>
                  <span className="text-[10px] text-gray-600 font-mono">{elapsed(game.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-600">
                <span className="flex items-center gap-1">
                  <Users size={11} /> {Math.floor(Math.random() * 3) + 1} watching
                </span>
                <span className="text-primary-chess font-semibold group-hover:underline flex items-center gap-1">
                  <Eye size={11} /> Spectate →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
