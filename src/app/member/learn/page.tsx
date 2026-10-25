import Link from "next/link";
import { Handshake, ArrowRight, Crown } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getLatestMembership } from "@/lib/data";
import { Card, PageHead } from "@/components/ui";
import LearnLibrary from "./learn-client";

export const dynamic = "force-dynamic";

const SIMPLE_PLANS = [
  {
    goal: "BULK",
    tip: "Eat +300 kcal above maintenance, sleep 8h, add load or reps weekly.",
    split: "4-day Upper/Lower · compounds first, 6–10 reps",
    color: "text-amber-300 border-amber-400/30 bg-amber-400/5",
  },
  {
    goal: "CUT",
    tip: "Deficit of ~400 kcal, keep protein high (2g/kg), keep lifting heavy.",
    split: "4-day Push/Pull + 2 conditioning finishers",
    color: "text-sky-300 border-sky-400/30 bg-sky-400/5",
  },
  {
    goal: "RECOMP",
    tip: "Maintenance calories on rest days, small surplus on training days.",
    split: "3-day Full Body + 1 weak-point session",
    color: "text-volt border-volt/30 bg-volt/5",
  },
  {
    goal: "STRENGTH",
    tip: "Chase the top set: 3–6 reps, long rests, one heavy attempt per lift.",
    split: "4-day Conjugate-lite · squat, bench, dead, press waves",
    color: "text-rose-300 border-rose-400/30 bg-rose-400/5",
  },
];

export default async function LearnPage() {
  const user = await requireRole("member");
  const membership = await getLatestMembership(user.id);
  const isPt = membership?.plan === "pt";

  return (
    <div>
      <PageHead
        eyebrow="Learning"
        title="Movement Library"
        sub="Video guides filmed in-house, graded Beginner → Extreme and mapped to the physique you're chasing."
      />

      {/* Simple plans by goal */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SIMPLE_PLANS.map((p) => (
          <div key={p.goal} className={`rounded-2xl border p-5 ${p.color}`}>
            <p className="font-display text-2xl tracking-widest">{p.goal}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">{p.tip}</p>
            <p className="mt-3 text-[10px] font-semibold tracking-[0.2em] uppercase opacity-80">
              {p.split}
            </p>
          </div>
        ))}
      </div>

      {!isPt ? (
        <Link
          href="/member/coach"
          className="group mb-8 flex items-center justify-between gap-4 rounded-2xl border border-volt/30 bg-volt/5 p-5 transition-colors hover:border-volt/60"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-volt/15 text-volt">
              <Crown size={20} />
            </span>
            <div>
              <p className="font-display text-lg tracking-wide uppercase">
                Want the fully customized version?
              </p>
              <p className="text-xs text-zinc-400">
                PT members get coach-authored programs, progressions and diet
                plans — adjusted weekly from your check-ins.
              </p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-volt">
            <Handshake size={15} /> Upgrade <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      ) : null}

      <Card className="p-4 sm:p-6">
        <LearnLibrary />
      </Card>
    </div>
  );
}
