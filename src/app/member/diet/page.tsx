import { Apple, Handshake } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getDietAssignments,
  getDietLogs,
  getDietLogsSince,
  getLatestMembership,
} from "@/lib/data";
import { addDaysStr, prettyDateTime, todayStr } from "@/lib/dates";
import { Card, Chip, MacroBar, PageHead } from "@/components/ui";
import DietLogger from "./diet-logger";

export const dynamic = "force-dynamic";

const TARGETS: Record<string, { cal: number; p: number; c: number; f: number }> = {
  bulk: { cal: 3200, p: 190, c: 380, f: 95 },
  cut: { cal: 2100, p: 170, c: 170, f: 65 },
  recomp: { cal: 2600, p: 180, c: 260, f: 80 },
  strength: { cal: 2900, p: 185, c: 300, f: 90 },
};

export default async function DietPage() {
  const user = await requireRole("member");
  const today = todayStr();
  const goal = user.goal ?? "recomp";
  const t = TARGETS[goal] ?? TARGETS.recomp;

  const [logs, weekLogs, assigned, membership] = await Promise.all([
    getDietLogs(user.id, today),
    getDietLogsSince(user.id, addDaysStr(today, -6)),
    getDietAssignments(user.id),
    getLatestMembership(user.id),
  ]);

  const tot = logs.reduce(
    (a, l) => ({
      cal: a.cal + l.calories,
      p: a.p + l.protein,
      c: a.c + l.carbs,
      f: a.f + l.fat,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  );

  const byDay = new Map<string, number>();
  for (const l of weekLogs) {
    byDay.set(l.date, (byDay.get(l.date) ?? 0) + l.calories);
  }
  const isPt = membership?.plan === "pt";

  return (
    <div>
      <PageHead
        eyebrow="Nutrition"
        title="Diet & Macros"
        sub={`Targets are set for your ${goal.toUpperCase()} track — log everything, hit the bars.`}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Macro summary */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide uppercase">Today</h3>
            <Chip tone="volt">{goal}</Chip>
          </div>
          <div className="mt-5 space-y-4">
            <MacroBar label="Calories" value={tot.cal} target={t.cal} unit=" kcal" />
            <MacroBar label="Protein" value={tot.p} target={t.p} unit="g" tone="sky" />
            <MacroBar label="Carbs" value={tot.c} target={t.c} unit="g" tone="amber" />
            <MacroBar label="Fat" value={tot.f} target={t.f} unit="g" tone="rose" />
          </div>

          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              Last 7 days — kcal
            </p>
            <div className="flex h-16 items-end gap-1.5">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDaysStr(today, -(6 - i));
                const v = byDay.get(d) ?? 0;
                const pct = Math.min(100, Math.round((v / t.cal) * 100));
                return (
                  <div key={d} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-md ${v > 0 ? "bg-volt/70" : "bg-smoke"} ${
                        v > t.cal * 1.05 ? "!bg-red-400/60" : ""
                      }`}
                      style={{ height: `${Math.max(6, pct)}%` }}
                      title={`${d}: ${v} kcal`}
                    />
                    <span className="text-[9px] text-zinc-600">
                      {new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "narrow" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Log form */}
          <DietLogger />
        </Card>

        {/* Today entries + coach assigned */}
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl tracking-wide uppercase">
                Today&apos;s log
              </h3>
              <span className="text-xs text-zinc-500">{logs.length} entries</span>
            </div>
            {logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                Nothing logged yet — add your first meal on the left.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line/70">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{l.food}</p>
                      <p className="text-xs text-zinc-500">
                        {l.meal} · {prettyDateTime(l.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-3 text-right text-xs">
                      <span className="font-semibold text-zinc-200">{l.calories} kcal</span>
                      <span className="text-sky-300">{l.protein}p</span>
                      <span className="text-amber-300">{l.carbs}c</span>
                      <span className="text-rose-300">{l.fat}f</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-display flex items-center gap-2 text-xl tracking-wide uppercase">
                <Handshake size={18} className="text-sky-300" /> From your coach
              </h3>
              {isPt ? <Chip tone="blue">PT plan</Chip> : <Chip tone="zinc">Normal plan</Chip>}
            </div>
            {assigned.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                {isPt
                  ? "Your coach hasn't assigned meals yet — nudge them from the Coach tab."
                  : "Meal assignments are a Personal Training perk. Upgrade to unlock."}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line/70">
                {assigned.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        <span className="text-zinc-500">{a.meal} ·</span> {a.food}
                      </p>
                      {a.notes ? (
                        <p className="text-xs text-zinc-500">{a.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-3 text-right text-xs">
                      <span className="font-semibold text-zinc-200">{a.calories} kcal</span>
                      <span className="text-sky-300">{a.protein}p</span>
                      <span className="text-amber-300">{a.carbs}c</span>
                      <span className="text-rose-300">{a.fat}f</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex items-start gap-3 rounded-2xl border border-line bg-steel/60 p-4 text-xs leading-relaxed text-zinc-500">
            <Apple size={16} className="mt-0.5 shrink-0 text-volt" />
            Logged food is private to you. Coach-assigned meals appear here and
            feed your daily target bars — one less thing to think about.
          </div>
        </div>
      </div>
    </div>
  );
}
