"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, LoaderCircle, Save, Sparkles } from "lucide-react";
import { saveAiPlanAction } from "@/actions/member";
import type { AiRequest, PlanInput } from "@/lib/plans";

const selectCls =
  "w-full rounded-xl border border-line bg-smoke/60 px-4 py-3 text-sm text-zinc-100 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20";

const LOADER_LINES = [
  "Analyzing your goal…",
  "Structuring the split…",
  "Selecting movements…",
  "Balancing volume…",
];

export default function AiGenerator({
  defaultGoal,
  defaultLevel,
}: {
  defaultGoal?: string;
  defaultLevel?: string;
}) {
  const router = useRouter();
  const [goal, setGoal] = useState(defaultGoal ?? "bulk");
  const [level, setLevel] = useState(defaultLevel ?? "intermediate");
  const [days, setDays] = useState(4);
  const [equipment, setEquipment] = useState("full gym");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<PlanInput | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [line, setLine] = useState(0);
  const [pending, start] = useTransition();

  async function generate() {
    setGenerating(true);
    setPlan(null);
    setLine(0);
    const iv = setInterval(() => setLine((l) => (l + 1) % LOADER_LINES.length), 900);
    try {
      const body: AiRequest = { goal, level, daysPerWeek: days, equipment, notes };
      const res = await fetch("/api/ai/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        setEngine(data.engine);
      }
    } finally {
      clearInterval(iv);
      setGenerating(false);
    }
  }

  function save() {
    if (!plan) return;
    start(async () => {
      await saveAiPlanAction(plan);
      setPlan(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={goal} onChange={(e) => setGoal(e.target.value)} className={selectCls}>
          <option value="bulk">Goal — Bulk</option>
          <option value="cut">Goal — Cut</option>
          <option value="recomp">Goal — Recomposition</option>
          <option value="strength">Goal — Strength</option>
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
          <option value="beginner">Level — Beginner</option>
          <option value="intermediate">Level — Intermediate</option>
          <option value="advanced">Level — Advanced</option>
          <option value="extreme">Level — Extreme</option>
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={selectCls}>
          {[3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} days / week
            </option>
          ))}
        </select>
        <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className={selectCls}>
          <option value="full gym">Full gym</option>
          <option value="dumbbells + bench">Dumbbells + bench</option>
          <option value="barbell + rack">Barbell + rack</option>
          <option value="bodyweight">Bodyweight only</option>
        </select>
      </div>

      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything else? Injuries, weak points, time limits…"
        className={selectCls}
      />

      <button
        onClick={generate}
        disabled={generating}
        className="flex items-center gap-2 rounded-xl bg-volt px-6 py-3 text-sm font-bold tracking-widest text-carbon uppercase transition-colors hover:bg-volt-dim disabled:opacity-60"
      >
        {generating ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Sparkles size={16} />
        )}
        {generating ? LOADER_LINES[line] : "Generate my plan"}
      </button>

      {plan ? (
        <div className="rounded-2xl border border-volt/30 bg-volt/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] text-volt uppercase">
                <Bot size={13} />
                {engine === "gemini" ? "Written by Gemini" : "Built by FORGE engine"}
              </p>
              <h4 className="font-display mt-1 text-2xl tracking-wide">{plan.title}</h4>
              {plan.summary ? (
                <p className="mt-1 max-w-2xl text-sm text-zinc-400">{plan.summary}</p>
              ) : null}
            </div>
            <button
              onClick={save}
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-volt px-5 py-2.5 text-xs font-bold tracking-widest text-carbon uppercase hover:bg-volt-dim disabled:opacity-60"
            >
              {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
              Save as my plan
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plan.days.map((d, i) => (
              <div key={i} className="rounded-xl border border-line bg-carbon p-4">
                <p className="text-xs font-bold tracking-widest text-zinc-300 uppercase">
                  {d.label}
                  {d.focus ? <span className="text-volt"> · {d.focus}</span> : null}
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-zinc-400">
                  {d.exercises.map((e, j) => (
                    <li key={j} className="flex justify-between gap-2">
                      <span className="text-zinc-200">{e.name}</span>
                      <span className="shrink-0 text-zinc-500">
                        {e.sets}×{e.reps}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
