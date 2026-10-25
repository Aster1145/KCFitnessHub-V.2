import Link from "next/link";
import {
  Crown,
  Dumbbell,
  Handshake,
  Hourglass,
  Salad,
  UserPlus,
} from "lucide-react";
import {
  messageCoachAction,
  requestCoachAction,
  requestUpgradeAction,
} from "@/actions/member";
import { Avatar, Card, Chip, PageHead } from "@/components/ui";
import MessageBox from "@/components/message-box";
import { requireRole } from "@/lib/auth";
import {
  getActivePlan,
  getCoachForMember,
  getDietAssignments,
  getLatestMembership,
  getThread,
} from "@/lib/data";
import { prettyDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const user = await requireRole("member");
  const [membership, coachRow] = await Promise.all([
    getLatestMembership(user.id),
    getCoachForMember(user.id),
  ]);
  const isPt = membership?.plan === "pt";

  // -------- Normal plan upsell --------
  if (!isPt) {
    return (
      <div>
        <PageHead
          eyebrow="Coaching"
          title="Coach Connect"
          sub="Personal Training members get a dedicated coach inside FORGE — plans, diets and replies without a single phone call."
        />
        <Card className="mx-auto max-w-xl border-volt/30 bg-gradient-to-b from-volt/10 to-steel text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-volt/15 text-volt">
            <Crown size={26} />
          </span>
          <h3 className="font-display mt-5 text-3xl tracking-wide uppercase">
            You&apos;re on Forge Normal
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
            Upgrade to Personal Training and we&apos;ll match you with a coach who
            builds your split, assigns your meals and tracks every check-in.
            ₹4,999 / 30 coached days.
          </p>
          <form
            action={async () => {
              "use server";
              await requestUpgradeAction();
            }}
            className="mt-7"
          >
            <button className="rounded-xl bg-volt px-8 py-3.5 text-sm font-bold tracking-widest text-carbon uppercase transition-transform hover:scale-105">
              Request upgrade
            </button>
          </form>
          <p className="mt-3 text-[11px] text-zinc-600">
            The club manager will confirm and assign your coach.
          </p>
        </Card>
      </div>
    );
  }

  // -------- PT but no coach yet --------
  if (!coachRow) {
    return (
      <div>
        <PageHead eyebrow="Coaching" title="Coach Connect" />
        <Card className="mx-auto max-w-xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-smoke text-sky-300">
            <Hourglass size={26} />
          </span>
          <h3 className="font-display mt-5 text-3xl tracking-wide uppercase">
            Matching your coach
          </h3>
          <p className="mx-auto mt-3 max-w-sm text-sm text-zinc-400">
            You&apos;re on Personal Training. The club assigns a coach based on your
            goal — ping the desk to fast-track it.
          </p>
          <form
            action={async () => {
              "use server";
              await requestCoachAction();
            }}
            className="mt-7"
          >
            <button className="mx-auto flex items-center gap-2 rounded-xl border border-sky-400/40 px-8 py-3.5 text-sm font-bold tracking-widest text-sky-300 uppercase transition-colors hover:bg-sky-400 hover:text-carbon">
              <UserPlus size={16} /> Nudge the club
            </button>
          </form>
        </Card>
      </div>
    );
  }

  // -------- PT with coach --------
  const coach = coachRow.coach;
  const [thread, plan, assignedMeals] = await Promise.all([
    getThread(user.id, coach.id),
    getActivePlan(user.id),
    getDietAssignments(user.id),
  ]);
  const coachPlan = plan && plan.plan.source === "coach" ? plan : null;

  return (
    <div>
      <PageHead
        eyebrow="Coaching"
        title="Coach Connect"
        sub="Your coach programs everything from the trainer portal — you just train and check in."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Coach card + thread */}
        <div className="space-y-4">
          <Card className="flex items-center gap-5">
            <Avatar name={coach.name} hue={coach.avatarHue} size={66} />
            <div className="flex-1">
              <p className="font-display text-2xl tracking-wide">{coach.name}</p>
              <p className="text-xs text-zinc-500">{coach.specialty ?? "FORGE Coach"}</p>
              <Chip tone="blue" className="mt-2">Your PT coach</Chip>
            </div>
          </Card>

          <Card>
            <h3 className="font-display mb-4 text-xl tracking-wide uppercase">
              Messages
            </h3>
            <div className="mb-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {thread.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">
                  Say hi — coaches usually reply within the day.
                </p>
              ) : (
                thread.map((m) => {
                  const mine = m.fromId === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : ""}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          mine
                            ? "rounded-br-md bg-volt text-carbon"
                            : "rounded-bl-md bg-smoke text-zinc-200"
                        }`}
                      >
                        <p>{m.body}</p>
                        <p
                          className={`mt-1 text-[9px] ${
                            mine ? "text-carbon/60" : "text-zinc-500"
                          }`}
                        >
                          {prettyDateTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <MessageBox onSend={messageCoachAction} placeholder={`Message ${coach.name.split(" ")[0]}…`} />
          </Card>
        </div>

        {/* Coach-authored plan + diet */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-display flex items-center gap-2 text-xl tracking-wide uppercase">
                <Dumbbell size={18} className="text-sky-300" /> Plan from coach
              </h3>
              {coachPlan ? <Chip tone="blue">Coach-authored</Chip> : null}
            </div>
            {coachPlan ? (
              <div className="mt-4">
                <p className="font-semibold text-zinc-100">{coachPlan.plan.title}</p>
                {coachPlan.plan.summary ? (
                  <p className="mt-1 text-sm text-zinc-400">{coachPlan.plan.summary}</p>
                ) : null}
                <ul className="mt-4 space-y-3">
                  {coachPlan.days.map((d) => (
                    <li key={d.id} className="rounded-xl border border-line bg-carbon p-3.5">
                      <p className="text-xs font-bold tracking-widest text-zinc-300 uppercase">
                        {d.label}
                        {d.focus ? <span className="text-sky-300"> · {d.focus}</span> : null}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                        {d.exercises
                          .map((e) => `${e.name} ${e.sets}×${e.reps}`)
                          .join("  ·  ")}
                      </p>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/member/workouts"
                  className="mt-4 inline-block text-xs font-semibold tracking-widest text-volt uppercase hover:underline"
                >
                  Open full plan →
                </Link>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">
                Your coach hasn&apos;t published a plan yet — it&apos;ll land here and in
                Workouts the moment they do.
              </p>
            )}
          </Card>

          <Card>
            <h3 className="font-display flex items-center gap-2 text-xl tracking-wide uppercase">
              <Salad size={18} className="text-volt" /> Assigned meals
            </h3>
            {assignedMeals.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No meal assignments yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {assignedMeals.slice(0, 8).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-line bg-carbon px-4 py-2.5 text-sm"
                  >
                    <span className="text-zinc-200">
                      <span className="text-zinc-500">{a.meal} ·</span> {a.food}
                    </span>
                    <span className="text-xs text-zinc-500">{a.calories} kcal</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/member/diet"
              className="mt-4 inline-block text-xs font-semibold tracking-widest text-volt uppercase hover:underline"
            >
              Open diet tracker →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
