import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-steel p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Chip({
  children,
  tone = "volt",
  className,
}: {
  children: ReactNode;
  tone?: "volt" | "zinc" | "red" | "blue";
  className?: string;
}) {
  const tones = {
    volt: "bg-volt/10 text-volt border-volt/25",
    zinc: "bg-zinc-400/10 text-zinc-300 border-zinc-500/25",
    red: "bg-red-400/10 text-red-300 border-red-400/25",
    blue: "bg-sky-400/10 text-sky-300 border-sky-400/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-steel p-5">
      <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "font-display mt-2 text-4xl tracking-wide",
          accent ? "text-volt" : "text-zinc-100"
        )}
      >
        {value}
      </p>
      {sub ? <div className="mt-1 text-sm text-zinc-400">{sub}</div> : null}
    </div>
  );
}

export function Ring({
  pct,
  size = 180,
  stroke = 12,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="fill-none stroke-smoke"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="fill-none stroke-volt transition-all duration-700"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Avatar({
  name,
  hue,
  size = 40,
}: {
  name: string;
  hue: number;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-semibold text-carbon"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 85% 62%), hsl(${(hue + 40) % 360} 85% 48%))`,
      }}
    >
      {initials}
    </div>
  );
}

export function Empty({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-steel/50 px-6 py-12 text-center">
      <div>
        <p className="font-display text-xl tracking-wide text-zinc-300">{title}</p>
        {hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.25em] text-volt uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display mt-1 text-4xl tracking-wide text-zinc-100 md:text-5xl">
          {title}
        </h1>
        {sub ? <p className="mt-2 max-w-xl text-sm text-zinc-400">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function MacroBar({
  label,
  value,
  target,
  unit,
  tone = "volt",
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  tone?: "volt" | "sky" | "amber" | "rose";
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  const colors = {
    volt: "bg-volt",
    sky: "bg-sky-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  };
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold tracking-widest text-zinc-400 uppercase">
          {label}
        </span>
        <span className="text-zinc-300">
          {value}
          <span className="text-zinc-500"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-smoke">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colors[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
