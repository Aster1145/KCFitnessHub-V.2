"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  GraduationCap,
  Salad,
  Handshake,
  LogOut,
  Users,
  BarChart3,
  Award,
  UserPlus,
  RotateCcw,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { KcLogo } from "@/components/kc-logo";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  workouts: Dumbbell,
  learn: GraduationCap,
  diet: Salad,
  coach: Handshake,
  students: Users,
  stats: BarChart3,
  members: Users,
  coaches: Award,
  add: UserPlus,
  renewals: RotateCcw,
  revenue: CreditCard,
};

export interface NavLink {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

export default function Sidebar({
  links,
  name,
  roleLabel,
  hue,
}: {
  links: NavLink[];
  name: string;
  roleLabel: string;
  hue: number;
}) {
  const pathname = usePathname();

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nav = (
    <>
      {links.map((l) => {
        const Icon = ICONS[l.icon] || BarChart3;
        const active =
          pathname === l.href ||
          (l.href !== "/" && l.href !== "/admin" && pathname.startsWith(l.href + "/"));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? "bg-volt/10 text-volt"
                : "text-zinc-400 hover:bg-smoke hover:text-zinc-100"
            }`}
          >
            <Icon size={17} strokeWidth={active ? 2.5 : 2} />
            {l.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-steel/80 backdrop-blur md:flex">
        <Link href="/" className="flex items-center px-6 py-6">
          <KcLogo className="size-8" />
        </Link>
        <nav className="flex-1 space-y-1 px-3">{nav}</nav>
        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <div
              className="grid size-10 shrink-0 place-items-center rounded-full font-semibold text-carbon"
              style={{
                background: `linear-gradient(135deg, hsl(${hue} 85% 62%), hsl(${(hue + 40) % 360} 85% 48%))`,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-100">{name}</p>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                {roleLabel}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-smoke hover:text-red-400"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-line bg-steel/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <KcLogo className="size-7" />
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg p-2 text-zinc-400 hover:bg-smoke hover:text-red-400"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {links.map((l) => {
            const Icon = ICONS[l.icon] || BarChart3;
            const active =
              pathname === l.href ||
              (l.href !== "/" && l.href !== "/admin" && pathname.startsWith(l.href + "/"));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-volt/10 text-volt" : "text-zinc-400"
                }`}
              >
                <Icon size={14} />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
