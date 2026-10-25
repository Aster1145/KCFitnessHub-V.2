import Link from "next/link";
import {
  CalendarCheck2,
  Flame,
  TrendingUp,
  ArrowRight,
  CalendarPlus,
  Dumbbell,
  Handshake,
  CheckCircle2,
} from "lucide-react";
import { checkInAction } from "@/actions/member";
import { Avatar, Card, Chip, Empty, PageHead, Ring, Stat } from "@/components/ui";
import Heatmap from "@/components/heatmap";
import { requireRole } from "@/lib/auth";
import { getAttendanceDates, getCoachForMember, getLatestMembership } from "@/lib/data";
import { prettyDate, todayStr } from "@/lib/dates";
import { computeSubscription, currentStreak } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function MemberDashboard() {
  const user = await requireRole("member");
  const today = todayStr();

  const [membership, attendedDates, coachRow] = await Promise.all([
    getLatestMembership(user.id),
    getAttendanceDates(user.id),
    getCoachForMember(user.id),
  ]);

  const attendedSet = new Set(attendedDates);
  const checkedInToday = attendedSet.has(today);
  const streak = currentStreak(attendedSet, today);

  if (!membership) {
    return (
      <div>
        <PageHead eyebrow="Dashboard" title={`Hey, ${user.name.split(" ")[0]}`} />
        <Empty
          title="No active membership"
          hint="Your plan will appear here once the club activates it."
        />
      </div>
    );
  }

  const sub = computeSubscription(membership, attendedDates, today);
  const isPt = membership.plan === "pt";

  return (
    <div>
      <PageHead
        eyebrow={prettyDate(today)}
        title={`Hey, ${user.name.split(" ")[0]}`}
        sub="Only the days you train count against your plan. Miss a day and your end date moves — automatically."
        right={
          checkedInToday ? (
            <div className="flex items-center gap-2 rounded-full border border-volt/40 bg-volt/10 px-5 py-3 text-sm font-bold text-volt">
              <CheckCircle2 size={17} /> Checked in today
            </div>
          ) : (
            <form action={checkInAction}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full bg-volt px-6 py-3 text-sm font-bold tracking-widest text-carbon uppercase transition-transform hover:scale-105"
              >
                <CalendarCheck2 size={17} /> Check in now
              </button>
            </form>
          )
        }
      />

      {/* Top row: ring + key stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center justify-center gap-6 lg:col-span-1">
          <Ring pct={sub.pct} size={170}>
            <div className="text-center">
              <p className="font-display text-4xl text-zinc-100">{sub.used}</p>
              <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                of {sub.totalDays} sessions
              </p>
            </div>
          </Ring>
          <div className="space-y-2 text-sm">
            <Chip tone={isPt ? "blue" : "volt"}>
              {isPt ? "Personal Training" : "Forge Normal"}
            </Chip>
            <p className="text-zinc-400">
              <span className="font-semibold text-zinc-200">{sub.remaining}</span>{" "}
              sessions left
            </p>
            <p className="text-xs leading-snug text-zinc-500">
              {sub.active
                ? "Your plan is active and counting."
                : "Plan complete — talk to the desk to renew."}
            </p>
          </div>
        </Card>

        <Stat
          label="Sessions remaining"
          value={sub.remaining}
          accent
          sub={`${sub.used} of ${sub.totalDays} promised sessions used`}
        />
        <Stat
          label="Auto extension"
          value={`+${sub.absent}d`}
          sub={
            <span className="flex items-center gap-1">
              <CalendarPlus size={13} className="text-volt" />
              Absent days pushed your end date out
            </span>
          }
        />
        <div className="grid grid-cols-2 gap-4 lg:hidden">
          <Stat label="Streak" value={`${streak}d`} sub="Current run" />
          <Stat label="Attendance" value={`${sub.pct}%`} sub="Plan progress" />
        </div>
        <div className="hidden lg:grid lg:grid-cols-1 lg:gap-4">
          <Stat
            label="Current streak"
            value={`${streak}d`}
            sub={
              <span className="flex items-center gap-1">
                <Flame size={13} className="text-volt" /> Consecutive training days
              </span>
            }
          />
        </div>
      </div>

      {/* Subscription + attendance */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide uppercase">
              Attendance = Billing
            </h3>
            <Chip tone="volt">Live engine</Chip>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                Started
              </p>
              <p className="mt-1 font-display text-lg text-zinc-200">
                {prettyDate(membership.startDate)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                Promised end
              </p>
              <p className="mt-1 font-display text-lg text-zinc-400 line-through decoration-red-400/60">
                {prettyDate(sub.promisedEnd)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                Adjusted end
              </p>
              <p className="mt-1 font-display text-lg text-volt">
                {prettyDate(sub.endDate)}
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-volt/20 bg-volt/5 p-4 text-sm leading-relaxed text-zinc-300">
            <span className="font-semibold text-volt">How it works:</span> your plan
            promises <span className="font-semibold">{sub.totalDays} attended sessions</span>.
            You&apos;ve trained {sub.used} and missed {sub.absent} — so your
            calendar was extended by {sub.absent} days for free.
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-smoke">
            <div
              className="h-full rounded-full bg-volt transition-all duration-700"
              style={{ width: `${sub.pct}%` }}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <Heatmap attended={attendedSet} />
        </Card>
      </div>

      {/* Quick links */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Link
          href="/member/workouts"
          className="group flex items-center justify-between rounded-2xl border border-line bg-steel p-6 transition-colors hover:border-volt/40"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-smoke text-volt">
              <Dumbbell size={22} />
            </span>
            <div>
              <p className="font-display text-xl tracking-wide uppercase">
                Workout Architect
              </p>
              <p className="text-xs text-zinc-500">
                Build your own split or let the AI engine write one
              </p>
            </div>
          </div>
          <ArrowRight size={18} className="text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-volt" />
        </Link>

        {isPt ? (
          <Link
            href="/member/coach"
            className="group flex items-center justify-between rounded-2xl border border-sky-400/25 bg-steel p-6 transition-colors hover:border-sky-400/50"
          >
            <div className="flex items-center gap-4">
              {coachRow ? (
                <Avatar name={coachRow.coach.name} hue={coachRow.coach.avatarHue} size={48} />
              ) : (
                <span className="grid size-12 place-items-center rounded-xl bg-smoke text-sky-300">
                  <Handshake size={22} />
                </span>
              )}
              <div>
                <p className="font-display text-xl tracking-wide uppercase">My Coach</p>
                <p className="text-xs text-zinc-500">
                  {coachRow
                    ? `${coachRow.coach.name} — message or check your plan`
                    : "Coach assignment in progress"}
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-sky-300" />
          </Link>
        ) : (
          <Link
            href="/member/learn"
            className="group flex items-center justify-between rounded-2xl border border-line bg-steel p-6 transition-colors hover:border-volt/40"
          >
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-xl bg-smoke text-volt">
                <TrendingUp size={22} />
              </span>
              <div>
                <p className="font-display text-xl tracking-wide uppercase">
                  Level up fast
                </p>
                <p className="text-xs text-zinc-500">
                  Beginner → Extreme video guides for every goal
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-volt" />
          </Link>
        )}
      </div>
    </div>
  );
}
