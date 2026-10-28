import Link from "next/link";
import { Bot, Handshake, PencilRuler, Play, Sparkles, Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getActivePlan } from "@/lib/data";
import { prettyDateTime } from "@/lib/dates";
import { Card, Chip, Empty, PageHead } from "@/components/ui";
import PlanTabs from "./plan-tabs";
import PlanBuilder from "./plan-builder";
import AiGenerator from "./ai-generator";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  const user = await requireRole("member");
  const full = await getActivePlan(user.id);
  const isPtMember = user.subscriptionTier === "PT_LITE" || user.subscriptionTier === "PT";

  return (
    <div>
      <PageHead
        eyebrow="Training"
        title="Workout Architect"
        sub="Your active program is shown below — build your own, let the AI write one, or receive it straight from your coach."
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-volt/25 bg-gradient-to-r from-volt/10 via-steel to-steel p-5 shadow-lg">
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

      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-2xl tracking-wide uppercase">
                {full ? full.plan.title : "No active plan"}
              </h3>
              {full ? (
                <Chip tone={full.plan.source === "coach" ? "blue" : full.plan.source === "ai" ? "volt" : "zinc"}>
                  {full.plan.source === "coach" ? (
                    <span className="flex items-center gap-1">
                      <Handshake size={11} /> Coach · {full.coachName}
                    </span>
                  ) : full.plan.source === "ai" ? (
                    <span className="flex items-center gap-1">
                      <Bot size={11} /> AI built
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <PencilRuler size={11} /> Custom
                    </span>
                  )}
                </Chip>
              ) : null}
            </div>
            {full ? (
              <p className="text-xs text-zinc-500">
                Updated {prettyDateTime(full.plan.createdAt)}
              </p>
            ) : null}
          </div>

          {full ? (
            <>
              {full.plan.summary ? (
                <p className="mb-4 max-w-3xl text-sm text-zinc-400">{full.plan.summary}</p>
              ) : null}
              <PlanTabs
                days={full.days.map((d) => ({
                  id: d.id,
                  label: d.label,
                  focus: d.focus,
                  exercises: d.exercises,
                }))}
              />
            </>
          ) : (
            <Empty
              title="No plan yet"
              hint="Generate one with the AI engine, build your own below, or wait for your coach to assign one."
            />
          )}
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-volt/10 text-volt">
              <Bot size={20} />
            </span>
            <div>
              <h3 className="font-display text-xl tracking-wide uppercase">
                AI Plan Generator
              </h3>
              <p className="text-xs text-zinc-500">
                Powered by Gemini — describe your goal and get a full split
              </p>
            </div>
          </div>
          <AiGenerator defaultGoal={user.goal ?? "bulk"} defaultLevel={user.level ?? "intermediate"} />
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-smoke text-volt">
              <PencilRuler size={20} />
            </span>
            <div>
              <h3 className="font-display text-xl tracking-wide uppercase">
                Custom Builder
              </h3>
              <p className="text-xs text-zinc-500">
                One exercise per line — Name | sets | reps | rest | cue
              </p>
            </div>
          </div>
          <PlanBuilder defaultGoal={user.goal ?? "recomp"} />
        </Card>
      </div>
    </div>
  );
}
