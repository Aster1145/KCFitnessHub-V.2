import { and, desc, eq, gte, inArray, or, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  attendance,
  coachAssignments,
  dietAssignments,
  dietLogs,
  memberships,
  messages,
  payments,
  planExercises,
  users,
  workoutDays,
  workoutPlans,
  type DietAssignment,
  type DietLog,
  type Message,
  type PlanExercise,
  type User,
  type WorkoutDay,
  type WorkoutPlan,
  type Membership,
} from "@/db/schema";
import { monthKey, todayStr } from "./dates";

// ---------- Membership ----------
export async function getLatestMembership(
  userId: number
): Promise<Membership | null> {
  const rows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

// ---------- Attendance ----------
export async function getAttendanceDates(userId: number): Promise<string[]> {
  const rows = await db
    .select({ date: attendance.date })
    .from(attendance)
    .where(eq(attendance.userId, userId))
    .orderBy(asc(attendance.date));
  return rows.map((r) => r.date);
}

export async function getCheckinsOn(date: string) {
  return db
    .select({
      id: attendance.id,
      userId: attendance.userId,
      name: users.name,
      hue: users.avatarHue,
      at: attendance.createdAt,
    })
    .from(attendance)
    .innerJoin(users, eq(attendance.userId, users.id))
    .where(eq(attendance.date, date))
    .orderBy(desc(attendance.createdAt));
}

// ---------- Coach ----------
export async function getCoachForMember(memberId: number) {
  const rows = await db
    .select({ assignment: coachAssignments, coach: users })
    .from(coachAssignments)
    .innerJoin(users, eq(coachAssignments.trainerId, users.id))
    .where(eq(coachAssignments.memberId, memberId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getStudentsForTrainer(trainerId: number) {
  const rows = await db
    .select({ assignment: coachAssignments, member: users })
    .from(coachAssignments)
    .innerJoin(users, eq(coachAssignments.memberId, users.id))
    .where(eq(coachAssignments.trainerId, trainerId));
  return rows.map((r) => r.member);
}

// ---------- Workout plans ----------
export interface FullPlan {
  plan: WorkoutPlan;
  days: (WorkoutDay & { exercises: PlanExercise[] })[];
  coachName?: string | null;
}

export async function getActivePlan(userId: number): Promise<FullPlan | null> {
  const plans = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)))
    .orderBy(desc(workoutPlans.createdAt))
    .limit(1);
  const plan = plans[0];
  if (!plan) return null;

  const days = await db
    .select()
    .from(workoutDays)
    .where(eq(workoutDays.planId, plan.id))
    .orderBy(asc(workoutDays.dayIndex));

  const dayIds = days.map((d) => d.id);
  const exs = dayIds.length
    ? await db
        .select()
        .from(planExercises)
        .where(inArray(planExercises.dayId, dayIds))
        .orderBy(asc(planExercises.orderIndex))
    : [];

  let coachName: string | null = null;
  if (plan.source === "coach" && plan.createdBy) {
    const c = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, plan.createdBy))
      .limit(1);
    coachName = c[0]?.name ?? null;
  }

  return {
    plan,
    days: days.map((d) => ({
      ...d,
      exercises: exs.filter((e) => e.dayId === d.id),
    })),
    coachName,
  };
}

// ---------- Diet ----------
export async function getDietLogs(userId: number, date: string): Promise<DietLog[]> {
  return db
    .select()
    .from(dietLogs)
    .where(and(eq(dietLogs.userId, userId), eq(dietLogs.date, date)))
    .orderBy(asc(dietLogs.createdAt));
}

export async function getDietLogsSince(userId: number, since: string): Promise<DietLog[]> {
  return db
    .select()
    .from(dietLogs)
    .where(and(eq(dietLogs.userId, userId), gte(dietLogs.date, since)))
    .orderBy(asc(dietLogs.date));
}

export async function getDietAssignments(memberId: number): Promise<DietAssignment[]> {
  return db
    .select()
    .from(dietAssignments)
    .where(eq(dietAssignments.memberId, memberId))
    .orderBy(desc(dietAssignments.createdAt));
}

export async function getAssignmentsForTrainer(trainerId: number) {
  return db
    .select()
    .from(dietAssignments)
    .where(eq(dietAssignments.trainerId, trainerId))
    .orderBy(desc(dietAssignments.createdAt));
}

// ---------- Messages ----------
export async function getThread(a: number, b: number): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.fromId, a), eq(messages.toId, b)),
        and(eq(messages.fromId, b), eq(messages.toId, a))
      )
    )
    .orderBy(asc(messages.createdAt));
}

export async function getAdminInbox(): Promise<(Message & { fromName: string })[]> {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));
  if (!admins.length) return [];
  const rows = await db
    .select({ msg: messages, fromName: users.name })
    .from(messages)
    .innerJoin(users, eq(messages.fromId, users.id))
    .where(inArray(messages.toId, admins.map((a) => a.id)))
    .orderBy(desc(messages.createdAt))
    .limit(30);
  return rows.map((r) => ({ ...r.msg, fromName: r.fromName }));
}

// ---------- Admin aggregates ----------
export async function getAllTrainers(): Promise<User[]> {
  return db.select().from(users).where(eq(users.role, "trainer"));
}

export async function getAllMembers(): Promise<User[]> {
  return db
    .select()
    .from(users)
    .where(eq(users.role, "member"))
    .orderBy(desc(users.createdAt));
}

export async function getAllMemberships(): Promise<Membership[]> {
  return db.select().from(memberships).orderBy(desc(memberships.createdAt));
}

export async function getAllAttendance(): Promise<{ userId: number; date: string }[]> {
  return db.select({ userId: attendance.userId, date: attendance.date }).from(attendance);
}

export async function getAllPayments() {
  return db
    .select({
      payment: payments,
      name: users.name,
    })
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .orderBy(desc(payments.createdAt));
}

export async function revenueByMonth(nMonths = 6) {
  const rows = await db.select().from(payments);
  const now = new Date();
  const buckets: { key: string; normal: number; pt: number }[] = [];
  for (let i = nMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), normal: 0, pt: 0 });
  }
  for (const p of rows) {
    const key = monthKey(p.createdAt);
    const b = buckets.find((x) => x.key === key);
    if (!b) continue;
    if (p.plan === "pt") b.pt += p.amount;
    else b.normal += p.amount;
  }
  return buckets;
}

export async function attendanceLast7(): Promise<{ date: string; count: number }[]> {
  const seven = new Date(Date.now() - 6 * 86400000);
  const since = todayStr(seven);
  const rows = await db
    .select({ date: attendance.date, count: sql<number>`count(*)::int` })
    .from(attendance)
    .where(gte(attendance.date, since))
    .groupBy(attendance.date);

  const out: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = todayStr(d);
    out.push({ date: key, count: rows.find((r) => r.date === key)?.count ?? 0 });
  }
  return out;
}
