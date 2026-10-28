import Link from "next/link";
import { Bot, PencilRuler, Play, Sparkles, Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  getActivePlan,
  getCompletedExerciseIdsForUser,
  getAllUserExerciseCompletions,
} from "@/lib/data";
import { todayStr } from "@/lib/dates";
import { Card, Chip, PageHead } from "@/components/ui";
import TufRoutineDashboard from "./tuf-routine-dashboard";
import PlanTabs from "./plan-tabs";
import PlanBuilder from "./plan-builder";
import AiGenerator from "./ai-generator";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  const user = await requireRole("member");
  const full = await getActivePlan(user.id);
  const today = todayStr();
  const completedTodayIds = await getCompletedExerciseIdsForUser(user.id, today);
  const allCompletions = await getAllUserExerciseCompletions(user.id);
  const isPtMember = user.subscriptionTier === "PT_LITE" || user.subscriptionTier === "PT";

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Training"
        title="Daily Routine & Planly Checklist"
        sub="Your personal daily workout routine powered by AI — track daily progress, check off completed exercises, and elevate your fitness."
        right={
          <Link
            href="/member/workouts/pt-lite"
            className="inline-flex items-center gap-2 rounded-xl bg-volt px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-carbon shadow-lg transition-all hover:bg-volt/90"
          >
            <Play size={14} className="fill-carbon" />
            PT Lite Video Vault
          </Link>
        }
      />

      {/* PT Lite Featured Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-volt/25 bg-gradient-to-r from-volt/10 via-steel to-steel p-5 shadow-lg">
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 place-items-center rounded-xl bg-volt text-carbon shadow">
            <Video size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg tracking-wide uppercase text-zinc-100">
                PT Lite Video Tutorial Vault
              </h3>
              <Chip tone={isPtMember ? "volt" : "blue"}>
                {isPtMember ? "Subscribed" : "PT Lite Available"}
              </Chip>
            </div>
            <p className="text-xs text-zinc-400">
              Access certified coach exercise execution tutorials, filtered by your level and body goal.
            </p>
          </div>
        </div>

        <Link
          href="/member/workouts/pt-lite"
          className="inline-flex items-center gap-2 rounded-xl border border-volt/40 bg-volt/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-volt transition-colors hover:bg-volt hover:text-carbon"
        >
          <Sparkles size={14} />
          {isPtMember ? "Open Video Hub" : "View PT Lite & Upgrade"}
        </Link>
      </div>

      {/* Primary TUF-style Routine & Checklist Dashboard */}
      <TufRoutineDashboard
        user={user}
        plan={full?.plan ?? null}
        days={full?.days ?? []}
        initialCompletedIds={completedTodayIds}
        allCompletions={allCompletions}
        coachName={full?.coachName ?? null}
      />

      {/* Secondary Tabs / Program Tools */}
      <div className="pt-4 space-y-6">
        {full ? (
          <Card>
            <div className="mb-4">
              <h3 className="font-display text-lg tracking-wide uppercase text-zinc-200">
                Full Program Split Breakdown
              </h3>
              <p className="text-xs text-zinc-400">
                Detailed table overview of all days, sets, reps, and cues in {full.plan.title}
              </p>
            </div>
            <PlanTabs
              days={full.days.map((d) => ({
                id: d.id,
                label: d.label,
                focus: d.focus,
                exercises: d.exercises,
              }))}
            />
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-volt/10 text-volt">
                <Bot size={18} />
              </span>
              <div>
                <h3 className="font-display text-lg tracking-wide uppercase">
                  Quick AI Split Generator
                </h3>
                <p className="text-xs text-zinc-500">
                  Direct Gemini prompt generator
                </p>
              </div>
            </div>
            <AiGenerator defaultGoal={user.goal ?? "bulk"} defaultLevel={user.level ?? "intermediate"} />
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-smoke text-volt">
                <PencilRuler size={18} />
              </span>
              <div>
                <h3 className="font-display text-lg tracking-wide uppercase">
                  Custom Architect
                </h3>
                <p className="text-xs text-zinc-500">
                  Manual line-by-line plan writer
                </p>
              </div>
            </div>
            <PlanBuilder defaultGoal={user.goal ?? "recomp"} />
          </Card>
        </div>
      </div>
    </div>
  );
}
