import Link from "next/link";
import Image from "next/image";
import { Play, Crown, ShieldCheck, GraduationCap, TrendingUp, Lock, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const leagues = [
  { icon: "🥉", name: "Bronze", elo: "0 – 1000", bet: "1 – 5 $KING", color: "border-amber-700/30 bg-amber-900/10" },
  { icon: "🥈", name: "Silver", elo: "1000 – 1400", bet: "5 – 25 $KING", color: "border-slate-500/30 bg-slate-800/10" },
  { icon: "🥇", name: "Gold", elo: "1400 – 1800", bet: "25 – 100 $KING", color: "border-yellow-500/40 bg-yellow-900/10 ring-1 ring-primary-chess/20" },
  { icon: "💎", name: "Platinum", elo: "1800 – 2200", bet: "100 – 500 $KING", color: "border-sky-500/30 bg-sky-900/10" },
  { icon: "👑", name: "Diamond", elo: "2200+", bet: "500+ $KING", color: "border-violet-500/30 bg-violet-900/10" },
];

async function getStats() {
  try {
    const supabase = await createClient();
    const [playersRes, gamesRes, puzzleRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("games").select("id", { count: "exact", head: true }).eq("status", "finished"),
      supabase.from("profiles").select("puzzle_count").then(({ data }) =>
        (data ?? []).reduce((s, p) => s + (p.puzzle_count ?? 0), 0)
      ),
    ]);
    return {
      players: playersRes.count ?? 0,
      games: gamesRes.count ?? 0,
      puzzles: typeof puzzleRes === "number" ? puzzleRes : 0,
    };
  } catch {
    return { players: 0, games: 0, puzzles: 0 };
  }
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return String(n);
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="flex flex-col w-full">

      {/* ── HERO ── */}
      <section className="relative flex flex-col lg:flex-row items-center gap-12 px-6 py-16 lg:py-24 max-w-7xl mx-auto w-full">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-chess/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-10">
          <div className="flex items-center gap-2 bg-primary-chess/10 border border-primary-chess/20 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold text-primary-chess">
            <Crown size={14} />
            The New Standard in Competitive Chess
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6">
            Play Chess.<br />
            <span className="text-gold-gradient">Earn $KING Tokens.</span>
          </h1>

          <p className="text-gray-400 text-xl max-w-xl mb-8 leading-relaxed">
            Join King Move — the platform where skill earns you tokens. Play free, climb levels, unlock token betting.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/play"
              className="flex items-center justify-center gap-2 bg-primary-chess hover:bg-primary-hover text-black font-black py-4 px-8 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-gold text-lg"
            >
              <Play fill="black" size={20} />
              Play Now — Free
            </Link>
            <Link
              href="/learn"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-8 rounded-xl transition-colors text-lg"
            >
              <GraduationCap size={20} />
              AI Tutor
            </Link>
          </div>

          {/* Stats reales */}
          <div className="flex items-center gap-8 mt-10 text-gray-500">
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-2xl font-black text-white">{stats.players > 0 ? fmt(stats.players) : "—"}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">Players</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden lg:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-2xl font-black text-primary-chess">{stats.games > 0 ? fmt(stats.games) : "—"}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">Games Played</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden lg:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-2xl font-black text-white">{stats.puzzles > 0 ? fmt(stats.puzzles) : "—"}</span>
              <span className="text-xs font-semibold uppercase tracking-wide">Puzzles Solved</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center relative">
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-chess/20 to-transparent blur-2xl" />
            <Image
              src="/king-move-logo.png"
              alt="King Move — A king watching a chess battle"
              fill
              className="object-contain rounded-2xl drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── ELO LEAGUES ── */}
      <section className="px-6 py-16 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Five Leagues. One Ladder.
          </h2>
          <p className="text-gray-400 text-lg">Your ELO unlocks higher stakes. Earn your place at the top.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {leagues.map((league, i) => (
            <div
              key={league.name}
              className={`relative border rounded-2xl p-5 flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-1 ${league.color}`}
            >
              <span className="text-4xl mb-1">{league.icon}</span>
              <h3 className="font-black text-white text-lg">{league.name}</h3>
              <div className="text-xs text-gray-500 font-semibold">{league.elo} ELO</div>
              <div className="mt-auto pt-3 border-t border-white/5 w-full">
                <p className="text-xs text-gray-400 font-semibold mb-1">Bet Range</p>
                <p className="text-primary-chess font-black text-sm">{league.bet}</p>
              </div>
              {i >= 2 && (
                <div className="absolute top-2 right-2">
                  <Lock size={12} className="text-gray-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<ShieldCheck size={28} className="text-primary-chess" />}
            title="Skill-Based Tokens"
            description="Earn $KING tokens by winning games and solving puzzles. Reach Level 10 to unlock token betting."
          />
          <FeatureCard
            icon={<GraduationCap size={28} className="text-primary-chess" />}
            title="AI Grandmaster Tutor"
            description="Analyze any position in real-time with our Gemini-powered chess AI tutor tailored to your ELO level."
          />
          <FeatureCard
            icon={<TrendingUp size={28} className="text-primary-chess" />}
            title="ELO-Based Leagues"
            description="The better you play, the higher you climb. Access richer leagues and bigger prizes as you improve."
          />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-20 max-w-4xl mx-auto w-full text-center">
        <div className="bg-gradient-to-br from-primary-chess/10 to-transparent border border-primary-chess/20 rounded-3xl p-12">
          <Crown size={48} className="text-primary-chess mx-auto mb-6" />
          <h2 className="text-4xl font-black text-white mb-4">Ready to Make Your Move?</h2>
          <p className="text-gray-400 text-xl mb-8">Join King Move. Play smart. Earn $KING.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary-chess hover:bg-primary-hover text-black font-black py-4 px-10 rounded-xl text-lg transition-all hover:scale-105 shadow-gold"
          >
            Create Free Account <ChevronRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-bg-panel border border-white/5 hover:border-primary-chess/20 rounded-2xl p-6 flex flex-col gap-4 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-primary-chess/10 border border-primary-chess/20 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
