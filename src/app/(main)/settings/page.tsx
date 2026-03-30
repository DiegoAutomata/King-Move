"use client";

import { useState, useTransition, useEffect } from "react";
import { Settings, User, Bell, ShieldCheck, Trophy, Palette, Loader2, Check, ChevronDown, ChevronUp, Star, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerLevel } from "@/hooks/usePlayerLevel";
import { updateProfile } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";

const ACHIEVEMENT_META: Record<string, { label: string; desc: string; icon: string }> = {
  first_blood:   { label: "First Blood",    desc: "Win your first game",          icon: "⚔️" },
  puzzle_addict: { label: "Puzzle Addict",  desc: "Solve 10 puzzles",             icon: "🧩" },
  streak_master: { label: "Streak Master",  desc: "Win 5 games in a row",         icon: "🔥" },
  elo_climber:   { label: "ELO Climber",    desc: "Reach 1400 ELO",               icon: "📈" },
  diamond_hands: { label: "Diamond Hands",  desc: "Reach Level 10",               icon: "💎" },
  comeback_king: { label: "Comeback King",  desc: "Win from a losing position",   icon: "👑" },
};

interface Achievement {
  id: string;
  achievement_key: string;
  xp_awarded: number;
  unlocked_at: string;
}

export default function SettingsPage() {
  const { profile } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>("profile");

  function toggle(section: string) {
    setOpenSection((prev) => (prev === section ? null : section));
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-10">
        <Settings className="text-primary-chess" size={36} />
        Settings
      </h1>

      <div className="space-y-3">

        {/* Profile */}
        <Accordion
          open={openSection === "profile"}
          onToggle={() => toggle("profile")}
          icon={<User size={20} />}
          title="Profile"
          description="Update your username and display name"
        >
          <ProfileForm currentName={profile?.full_name ?? ""} email={profile?.email ?? ""} elo={profile?.elo ?? 1200} />
        </Accordion>

        {/* Token & Level */}
        <Accordion
          open={openSection === "token"}
          onToggle={() => toggle("token")}
          icon={<Star size={20} />}
          title="Level & $KING Tokens"
          description="Your XP progress and token balance"
        >
          <TokenSection />
        </Accordion>

        {/* Achievements */}
        <Accordion
          open={openSection === "achievements"}
          onToggle={() => toggle("achievements")}
          icon={<Trophy size={20} />}
          title="Achievements"
          description="Unlock badges and earn XP"
        >
          <AchievementsSection />
        </Accordion>

        {/* Notifications — placeholder */}
        <SettingsShell icon={<Bell size={20} />} title="Notifications" description="Manage game alerts and email notifications" />

        {/* Security — placeholder */}
        <SettingsShell icon={<ShieldCheck size={20} />} title="Security" description="Password and active sessions" />

        {/* Appearance — placeholder */}
        <SettingsShell icon={<Palette size={20} />} title="Appearance" description="Theme, board style and piece set" />
      </div>
    </div>
  );
}

// ── Profile Form ─────────────────────────────────────────────────────────────

function ProfileForm({ currentName, email, elo }: { currentName: string; email: string; elo: number }) {
  const [name, setName] = useState(currentName);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const fd = new FormData();
    fd.set("full_name", name);
    startTransition(async () => {
      const res = await updateProfile(fd);
      if (res?.error) setError(res.error);
      else setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg-chess border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-semibold focus:outline-none focus:border-primary-chess/50 transition-colors"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
          <input
            value={email}
            disabled
            className="w-full bg-bg-chess border border-white/5 rounded-lg px-3 py-2.5 text-gray-500 text-sm font-semibold cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">ELO Rating:</span>
          <span className="text-sm font-black text-primary-chess">{elo}</span>
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-400">{error}</p>}
          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check size={12} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary-chess hover:bg-primary-hover text-black font-black px-5 py-2 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Token & Level Section ─────────────────────────────────────────────────────

function TokenSection() {
  const { level, xp, tokenBalance, xpToNextLevel, progressPercent, canPlayToken } = usePlayerLevel();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<{ id: string; type: string; amount: number; description: string | null; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("transactions")
      .select("id, type, amount, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setTransactions(data); });
  }, [user]);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Level + XP */}
      <div className="bg-bg-chess border border-white/10 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Level</p>
            <p className="text-4xl font-black text-white">{level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-semibold uppercase">$KING Balance</p>
            <p className="text-2xl font-black text-yellow-400">⬡ {tokenBalance.toFixed(0)}</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{xp} XP total</span>
            <span>{xpToNextLevel} XP to Level {level + 1}</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div className="bg-primary-chess h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        {canPlayToken ? (
          <p className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
            <Check size={12} /> Token Play unlocked — you can bet $KING tokens
          </p>
        ) : (
          <p className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
            <Lock size={12} /> Reach Level 10 to unlock Token Play ({Math.max(0, 1000 - xp)} XP needed)
          </p>
        )}
      </div>

      {/* XP sources info */}
      <div className="bg-bg-chess border border-white/5 rounded-xl p-4">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">How to earn XP</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Win free game", "+20 XP"],
            ["Win token game", "+50 XP"],
            ["Draw", "+10 XP"],
            ["Solve puzzle", "+5 XP"],
            ["Daily login", "+10 XP"],
            ["Achievements", "variable"],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500">{label}</span>
              <span className="text-primary-chess font-bold">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Token transaction history */}
      {transactions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Token History</p>
          <div className="bg-bg-chess border border-white/5 rounded-xl overflow-hidden">
            {transactions.map((tx) => {
              const positive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-200 capitalize">{tx.type.replace("_", " ")}</p>
                    <p className="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-black ${positive ? "text-green-400" : "text-red-400"}`}>
                    {positive ? "+" : ""}⬡{Math.abs(tx.amount).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Achievements Section ──────────────────────────────────────────────────────

function AchievementsSection() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("achievements")
      .select("id, achievement_key, xp_awarded, unlocked_at")
      .eq("user_id", user.id)
      .then(({ data }) => { if (data) setUnlocked(data); });
  }, [user]);

  const unlockedKeys = new Set(unlocked.map((a) => a.achievement_key));

  return (
    <div className="pt-2">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(ACHIEVEMENT_META).map(([key, meta]) => {
          const isUnlocked = unlockedKeys.has(key);
          const achievement = unlocked.find((a) => a.achievement_key === key);
          return (
            <div
              key={key}
              className={`rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                isUnlocked
                  ? "bg-primary-chess/10 border-primary-chess/30"
                  : "bg-bg-chess border-white/5 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{meta.icon}</span>
                {isUnlocked ? (
                  <span className="text-[10px] text-primary-chess font-black bg-primary-chess/10 border border-primary-chess/20 px-2 py-0.5 rounded-full">
                    +{achievement?.xp_awarded} XP
                  </span>
                ) : (
                  <Lock size={14} className="text-gray-600" />
                )}
              </div>
              <div>
                <p className={`text-sm font-black ${isUnlocked ? "text-white" : "text-gray-500"}`}>{meta.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{meta.desc}</p>
                {isUnlocked && achievement && (
                  <p className="text-[10px] text-primary-chess mt-1">
                    Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-gray-600 mt-4">
        {unlocked.length} / {Object.keys(ACHIEVEMENT_META).length} achievements unlocked
      </p>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function Accordion({
  open, onToggle, icon, title, description, children,
}: {
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-bg-panel border rounded-xl transition-colors ${open ? "border-primary-chess/30" : "border-gray-800"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${open ? "bg-primary-chess/20 text-primary-chess" : "bg-bg-sidebar text-primary-chess group-hover:bg-primary-chess/20"}`}>
            {icon}
          </div>
          <div className="text-left">
            <p className="font-bold text-white">{title}</p>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        <div className="text-gray-500">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}

function SettingsShell({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-bg-panel border border-gray-800 hover:border-gray-600 rounded-xl p-5 flex items-center justify-between cursor-not-allowed opacity-60 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-bg-sidebar flex items-center justify-center text-primary-chess">
          {icon}
        </div>
        <div>
          <p className="font-bold text-white">{title}</p>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="text-xs text-gray-600 font-semibold">Coming soon</div>
    </div>
  );
}
