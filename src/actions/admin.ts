"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  coachAssignments,
  memberships,
  messages,
  payments,
  users,
} from "@/db/schema";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { todayStr } from "@/lib/dates";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  return user;
}

export async function addMemberAction(input: {
  name: string;
  email: string;
  plan: "normal" | "pt";
  durationDays: number;
  price: number;
  goal?: string;
}) {
  await requireAdmin();
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email) return { ok: false, error: "Name & email required" };
  if (!input.durationDays || input.durationDays < 1)
    return { ok: false, error: "Duration must be at least 1 day" };

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return { ok: false, error: "Email already registered" };

  const [member] = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      email,
      passwordHash: hashPassword("member123"),
      role: "member",
      goal: input.goal ?? "recomp",
      level: "beginner",
      avatarHue: Math.floor(Math.random() * 360),
    })
    .returning();

  await db.insert(memberships).values({
    userId: member.id,
    plan: input.plan,
    durationDays: input.durationDays,
    startDate: todayStr(),
    pricePaid: Math.max(0, Math.round(input.price || 0)),
  });

  if (input.price > 0) {
    await db.insert(payments).values({
      userId: member.id,
      amount: Math.round(input.price),
      plan: input.plan,
    });
  }

  revalidatePath("/admin");
  return { ok: true, tempPassword: "member123" };
}

/** Extend / upgrade an existing member — creates a new subscription + payment. */
export async function renewMembershipAction(
  memberId: number,
  plan: "normal" | "pt",
  durationDays: number,
  price: number
) {
  await requireAdmin();
  await db.insert(memberships).values({
    userId: memberId,
    plan,
    durationDays: Math.max(1, durationDays),
    startDate: todayStr(),
    pricePaid: Math.max(0, Math.round(price || 0)),
  });
  if (price > 0) {
    await db
      .insert(payments)
      .values({ userId: memberId, amount: Math.round(price), plan });
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function assignCoachAction(memberId: number, trainerId: number) {
  await requireAdmin();
  const existing = await db
    .select()
    .from(coachAssignments)
    .where(eq(coachAssignments.memberId, memberId))
    .limit(1);
  if (existing.length) {
    await db
      .update(coachAssignments)
      .set({ trainerId })
      .where(eq(coachAssignments.memberId, memberId));
  } else {
    await db.insert(coachAssignments).values({ memberId, trainerId });
  }
  revalidatePath("/admin");
  revalidatePath("/trainer");
  return { ok: true };
}

export async function dismissMessageAction(id: number) {
  await requireAdmin();
  await db.delete(messages).where(eq(messages.id, id));
  revalidatePath("/admin");
  return { ok: true };
}
