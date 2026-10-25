"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { coachAssignments, dietAssignments, messages } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { insertPlan, type PlanInput } from "@/lib/plans";

async function requireTrainer() {
  const user = await getSessionUser();
  if (!user || user.role !== "trainer") throw new Error("Unauthorized");
  return user;
}

async function assertStudent(trainerId: number, memberId: number) {
  const rows = await db
    .select()
    .from(coachAssignments)
    .where(
      and(
        eq(coachAssignments.trainerId, trainerId),
        eq(coachAssignments.memberId, memberId)
      )
    )
    .limit(1);
  if (!rows.length) throw new Error("Not your student");
}

export async function assignPlanAction(memberId: number, input: PlanInput) {
  const trainer = await requireTrainer();
  await assertStudent(trainer.id, memberId);
  await insertPlan(memberId, "coach", input, trainer.id);
  revalidatePath("/trainer");
  revalidatePath("/member/workouts");
  return { ok: true };
}

export async function assignDietAction(
  memberId: number,
  items: {
    meal: string;
    food: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes?: string;
  }[]
) {
  const trainer = await requireTrainer();
  await assertStudent(trainer.id, memberId);
  const clean = items.filter((i) => i.food?.trim());
  if (!clean.length) return { ok: false, error: "Add at least one food item" };
  await db.insert(dietAssignments).values(
    clean.map((i) => ({
      trainerId: trainer.id,
      memberId,
      meal: i.meal || "Meal",
      food: i.food.trim(),
      calories: Math.max(0, Math.round(i.calories || 0)),
      protein: Math.max(0, Math.round(i.protein || 0)),
      carbs: Math.max(0, Math.round(i.carbs || 0)),
      fat: Math.max(0, Math.round(i.fat || 0)),
      notes: i.notes ?? "",
    }))
  );
  revalidatePath("/trainer");
  revalidatePath("/member/diet");
  return { ok: true };
}

export async function replyToMemberAction(memberId: number, body: string) {
  const trainer = await requireTrainer();
  await assertStudent(trainer.id, memberId);
  if (!body.trim()) return { ok: false, error: "Message is empty" };
  await db
    .insert(messages)
    .values({ fromId: trainer.id, toId: memberId, body: body.trim() });
  revalidatePath("/trainer");
  return { ok: true };
}
