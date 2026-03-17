"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play, Puzzle, GraduationCap, MonitorPlay, Users, Settings, Search, Crown } from "lucide-react";

const navItems = [
  { href: "/play", icon: <Play size={20} />, label: "Play" },
  { href: "/puzzles", icon: <Puzzle size={20} />, label: "Puzzles" },
  { href: "/learn", icon: <GraduationCap size={20} />, label: "Learn" },
  { href: "/watch", icon: <MonitorPlay size={20} />, label: "Watch" },
  { href: "/social", icon: <Users size={20} />, label: "Social" },
];

const bottomItems = [
  { href: "/search", icon: <Search size={20} />, label: "Search" },
  { href: "/settings", icon: <Settings size={20} />, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

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
        <div className="px-2 mt-3 hidden md:block">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full bg-primary-chess hover:bg-primary-hover text-black font-black py-2.5 rounded-lg transition-all hover:shadow-gold text-sm"
          >
            <Crown size={16} />
            Sign Up Free
          </Link>
        </div>
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
