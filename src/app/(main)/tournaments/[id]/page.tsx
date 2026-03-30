"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Crown, Clock, Users, ArrowLeft, Loader2, Swords, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Participant {
  id: string;
  user_id: string;
  seed: number | null;
  eliminated_round: number | null;
  profile: { full_name: string | null; email: string; elo: number };
}

interface Match {
  id: string;
  round: number;
  match_number: number;
  player_white: string | null;
  player_black: string | null;
  game_id: string | null;
  winner_id: string | null;
  status: "pending" | "active" | "finished" | "bye";
  white_profile?: { full_name: string | null; email: string };
  black_profile?: { full_name: string | null; email: string };
}

interface TournamentDetail {
  id: string;
  name: string;
  status: "open" | "active" | "finished";
  max_players: number;
  time_control: string;
  prize_pool: number;
  current_round: number;
  total_rounds: number;
  created_by: string;
  winner_id: string | null;
  winner_name?: string;
}

function pName(p?: { full_name: string | null; email: string } | null) {
  if (!p) return "TBD";
  return (p.full_name ?? p.email.split("@")[0]).slice(0, 16);
}

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");

  const isParticipant = participants.some(p => p.user_id === user?.id);
  const isFull = participants.length >= (tournament?.max_players ?? 8);

  async function load() {
    const supabase = createClient();

    const [tRes, pRes, mRes] = await Promise.all([
      supabase
        .from("tournaments")
        .select("*, winner:winner_id(full_name, email)")
        .eq("id", tournamentId)
        .single(),
      supabase
        .from("tournament_participants")
        .select("id, user_id, seed, eliminated_round, profile:user_id(full_name, email, elo)")
        .eq("tournament_id", tournamentId)
        .order("seed"),
      supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round")
        .order("match_number"),
    ]);

    if (tRes.data) {
      const w = tRes.data.winner as unknown as { full_name?: string; email?: string } | null;
      setTournament({
        ...tRes.data,
        winner_name: w?.full_name ?? w?.email?.split("@")[0],
      } as TournamentDetail);
    }
    if (pRes.data) setParticipants(pRes.data as unknown as Participant[]);
    if (mRes.data) {
      // Enrich with player profiles
      const playerIds = [...new Set(
        mRes.data.flatMap(m => [m.player_white, m.player_black].filter(Boolean))
      )] as string[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", playerIds);

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

      setMatches(mRes.data.map(m => ({
        ...m,
        white_profile: m.player_white ? profileMap[m.player_white] : undefined,
        black_profile: m.player_black ? profileMap[m.player_black] : undefined,
      })) as Match[]);
    }

    setLoading(false);
  }

  useEffect(() => { load(); }, [tournamentId]);

  function handleJoin() {
    setActionError("");
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("join_tournament", { p_tournament_id: tournamentId });
      if (error || data?.error) {
        setActionError(data?.error ?? "Failed to join. Try again.");
        return;
      }
      await load();
    });
  }

  function handleLeave() {
    setActionError("");
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("tournament_participants")
        .delete()
        .eq("tournament_id", tournamentId)
        .eq("user_id", user!.id);
      await load();
    });
  }

  const rounds = tournament
    ? Array.from({ length: tournament.total_rounds }, (_, i) => i + 1)
    : [];

  const roundNames: Record<number, string> = {
    1: tournament?.total_rounds === 2 ? "Semifinals" : "Round of " + tournament?.max_players,
    [tournament?.total_rounds ?? 99]: "Final",
    [(tournament?.total_rounds ?? 99) - 1]: tournament?.total_rounds === 3 ? "Semifinals" : "Quarterfinals",
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-chess" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-bold">Tournament not found</p>
        <Link href="/tournaments" className="text-primary-chess underline text-sm">Back to tournaments</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Back */}
      <button onClick={() => router.push("/tournaments")} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm font-semibold mb-6 transition-colors">
        <ArrowLeft size={16} /> All Tournaments
      </button>

      {/* Header */}
      <div className="bg-bg-panel border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-chess/20 border border-primary-chess/30 flex items-center justify-center">
              <Trophy size={28} className="text-primary-chess" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{tournament.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><Users size={13} /> {participants.length}/{tournament.max_players}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} /> {tournament.time_control}</span>
                {tournament.status === "active" && (
                  <span className="text-yellow-400 font-semibold">Round {tournament.current_round}/{tournament.total_rounds}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            {tournament.prize_pool > 0 && (
              <div>
                <p className="text-3xl font-black text-primary-chess">⬡{tournament.prize_pool}</p>
                <p className="text-xs text-gray-500">prize pool</p>
              </div>
            )}
            {tournament.status === "finished" && tournament.winner_name && (
              <div className="flex items-center gap-2 text-yellow-400 font-bold mt-1">
                <Crown size={16} /> {tournament.winner_name}
              </div>
            )}
          </div>
        </div>

        {/* Join/Leave */}
        {tournament.status === "open" && user && !isParticipant && !isFull && (
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="mt-4 bg-primary-chess hover:bg-primary-hover text-black font-black px-6 py-2.5 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trophy size={14} />}
            Join Tournament
          </button>
        )}
        {tournament.status === "open" && user && isParticipant && (
          <button
            onClick={handleLeave}
            disabled={isPending}
            className="mt-4 bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 font-bold px-6 py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            Leave Tournament
          </button>
        )}
        {tournament.status === "open" && isFull && !isParticipant && (
          <p className="mt-4 text-sm text-yellow-400 font-semibold">Tournament is full — starting soon</p>
        )}
        {actionError && <p className="mt-2 text-xs text-red-400">{actionError}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bracket */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {tournament.status === "open" && (
            <div className="bg-bg-panel border border-dashed border-white/10 rounded-2xl p-6 text-center">
              <p className="text-gray-400 font-semibold">Waiting for players</p>
              <p className="text-gray-600 text-sm mt-1">{tournament.max_players - participants.length} spots remaining · bracket generates automatically when full</p>
            </div>
          )}

          {(tournament.status === "active" || tournament.status === "finished") && rounds.map(round => {
            const roundMatches = matches.filter(m => m.round === round);
            return (
              <div key={round}>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
                  {roundNames[round] ?? `Round ${round}`}
                </h3>
                <div className="flex flex-col gap-2">
                  {roundMatches.map(match => {
                    const isMyMatch = user && (match.player_white === user.id || match.player_black === user.id);
                    const myGameLink = match.game_id ? `/game/${match.game_id}` : null;
                    return (
                      <div
                        key={match.id}
                        className={`bg-bg-panel border rounded-xl p-4 flex items-center justify-between transition-colors ${
                          isMyMatch ? "border-primary-chess/30 bg-primary-chess/5" : "border-white/5"
                        }`}
                      >
                        <div className="flex flex-col gap-1 flex-1">
                          {/* White */}
                          <div className={`flex items-center gap-2 text-sm ${match.winner_id === match.player_white ? "text-primary-chess font-black" : match.winner_id && match.winner_id !== match.player_white ? "text-gray-600 line-through" : "text-white font-semibold"}`}>
                            <div className="w-5 h-5 rounded bg-white/90 border border-white/20 shrink-0" />
                            {pName(match.white_profile)}
                          </div>
                          {/* Black */}
                          <div className={`flex items-center gap-2 text-sm ${match.winner_id === match.player_black ? "text-primary-chess font-black" : match.winner_id && match.winner_id !== match.player_black ? "text-gray-600 line-through" : "text-gray-300 font-semibold"}`}>
                            <div className="w-5 h-5 rounded bg-gray-800 border border-white/10 shrink-0" />
                            {pName(match.black_profile)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {match.status === "finished" && match.winner_id && (
                            <Crown size={14} className="text-primary-chess" />
                          )}
                          {match.status === "pending" && isMyMatch && (
                            <Link
                              href="/play"
                              className="flex items-center gap-1.5 bg-primary-chess hover:bg-primary-hover text-black font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                            >
                              <Swords size={12} /> Play
                            </Link>
                          )}
                          {myGameLink && (
                            <Link href={myGameLink} className="text-gray-500 hover:text-gray-300 transition-colors">
                              <ChevronRight size={16} />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Participants */}
        <div>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
            Players ({participants.length}/{tournament.max_players})
          </h3>
          <div className="bg-bg-panel border border-white/5 rounded-xl overflow-hidden">
            {participants.length === 0 ? (
              <p className="text-center py-8 text-gray-600 text-sm">No players yet</p>
            ) : (
              participants.map((p, i) => {
                const name = (p.profile?.full_name ?? p.profile?.email?.split("@")[0] ?? "?").slice(0, 16);
                const isMe = p.user_id === user?.id;
                const eliminated = p.eliminated_round !== null;
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${eliminated ? "opacity-40" : ""}`}>
                    <span className="text-xs text-gray-600 w-5 text-right font-bold">
                      {p.seed ?? i + 1}
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isMe ? "bg-primary-chess/20 text-primary-chess border border-primary-chess/30" : "bg-white/5 text-gray-400"}`}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-primary-chess" : "text-gray-200"}`}>
                        {name} {isMe ? "(you)" : ""}
                      </p>
                      <p className="text-[10px] text-gray-600">{p.profile?.elo ?? 1200} ELO</p>
                    </div>
                    {eliminated && <span className="text-[10px] text-red-400 font-bold">Out R{p.eliminated_round}</span>}
                    {tournament.winner_id === p.user_id && <Crown size={14} className="text-yellow-400" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
