"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, TrendingUp, Crown, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";

interface LeaderboardPlayer {
  id: string;
  full_name: string | null;
  email: string;
  elo: number;
  balance: number;
  games_played: number;
  wins: number;
}

interface GameHistory {
  id: string;
  opponent_name: string;
  result: "white" | "black" | "draw";
  my_color: "white" | "black";
  elo_change: number;
  bet_amount: number;
  game_type: "free" | "cash";
  created_at: string;
}

export default function SocialPage() {
  const { user, profile } = useAuth();
  const { balance } = useWallet();
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Top 10 por ELO con balance de wallet
      const { data: topPlayers } = await supabase
        .from("profiles")
        .select("id, full_name, email, elo")
        .order("elo", { ascending: false })
        .limit(10);

      if (topPlayers) {
        // Enriquecer con datos de wallet
        const playerIds = topPlayers.map((p) => p.id);
        const { data: wallets } = await supabase
          .from("wallets")
          .select("user_id, balance")
          .in("user_id", playerIds);

        const { data: gameCounts } = await supabase
          .from("games")
          .select("player_white, player_black, result")
          .eq("status", "finished")
          .or(`player_white.in.(${playerIds.join(",")}),player_black.in.(${playerIds.join(",")})`);

        const walletMap = Object.fromEntries((wallets ?? []).map((w) => [w.user_id, Number(w.balance)]));

        const countMap: Record<string, { played: number; wins: number }> = {};
        for (const g of gameCounts ?? []) {
          [g.player_white, g.player_black].forEach((pid) => {
            if (!pid || !playerIds.includes(pid)) return;
            if (!countMap[pid]) countMap[pid] = { played: 0, wins: 0 };
            countMap[pid].played++;
          });
          if (g.result === "white" && g.player_white) {
            if (!countMap[g.player_white]) countMap[g.player_white] = { played: 0, wins: 0 };
            countMap[g.player_white].wins++;
          } else if (g.result === "black" && g.player_black) {
            if (!countMap[g.player_black]) countMap[g.player_black] = { played: 0, wins: 0 };
            countMap[g.player_black].wins++;
          }
        }

        setLeaderboard(
          topPlayers.map((p) => ({
            ...p,
            balance: walletMap[p.id] ?? 0,
            games_played: countMap[p.id]?.played ?? 0,
            wins: countMap[p.id]?.wins ?? 0,
          }))
        );
      }

      // Historial + stats del usuario
      if (user) {
        const { data: myGames } = await supabase
          .from("games")
          .select("id, player_white, player_black, result, game_type, bet_amount, created_at")
          .eq("status", "finished")
          .or(`player_white.eq.${user.id},player_black.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(10);

        if (myGames && myGames.length > 0) {
          const opponentIds = myGames.map((g) =>
            g.player_white === user.id ? g.player_black : g.player_white
          ).filter(Boolean) as string[];

          const { data: opponentProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", opponentIds);

          const opMap = Object.fromEntries((opponentProfiles ?? []).map((p) => [p.id, p.full_name ?? p.email.split("@")[0]]));

          let wins = 0;
          let totalEarned = 0;

          const historyItems: GameHistory[] = myGames.map((g) => {
            const myColor = g.player_white === user.id ? "white" : "black";
            const oppId = myColor === "white" ? g.player_black : g.player_white;
            const won = g.result === myColor;
            const isDraw = g.result === "draw";

            if (won) wins++;
            let eloChange = won ? 16 : isDraw ? 0 : -16; // aproximado, sin conocer ELOs históricos

            if (g.game_type === "cash" && g.bet_amount > 0) {
              if (won) totalEarned += Number(g.bet_amount) * 1.95;
              else if (!isDraw) totalEarned -= Number(g.bet_amount);
            }

            return {
              id: g.id,
              opponent_name: opMap[oppId ?? ""] ?? "Unknown",
              result: g.result as "white" | "black" | "draw",
              my_color: myColor,
              elo_change: eloChange,
              bet_amount: Number(g.bet_amount),
              game_type: g.game_type,
              created_at: g.created_at,
            };
          });

          setHistory(historyItems);
          setStats({ gamesPlayed: myGames.length, wins, totalEarned });
        }
      }

      setLoading(false);
    }

    load();
  }, [user]);

  const displayName = (p: LeaderboardPlayer) =>
    (p.full_name ?? p.email.split("@")[0]).slice(0, 16);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-10">
        <Users className="text-primary-chess" size={36} />
        <div>
          <h1 className="text-4xl font-black text-white">Community</h1>
          <p className="text-gray-400 font-medium">Top players and global leaderboards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <Crown className="text-yellow-500" size={20} />
              Top Players by ELO
            </h2>
            <div className="bg-bg-panel border border-gray-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-4 px-5 py-3 bg-bg-sidebar border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span>Rank</span>
                <span>Player</span>
                <span className="text-center">ELO</span>
                <span className="text-right">Balance</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-primary-chess" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">No players yet. Be the first!</div>
              ) : (
                leaderboard.map((player, i) => {
                  const rank = i + 1;
                  const isMe = player.id === user?.id;
                  return (
                    <div
                      key={player.id}
                      className={`grid grid-cols-4 items-center px-5 py-4 border-b border-gray-800 last:border-0 transition-colors ${isMe ? "bg-primary-chess/5 border-l-2 border-l-primary-chess" : "hover:bg-bg-hover"}`}
                    >
                      <span className={`font-black text-lg ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-orange-400" : "text-gray-600"}`}>
                        #{rank}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold ${isMe ? "bg-primary-chess/20 text-primary-chess border border-primary-chess/40" : "bg-gray-700 text-gray-300"}`}>
                          {displayName(player)[0]?.toUpperCase()}
                        </div>
                        <span className={`font-semibold ${isMe ? "text-primary-chess" : "text-gray-200"}`}>
                          {displayName(player)}{isMe ? " (you)" : ""}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-white">{player.elo}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-primary-chess">${player.balance.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Historial */}
          {user && history.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Trophy className="text-gray-400" size={20} />
                Recent Games
              </h2>
              <div className="bg-bg-panel border border-gray-800 rounded-2xl overflow-hidden">
                {history.map((g) => {
                  const won = g.result === g.my_color;
                  const isDraw = g.result === "draw";
                  return (
                    <div key={g.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${won ? "bg-green-500" : isDraw ? "bg-gray-500" : "bg-red-500"}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-200">vs {g.opponent_name}</p>
                          <p className="text-[10px] text-gray-500">
                            {g.game_type === "cash" ? `$${g.bet_amount} · ` : ""}
                            {new Date(g.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${won ? "bg-green-900/40 text-green-400" : isDraw ? "bg-gray-800 text-gray-400" : "bg-red-900/40 text-red-400"}`}>
                          {won ? "Win" : isDraw ? "Draw" : "Loss"}
                        </span>
                        <span className={`text-sm font-bold w-12 text-right ${g.elo_change > 0 ? "text-green-400" : g.elo_change < 0 ? "text-red-400" : "text-gray-500"}`}>
                          {g.elo_change > 0 ? "+" : ""}{g.elo_change}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Stats */}
        <div className="flex flex-col gap-4">
          <div className="bg-bg-panel border border-gray-800 rounded-xl p-5">
            <h3 className="font-bold text-gray-400 text-sm uppercase flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary-chess" /> Global Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Registered Players</span>
                <span className="font-bold text-white">{leaderboard.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Games Finished</span>
                <span className="font-bold text-white">{leaderboard.reduce((a, p) => a + p.games_played, 0)}</span>
              </div>
            </div>
          </div>

          {user && (
            <div className="bg-bg-panel border border-gray-800 rounded-xl p-5">
              <h3 className="font-bold text-gray-400 text-sm uppercase flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-yellow-500" /> Your Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Your ELO</span>
                  <span className="font-bold text-white">{profile?.elo ?? 1200}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="font-bold text-green-400">
                    {stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance</span>
                  <span className="font-bold text-primary-chess">${balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Games Played</span>
                  <span className="font-bold text-white">{stats.gamesPlayed}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
