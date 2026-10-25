"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Dumbbell,
  LoaderCircle,
  MessagesSquare,
  Salad,
  Save,
  UserRound,
  Plus,
  Trash2,
} from "lucide-react";
import {
  assignDietAction,
  assignPlanAction,
  replyToMemberAction,
} from "@/actions/trainer";
import MessageBox from "@/components/message-box";
import { Avatar } from "@/components/ui";
import type { PlanInput } from "@/lib/plans";

export interface StudentVM {
  id: number;
  name: string;
  email: string;
  goal: string;
  level: string;
  hue: number;
  planType: string | null;
  remaining: number | null;
  pct: number;
  duration: number;
  lastCheckIn: string | null;
  checkedToday: boolean;
  dots: boolean[];
  dotDates: string[];
  activePlanTitle: string | null;
  activePlanSource: string | null;
  thread: { id: number; body: string; mine: boolean; at: string }[];
  meals: { id: number; meal: string; food: string; calories: number }[];
}

const TABS = [
  { key: "overview", label: "Overview", icon: UserRound },
  { key: "workout", label: "Workout", icon: Dumbbell },
  { key: "diet", label: "Diet", icon: Salad },
  { key: "messages", label: "Messages", icon: MessagesSquare },
] as const;

type Tab = (typeof TABS)[number]["key"];

const inputCls =
  "w-full rounded-lg border border-line bg-carbon px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none";

function WorkoutForm({ memberId }: { memberId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("Coach Block A");
  const [count, setCount] = useState(4);
  const [days, setDays] = useState(
    Array.from({ length: 4 }, (_, i) => ({
      label: `Day ${i + 1}`,
      focus: ["Push", "Pull", "Legs", "Upper"][i] ?? "",
      raw: "",
    }))
  );
  const [msg, setMsg] = useState<string | null>(null);

  function resize(n: number) {
    setCount(n);
    setDays((d) => {
      const c = [...d];
      while (c.length < n) c.push({ label: `Day ${c.length + 1}`, focus: "", raw: "" });
      return c.slice(0, n);
    });
  }

  function submit() {
    const plan: PlanInput = {
      title,
      days: days.map((d) => ({
        label: d.label,
        focus: d.focus,
        exercises: d.raw
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => {
            const [name, sets, reps, rest, ...notes] = l.split("|").map((p) => p.trim());
            return { name, sets, reps, rest, notes: notes.join(" | ") };
          }),
      })),
    };
    if (!plan.days.some((d) => d.exercises.length)) {
      setMsg("Add at least one exercise (Name | sets | reps | rest | cue).");
      return;
    }
    setMsg(null);
    start(async () => {
      await assignPlanAction(memberId, plan);
      setMsg("Plan published to student's app.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          placeholder="Plan title"
        />
        <select
          value={count}
          onChange={(e) => resize(Number(e.target.value))}
          className="w-36 rounded-lg border border-line bg-carbon px-3 py-2 text-sm"
        >
          {[3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} days
            </option>
          ))}
        </select>
      </div>
      {days.map((d, i) => (
        <div key={i} className="rounded-xl border border-line bg-smoke/30 p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={d.label}
              onChange={(e) =>
                setDays((dd) => dd.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
              }
              className="rounded-lg border border-line bg-carbon px-2.5 py-1.5 text-xs font-bold tracking-widest uppercase"
            />
            <input
              value={d.focus}
              onChange={(e) =>
                setDays((dd) => dd.map((x, j) => (j === i ? { ...x, focus: e.target.value } : x)))
              }
              placeholder="Focus"
              className="rounded-lg border border-line bg-carbon px-2.5 py-1.5 text-xs"
            />
          </div>
          <textarea
            value={d.raw}
            onChange={(e) =>
              setDays((dd) => dd.map((x, j) => (j === i ? { ...x, raw: e.target.value } : x)))
            }
            rows={3}
            placeholder="Bench Press | 4 | 6-8 | 2 min | Pause at chest"
            className="mt-2 w-full rounded-lg border border-line bg-carbon px-2.5 py-1.5 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
          />
        </div>
      ))}
      {msg ? <p className="text-xs text-zinc-400">{msg}</p> : null}
      <button
        onClick={submit}
        disabled={pending}
        className="flex items-center gap-2 rounded-xl bg-volt px-5 py-2.5 text-xs font-bold tracking-widest text-carbon uppercase hover:bg-volt-dim disabled:opacity-60"
      >
        {pending ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
        Publish plan
      </button>
    </div>
  );
}

interface DietRow {
  meal: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
}

const EMPTY_ROW: DietRow = {
  meal: "Breakfast",
  food: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  notes: "",
};

function DietForm({ memberId }: { memberId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<DietRow[]>([{ ...EMPTY_ROW }]);
  const [msg, setMsg] = useState<string | null>(null);

  function update(i: number, patch: Partial<DietRow>) {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function submit() {
    const items = rows.filter((r) => r.food.trim());
    if (!items.length) {
      setMsg("Add at least one food item.");
      return;
    }
    setMsg(null);
    start(async () => {
      await assignDietAction(memberId, items);
      setRows([{ ...EMPTY_ROW }]);
      setMsg("Diet items sent to student's tracker.");
      router.refresh();
    });
  }

  const cell = "rounded-lg border border-line bg-carbon px-2 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none";

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-1.5">
          <select value={r.meal} onChange={(e) => update(i, { meal: e.target.value })} className={`${cell} col-span-3`}>
            {["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input value={r.food} onChange={(e) => update(i, { food: e.target.value })} placeholder="Food" className={`${cell} col-span-4`} />
          <input value={r.calories || ""} onChange={(e) => update(i, { calories: Number(e.target.value) })} placeholder="kcal" type="number" className={`${cell} col-span-2`} />
          <input value={r.protein || ""} onChange={(e) => update(i, { protein: Number(e.target.value) })} placeholder="P" type="number" className={`${cell} col-span-1`} />
          <input value={r.carbs || ""} onChange={(e) => update(i, { carbs: Number(e.target.value) })} placeholder="C" type="number" className={`${cell} col-span-1`} />
          <div className="col-span-1 flex gap-1">
            <input value={r.fat || ""} onChange={(e) => update(i, { fat: Number(e.target.value) })} placeholder="F" type="number" className={`${cell} w-full`} />
            <button
              onClick={() => setRows((rr) => rr.filter((_, j) => j !== i))}
              className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:text-red-400"
              title="Remove row"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => setRows((r) => [...r, { ...EMPTY_ROW }])}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-volt/40 hover:text-volt"
        >
          <Plus size={13} /> Add row
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-volt px-4 py-2 text-xs font-bold tracking-widest text-carbon uppercase hover:bg-volt-dim disabled:opacity-60"
        >
          {pending ? <LoaderCircle size={13} className="animate-spin" /> : <Save size={13} />}
          Assign meals
        </button>
        {msg ? <span className="text-xs text-zinc-400">{msg}</span> : null}
      </div>
    </div>
  );
}

export default function StudentManager({ students }: { students: StudentVM[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  if (students.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-steel/50 py-16 text-center">
        <p className="font-display text-xl tracking-wide text-zinc-300">No students yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          The club will assign Personal Training members to you — they land here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((s) => {
        const open = openId === s.id;
        return (
          <div key={s.id} className="overflow-hidden rounded-2xl border border-line bg-steel">
            <button
              onClick={() => {
                setOpenId(open ? null : s.id);
                setTab("overview");
              }}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-smoke/40"
            >
              <Avatar name={s.name} hue={s.hue} size={44} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-zinc-100">
                  {s.name}
                  <span
                    className={`size-1.5 rounded-full ${s.checkedToday ? "bg-volt" : "bg-zinc-700"}`}
                    title={s.checkedToday ? "In gym today" : "Not checked in today"}
                  />
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {s.goal.toUpperCase()} · {s.level} · last check-in{" "}
                  {s.lastCheckIn ?? "never"}
                </p>
              </div>
              {/* mini dots */}
              <div className="hidden items-end gap-[3px] sm:flex">
                {s.dots.map((d, i) => (
                  <span
                    key={i}
                    title={s.dotDates[i]}
                    className={`w-1.5 rounded-sm ${d ? "bg-volt" : "bg-smoke"}`}
                    style={{ height: d ? 20 : 10 }}
                  />
                ))}
              </div>
              <div className="hidden w-28 text-right md:block">
                <p className="font-display text-xl text-volt">
                  {s.remaining ?? "—"}
                  <span className="text-xs text-zinc-600">/{s.duration || "—"}</span>
                </p>
                <p className="text-[9px] tracking-widest text-zinc-600 uppercase">
                  sessions left
                </p>
              </div>
              <ChevronDown
                size={18}
                className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open ? (
              <div className="border-t border-line px-5 py-5">
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
                        tab === t.key
                          ? "bg-volt text-carbon"
                          : "bg-smoke/60 text-zinc-400 hover:text-zinc-100"
                      }`}
                    >
                      <t.icon size={13} /> {t.label}
                    </button>
                  ))}
                </div>

                {tab === "overview" ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-line bg-carbon p-4">
                      <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                        Current program
                      </p>
                      <p className="mt-2 text-sm font-medium text-zinc-200">
                        {s.activePlanTitle ?? "No plan yet"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {s.activePlanSource === "coach"
                          ? "Assigned by you"
                          : s.activePlanSource === "ai"
                            ? "AI-generated — review in Workout tab"
                            : s.activePlanSource === "custom"
                              ? "Self-built — review in Workout tab"
                              : "Send them a plan from the Workout tab"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-carbon p-4">
                      <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                        Subscription
                      </p>
                      <p className="mt-2 text-sm font-medium text-zinc-200">
                        {s.planType === "pt" ? "Personal Training" : "Normal"} ·{" "}
                        {s.remaining ?? 0}/{s.duration || 0} left
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-smoke">
                        <div className="h-full rounded-full bg-volt" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                    <div className="rounded-xl border border-line bg-carbon p-4">
                      <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                        Diet
                      </p>
                      {s.meals.length ? (
                        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                          {s.meals.slice(0, 4).map((m) => (
                            <li key={m.id}>
                              <span className="text-zinc-500">{m.meal}:</span> {m.food} · {m.calories} kcal
                            </li>
                          ))}
                          {s.meals.length > 4 ? (
                            <li className="text-zinc-600">+{s.meals.length - 4} more</li>
                          ) : null}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-zinc-500">No meals assigned yet.</p>
                      )}
                    </div>
                  </div>
                ) : null}

                {tab === "workout" ? <WorkoutForm memberId={s.id} /> : null}
                {tab === "diet" ? <DietForm memberId={s.id} /> : null}
                {tab === "messages" ? (
                  <div>
                    <div className="mb-3 max-h-72 space-y-2.5 overflow-y-auto pr-1">
                      {s.thread.length === 0 ? (
                        <p className="py-6 text-center text-sm text-zinc-500">
                          No messages yet — say hello and set expectations.
                        </p>
                      ) : (
                        s.thread.map((m) => (
                          <div key={m.id} className={`flex ${m.mine ? "justify-end" : ""}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                m.mine
                                  ? "rounded-br-md bg-volt text-carbon"
                                  : "rounded-bl-md bg-smoke text-zinc-200"
                              }`}
                            >
                              {m.body}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <MessageBox
                      onSend={(body) => replyToMemberAction(s.id, body)}
                      placeholder={`Message ${s.name.split(" ")[0]}…`}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
