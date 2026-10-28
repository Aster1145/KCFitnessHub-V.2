"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  attendance,
  coachAssignments,
  dietLogs,
  messages,
  users,
  exerciseCompletions,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { insertPlan, type PlanInput } from "@/lib/plans";

async function requireMember() {
  const user = await getSessionUser();
  if (!user || user.role !== "member") throw new Error("Unauthorized");
  return user;
}

export async function checkInAction() {
  const user = await requireMember();
  const today = todayStr();
  const existing = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.userId, user.id), eq(attendance.date, today)))
    .limit(1);
  if (!existing.length) {
    await db.insert(attendance).values({ userId: user.id, date: today });
  }
  revalidatePath("/member");
  revalidatePath("/admin");
}

export async function saveCustomPlanAction(input: PlanInput) {
  const user = await requireMember();
  await insertPlan(user.id, "custom", input);
  revalidatePath("/member/workouts");
  return { ok: true };
}

export async function saveAiPlanAction(input: PlanInput) {
  const user = await requireMember();
  await insertPlan(user.id, "ai", input);
  revalidatePath("/member/workouts");
  return { ok: true };
}

export async function logFoodAction(input: {
  meal: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const user = await requireMember();
  if (!input.food?.trim()) return { ok: false, error: "Food name required" };
  await db.insert(dietLogs).values({
    userId: user.id,
    date: todayStr(),
    meal: input.meal || "Meal",
    food: input.food.trim(),
    calories: Math.max(0, Math.round(input.calories || 0)),
    protein: Math.max(0, Math.round(input.protein || 0)),
    carbs: Math.max(0, Math.round(input.carbs || 0)),
    fat: Math.max(0, Math.round(input.fat || 0)),
  });
  revalidatePath("/member/diet");
  return { ok: true };
}

/** Member on a normal plan raises their hand for PT — admin sees the request. */
export async function requestUpgradeAction() {
  const user = await requireMember();
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (!admins.length) return { ok: false };
  await db.insert(messages).values({
    fromId: user.id,
    toId: admins[0].id,
    body: `UPGRADE_REQUEST :: ${user.name} wants Personal Training (${user.email})`,
  });
  revalidatePath("/admin");
  return { ok: true };
}

/** PT member requests a coach assignment. */
export async function requestCoachAction() {
  const user = await requireMember();
  const existing = await db
    .select()
    .from(coachAssignments)
    .where(eq(coachAssignments.memberId, user.id))
    .limit(1);
  if (existing.length) return { ok: true };
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (!admins.length) return { ok: false };
  await db.insert(messages).values({
    fromId: user.id,
    toId: admins[0].id,
    body: `COACH_REQUEST :: ${user.name} is waiting for coach assignment (${user.email})`,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function messageCoachAction(body: string) {
  const user = await requireMember();
  const row = await db
    .select()
    .from(coachAssignments)
    .where(eq(coachAssignments.memberId, user.id))
    .limit(1);
  if (!row.length) return { ok: false, error: "No coach assigned yet" };
  if (!body.trim()) return { ok: false, error: "Message is empty" };
  await db.insert(messages).values({
    fromId: user.id,
    toId: row[0].trainerId,
    body: body.trim(),
  });
  revalidatePath("/member/coach");
  return { ok: true };
}

/**
 * Toggle individual exercise checklist completion
 */
export async function toggleExerciseCompletionAction(
  exerciseId: number,
  targetDate: string = todayStr()
) {
  const user = await requireMember();

  const existing = await db
    .select()
    .from(exerciseCompletions)
    .where(
      and(
        eq(exerciseCompletions.userId, user.id),
        eq(exerciseCompletions.exerciseId, exerciseId),
        eq(exerciseCompletions.date, targetDate)
      )
    )
    .limit(1);

  let isNowCompleted = true;

  if (existing.length > 0) {
    // Already completed -> toggle off (delete)
    await db
      .delete(exerciseCompletions)
      .where(
        and(
          eq(exerciseCompletions.userId, user.id),
          eq(exerciseCompletions.exerciseId, exerciseId),
          eq(exerciseCompletions.date, targetDate)
        )
      );
    isNowCompleted = false;
  } else {
    // Mark completed
    await db.insert(exerciseCompletions).values({
      userId: user.id,
      exerciseId,
      date: targetDate,
      completed: true,
    });

    // Auto check-in attendance today if not already checked in
    if (targetDate === todayStr()) {
      const attendanceRec = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.userId, user.id),
            eq(attendance.date, targetDate)
          )
        )
        .limit(1);
      if (!attendanceRec.length) {
        await db.insert(attendance).values({ userId: user.id, date: targetDate });
      }
    }
  }

  revalidatePath("/member");
  revalidatePath("/member/workouts");
  return { ok: true, completed: isNowCompleted };
}

/**
 * Mark all exercises for a workout day as completed
 */
export async function batchCompleteExercisesAction(
  exerciseIds: number[],
  targetDate: string = todayStr()
) {
  const user = await requireMember();

  for (const exId of exerciseIds) {
    const existing = await db
      .select()
      .from(exerciseCompletions)
      .where(
        and(
          eq(exerciseCompletions.userId, user.id),
          eq(exerciseCompletions.exerciseId, exId),
          eq(exerciseCompletions.date, targetDate)
        )
      )
      .limit(1);

    if (!existing.length) {
      await db.insert(exerciseCompletions).values({
        userId: user.id,
        exerciseId: exId,
        date: targetDate,
        completed: true,
      });
    }
  }

  // Auto check-in attendance today
  if (targetDate === todayStr()) {
    const attendanceRec = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.userId, user.id), eq(attendance.date, targetDate)))
      .limit(1);
    if (!attendanceRec.length) {
      await db.insert(attendance).values({ userId: user.id, date: targetDate });
    }
  }

  revalidatePath("/member");
  revalidatePath("/member/workouts");
  return { ok: true, count: exerciseIds.length };
}

/**
 * Fetch completed exercise IDs for a given date
 */
export async function getCompletedExercisesAction(targetDate: string = todayStr()) {
  const user = await requireMember();
  const rows = await db
    .select({ exerciseId: exerciseCompletions.exerciseId })
    .from(exerciseCompletions)
    .where(
      and(
        eq(exerciseCompletions.userId, user.id),
        eq(exerciseCompletions.date, targetDate),
        eq(exerciseCompletions.completed, true)
      )
    );
  return { ok: true, completedIds: rows.map((r) => r.exerciseId) };
}
