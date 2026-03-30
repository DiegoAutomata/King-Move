"use client";

import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, Loader2, ChevronRight, Trophy, Swords } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface PlayerResult {
  id: string;
  full_name: string | null;
  email: string;
  elo: number;
  level: number;
  puzzle_count: number;
  win_streak: number;
}

function EloLeague({ elo }: { elo: number }) {
  if (elo >= 2200) return <span className="text-violet-400 text-xs font-bold">👑 Diamond</span>;
  if (elo >= 1800) return <span className="text-sky-400 text-xs font-bold">💎 Platinum</span>;
  if (elo >= 1400) return <span className="text-yellow-400 text-xs font-bold">🥇 Gold</span>;
  if (elo >= 1000) return <span className="text-slate-400 text-xs font-bold">🥈 Silver</span>;
  return <span className="text-amber-700 text-xs font-bold">🥉 Bronze</span>;
}

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, elo, level, puzzle_count, win_streak")
        .or(`full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .order("elo", { ascending: false })
        .limit(20);

      setResults((data ?? []) as PlayerResult[]);
      setSearched(true);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const displayName = (p: PlayerResult) =>
    (p.full_name ?? p.email.split("@")[0]).slice(0, 24);

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <SearchIcon className="text-primary-chess" size={32} />
        <div>
          <h1 className="text-3xl font-black text-white">Find Players</h1>
          <p className="text-gray-400 text-sm">Search by name or username</p>
        </div>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        {loading && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
        )}
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a name or email..."
          className="w-full bg-bg-panel border border-gray-700 focus:border-primary-chess rounded-xl py-3.5 pl-11 pr-10 text-white text-base focus:outline-none focus:ring-1 focus:ring-primary-chess transition-colors"
        />
      </div>

      {/* Results */}
      {query.trim().length < 2 && (
        <p className="text-center text-gray-600 text-sm mt-12">Type at least 2 characters to search</p>
      )}

      {searched && results.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-gray-500 font-semibold">No players found for &ldquo;{query}&rdquo;</p>
          <p className="text-gray-600 text-sm mt-1">Try a different name or email</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-600 mb-1">{results.length} player{results.length !== 1 ? "s" : ""} found</p>
          {results.map((player) => {
            const isMe = player.id === user?.id;
            const name = displayName(player);
            return (
              <div
                key={player.id}
                className={`bg-bg-panel border rounded-xl p-4 flex items-center gap-4 transition-colors ${
                  isMe
                    ? "border-primary-chess/30 bg-primary-chess/5"
                    : "border-white/5 hover:border-white/10"
                }`}
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                  isMe
                    ? "bg-primary-chess/20 border border-primary-chess/40 text-primary-chess"
                    : "bg-white/5 border border-white/10 text-gray-300"
                }`}>
                  {name[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white truncate">{name}</p>
                    {isMe && <span className="text-[10px] bg-primary-chess/20 text-primary-chess px-1.5 py-0.5 rounded font-bold">You</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <EloLeague elo={player.elo} />
                    <span className="text-gray-600 text-xs">Lv.{player.level}</span>
                    {player.puzzle_count > 0 && (
                      <span className="text-gray-600 text-xs flex items-center gap-1">
                        <Trophy size={10} /> {player.puzzle_count}
                      </span>
                    )}
                    {player.win_streak > 0 && (
                      <span className="text-orange-400 text-xs font-bold">{player.win_streak}🔥</span>
                    )}
                  </div>
                </div>

                {/* ELO badge + challenge */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{player.elo}</p>
                    <p className="text-[10px] text-gray-500">ELO</p>
                  </div>
                  {!isMe && (
                    <Link
                      href="/play"
                      className="w-9 h-9 bg-primary-chess/10 hover:bg-primary-chess/20 border border-primary-chess/30 rounded-lg flex items-center justify-center transition-colors"
                      title={`Challenge ${name}`}
                    >
                      <Swords size={15} className="text-primary-chess" />
                    </Link>
                  )}
                  {isMe && (
                    <Link href="/settings">
                      <ChevronRight size={16} className="text-gray-600" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
