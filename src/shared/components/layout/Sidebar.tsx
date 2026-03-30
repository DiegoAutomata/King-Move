"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, Puzzle, GraduationCap, MonitorPlay, Users, Settings, Search, Crown, LogOut, LogIn, Coins, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerLevel } from "@/hooks/usePlayerLevel";
import { signout } from "@/actions/auth";

const navItems = [
  { href: "/play", icon: <Play size={20} />, label: "Play" },
  { href: "/puzzles", icon: <Puzzle size={20} />, label: "Puzzles" },
  { href: "/learn", icon: <GraduationCap size={20} />, label: "Learn" },
  { href: "/watch", icon: <MonitorPlay size={20} />, label: "Watch" },
  { href: "/social", icon: <Users size={20} />, label: "Social" },
  { href: "/cash", icon: <Coins size={20} />, label: "$KING" },
  { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
];

const bottomItems = [
  { href: "/search", icon: <Search size={20} />, label: "Search" },
  { href: "/settings", icon: <Settings size={20} />, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const { level, tokenBalance, progressPercent } = usePlayerLevel();

  return (
    <div className="w-16 md:w-64 h-screen bg-bg-sidebar flex flex-col border-r border-white/5 fixed left-0 top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-4 py-5 mb-2 group">
        <div className="w-9 h-9 rounded-lg bg-primary-chess flex items-center justify-center shrink-0 shadow-gold group-hover:scale-105 transition-transform">
          <Crown size={20} className="text-black" />
        </div>
        <div className="hidden md:flex flex-col">
          <span className="font-black text-xl text-gold-gradient tracking-tight">King Move</span>
          <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest -mt-0.5">Chess Platform</span>
        </div>
      </Link>

      {/* Thin gold divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-primary-chess/30 to-transparent mb-3" />

      {/* Main nav */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-1 px-2 pb-4">
        <div className="mx-2 h-px bg-white/5 mb-2" />
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href}
          />
        ))}

        {/* Auth section */}
        <div className="px-2 mt-3 hidden md:block">
          {!loading && user ? (
            <div className="flex flex-col gap-2">
              {/* User info */}
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-7 h-7 rounded-lg bg-primary-chess/20 border border-primary-chess/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-primary-chess">
                    {(profile?.full_name ?? user.email ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-200 truncate leading-none">
                    {profile?.full_name ?? user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-primary-chess font-semibold">
                    {profile?.elo ?? 1200} ELO · Lv.{level}
                  </span>
                  {/* XP progress bar */}
                  <div className="w-full bg-white/5 rounded-full h-1 mt-0.5">
                    <div
                      className="bg-primary-chess h-1 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-yellow-400 font-semibold">
                    ⬡ {tokenBalance.toFixed(0)} $KING
                  </span>
                </div>
              </div>
              {/* Sign out */}
              <form action={signout}>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-gray-200 font-semibold py-2 rounded-lg transition-all text-xs"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </form>
            </div>
          ) : !loading ? (
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full bg-primary-chess hover:bg-primary-hover text-black font-black py-2.5 rounded-lg transition-all hover:shadow-gold text-sm"
            >
              <Crown size={16} />
              Sign Up Free
            </Link>
          ) : null}
        </div>

        {/* Mobile: show login icon */}
        {!loading && !user && (
          <div className="md:hidden flex justify-center mt-3">
            <Link href="/login" className="w-10 h-10 rounded-lg bg-primary-chess flex items-center justify-center">
              <LogIn size={18} className="text-black" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
        active
          ? "bg-primary-chess/10 text-primary-chess border border-primary-chess/20"
          : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-chess rounded-r" />
      )}
      <div className={`shrink-0 ${active ? "text-primary-chess" : "group-hover:text-gray-200"}`}>
        {icon}
      </div>
      <span className={`font-semibold text-sm hidden md:block ${active ? "text-primary-chess" : ""}`}>
        {label}
      </span>
    </Link>
  );
}
