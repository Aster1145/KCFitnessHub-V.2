import { requireRole } from "@/lib/auth";
import {
  getActivePlan,
  getAssignmentsForTrainer,
  getAttendanceDates,
  getLatestMembership,
  getStudentsForTrainer,
  getThread,
} from "@/lib/data";
import { lastNDays, todayStr } from "@/lib/dates";
import { computeSubscription } from "@/lib/subscription";
import { PageHead, Stat } from "@/components/ui";
import StudentManager, { type StudentVM } from "./student-manager";

export const dynamic = "force-dynamic";

export default async function TrainerPage() {
  const trainer = await requireRole("trainer");
  const today = todayStr();
  const last14 = lastNDays(14, today);

  const [students, myDietAssignments] = await Promise.all([
    getStudentsForTrainer(trainer.id),
    getAssignmentsForTrainer(trainer.id),
  ]);

  const vms: StudentVM[] = await Promise.all(
    students.map(async (s) => {
      const [membership, dates, plan, thread] = await Promise.all([
        getLatestMembership(s.id),
        getAttendanceDates(s.id),
        getActivePlan(s.id),
        getThread(trainer.id, s.id),
      ]);
      const set = new Set(dates);
      const sub = membership ? computeSubscription(membership, dates, today) : null;
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        email: s.email,
        phone: s.phone,
        goal: s.goal ?? "recomp",
        level: s.level ?? "beginner",
        hue: s.avatarHue,
        planType: membership?.plan ?? null,
        remaining: sub?.remaining ?? null,
        pct: sub?.pct ?? 0,
        duration: sub?.totalDays ?? 0,
        lastCheckIn: dates.length ? dates[dates.length - 1] : null,
        checkedToday: set.has(today),
        dots: last14.map((d) => set.has(d)),
        dotDates: last14,
        activePlanTitle: plan?.plan.title ?? null,
        activePlanSource: plan?.plan.source ?? null,
        thread: thread.map((m) => ({
          id: m.id,
          body: m.body,
          mine: m.fromId === trainer.id,
          at: m.createdAt.toISOString(),
        })),
        meals: myDietAssignments
          .filter((a) => a.memberId === s.id)
          .map((a) => ({
            id: a.id,
            meal: a.meal,
            food: a.food,
            calories: a.calories,
          })),
      };
    })
  );

  const checkedInNow = vms.filter((v) => v.checkedToday).length;
  const avgAttendance =
    vms.length === 0
      ? 0
      : Math.round(
          (vms.reduce((a, v) => a + v.dots.filter(Boolean).length, 0) /
            (vms.length * 14)) *
            100
        );

  return (
    <div>
      <PageHead
        eyebrow="Trainer Portal"
        title={`Coach ${trainer.name.split(" ")[0]}`}
        sub={`Coach ID: ${trainer.code || "KCC0001"} · ${trainer.specialty || "Fitness Specialist"}${trainer.phone ? ` · 📞 ${trainer.phone}` : ""}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Students" value={vms.length} accent sub="Assigned to you" />
        <Stat label="In the gym now" value={checkedInNow} sub="Checked in today" />
        <Stat label="14-day attendance" value={`${avgAttendance}%`} sub="Across your roster" />
        <Stat
          label="Meals assigned"
          value={myDietAssignments.length}
          sub="Active diet items"
        />
      </div>

      <StudentManager students={vms} />
    </div>
  );
}
