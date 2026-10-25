"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save } from "lucide-react";
import { saveCustomPlanAction } from "@/actions/member";
import type { PlanInput } from "@/lib/plans";

type DayDraft = { label: string; focus: string; raw: string };

const GOALS = ["bulk", "cut", "recomp", "strength"] as const;

function parseLines(raw: string) {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, sets, reps, rest, ...notes] = l.split("|").map((p) => p.trim());
      return { name, sets, reps, rest, notes: notes.join(" | ") };
    });
}

export default function PlanBuilder({ defaultGoal }: { defaultGoal?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("My Custom Split");
  const [goal, setGoal] = useState(defaultGoal ?? "recomp");
  const [count, setCount] = useState(4);
  const [days, setDays] = useState<DayDraft[]>(
    Array.from({ length: 4 }, (_, i) => ({
      label: `Day ${i + 1}`,
      focus: ["Push", "Pull", "Legs", "Upper"][i] ?? "",
      raw: "",
    }))
  );
  const [error, setError] = useState<string | null>(null);

  function resize(n: number) {
    setCount(n);
    setDays((d) => {
      const copy = [...d];
      while (copy.length < n)
        copy.push({ label: `Day ${copy.length + 1}`, focus: "", raw: "" });
      return copy.slice(0, n);
    });
  }

  function update(i: number, patch: Partial<DayDraft>) {
    setDays((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function submit() {
    setError(null);
    const plan: PlanInput = {
      title,
      goal,
      days: days.map((d) => ({
        label: d.label,
        focus: d.focus,
        exercises: parseLines(d.raw),
      })),
    };
    if (!plan.days.some((d) => d.exercises.length)) {
      setError("Add at least one exercise — one per line: Name | sets | reps | rest | cue");
      return;
    }
    start(async () => {
      await saveCustomPlanAction(plan);
      router.refresh();
    });
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-smoke/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Plan title"
          className={inputCls}
        />
        <select value={goal} onChange={(e) => setGoal(e.target.value)} className={inputCls}>
          {GOALS.map((g) => (
            <option key={g} value={g}>
              Goal: {g.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={count}
          onChange={(e) => resize(Number(e.target.value))}
          className={inputCls}
        >
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} days / week
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {days.map((d, i) => (
          <div key={i} className="rounded-xl border border-line bg-smoke/30 p-4">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={d.label}
                onChange={(e) => update(i, { label: e.target.value })}
                className="rounded-lg border border-line bg-carbon px-3 py-2 text-xs font-bold tracking-widest uppercase"
              />
              <input
                value={d.focus}
                onChange={(e) => update(i, { focus: e.target.value })}
                placeholder="Focus (e.g. Push)"
                className="rounded-lg border border-line bg-carbon px-3 py-2 text-xs"
              />
            </div>
            <textarea
              value={d.raw}
              onChange={(e) => update(i, { raw: e.target.value })}
              rows={6}
              placeholder={
                "One exercise per line:\nBench Press | 4 | 6-8 | 2 min | Pause at chest\nIncline DB Press | 3 | 8-10 | 90s\nLateral Raise | 3 | 12-15 | 60s"
              }
              className="mt-2 w-full rounded-lg border border-line bg-carbon px-3 py-2 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        onClick={submit}
        disabled={pending}
        className="flex items-center gap-2 rounded-xl bg-volt px-6 py-3 text-sm font-bold tracking-widest text-carbon uppercase transition-colors hover:bg-volt-dim disabled:opacity-60"
      >
        {pending ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
        Save as my active plan
      </button>
    </div>
  );
}
