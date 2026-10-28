"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  coachAssignments,
  coaches,
  members,
  memberships,
  messages,
  payments,
  pendingMembers,
  users,
} from "@/db/schema";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { prettyDate, todayStr } from "@/lib/dates";
import { sendWelcomeEmail } from "@/lib/email";

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  return user;
}

export async function getNextUserCode(role: "member" | "trainer" | "admin"): Promise<string> {
  const prefix = role === "member" ? "KCM" : role === "trainer" ? "KCC" : "KCA";
  const rows = await db
    .select({ code: users.code })
    .from(users)
    .where(eq(users.role, role));

  let maxNum = 0;
  for (const r of rows) {
    if (r.code && r.code.toUpperCase().startsWith(prefix)) {
      const num = parseInt(r.code.slice(prefix.length), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
}

export async function addMemberAction(input: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  plan: "normal" | "pt";
  durationDays: number;
  price: number;
  paymentMethod?: "UPI" | "Cash" | "Card";
  goal?: string;
  coachId?: number;
}) {
  await requireAdmin();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  if (!name || !email) return { ok: false, error: "Name & email required" };
  if (!input.durationDays || input.durationDays < 1)
    return { ok: false, error: "Duration must be at least 1 day" };

  const rawPassword = input.password?.trim() || "";
  if (rawPassword && rawPassword.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }
  // If no password entered, generate a clear secure password
  const finalPassword = rawPassword || `KC${Math.floor(100000 + Math.random() * 900000)}`;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return { ok: false, error: "Email already registered" };

  const code = await getNextUserCode("member");

  const [member] = await db
    .insert(users)
    .values({
      code,
      name,
      email,
      phone,
      passwordHash: hashPassword(finalPassword),
      role: "member",
      goal: input.goal ?? "recomp",
      level: "beginner",
      avatarHue: Math.floor(Math.random() * 360),
    })
    .returning();

  // Also sync to members table
  try {
    await db.insert(members).values({
      userId: member.id,
      code,
      name,
      email,
      phone,
      goal: input.goal ?? "recomp",
      level: "beginner",
      avatarHue: member.avatarHue,
    });
  } catch (err) {
    console.error("Failed to sync members table:", err);
  }

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
      method: input.paymentMethod || "UPI",
    });
  }

  if (input.coachId) {
    await db.insert(coachAssignments).values({
      memberId: member.id,
      trainerId: input.coachId,
    });
  }

  // Auto welcome email
  let emailSent = false;
  try {
    const emailRes = await sendWelcomeEmail({
      toEmail: member.email,
      toName: member.name,
      memberCode: code,
      password: finalPassword,
      planName: `${input.durationDays} Days (${input.plan === "pt" ? "Personal Training" : "General Fitness"})`,
      startDate: prettyDate(new Date()),
      phone: member.phone,
    });
    emailSent = emailRes.success;
  } catch (err) {
    console.error("Failed to dispatch welcome email:", err);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/admin/revenue");
  return {
    ok: true,
    code,
    password: finalPassword,
    email: member.email,
    name: member.name,
    phone: member.phone,
    emailSent,
  };
}

export async function addCoachAction(input: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  specialty?: string;
}) {
  await requireAdmin();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const specialty = input.specialty?.trim() || "General Fitness & Conditioning";

  if (!name || !email) return { ok: false, error: "Name & email are required" };

  const rawPassword = input.password?.trim() || "";
  if (rawPassword && rawPassword.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }
  const finalPassword = rawPassword || `Coach@${Math.floor(1000 + Math.random() * 9000)}`;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return { ok: false, error: "Email already registered" };

  const code = await getNextUserCode("trainer");

  const [coach] = await db
    .insert(users)
    .values({
      code,
      name,
      email,
      phone,
      passwordHash: hashPassword(finalPassword),
      role: "trainer",
      specialty,
      avatarHue: Math.floor(Math.random() * 360),
    })
    .returning();

  // Also sync to coaches table
  try {
    await db.insert(coaches).values({
      userId: coach.id,
      code,
      name,
      email,
      phone,
      specialty,
      avatarHue: coach.avatarHue,
    });
  } catch (err) {
    console.error("Failed to sync coaches table:", err);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
  revalidatePath("/trainer");
  return {
    ok: true,
    code,
    password: finalPassword,
    email: coach.email,
    name: coach.name,
    phone: coach.phone,
  };
}

// ---------- Public Join Application (Manual or Google Auth) ----------
export async function submitJoinApplicationAction(input: {
  name: string;
  email: string;
  phone: string;
  plan?: string; // "normal" | "pt"
  durationDays?: number;
  goal?: string;
  level?: string;
  authProvider?: string; // "google" | "manual"
  notes?: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  if (!name || !email || !phone) {
    return { ok: false, error: "Name, email, and phone number are required." };
  }

  // Check if email already has active account
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length) {
    return {
      ok: false,
      error: "An account with this email already exists! Please log in at /login.",
    };
  }

  // Check if already in pending list
  const existingPending = await db
    .select()
    .from(pendingMembers)
    .where(eq(pendingMembers.email, email))
    .limit(1);

  if (existingPending.length && existingPending[0].status === "pending") {
    return {
      ok: true,
      pendingId: existingPending[0].id,
      alreadySubmitted: true,
      message: "You have an existing pending application with this email! KC Fitness Hub admin will activate it upon payment.",
    };
  }

  const [row] = await db
    .insert(pendingMembers)
    .values({
      name,
      email,
      phone,
      plan: input.plan || "normal",
      durationDays: input.durationDays || 30,
      goal: input.goal || "recomp",
      level: input.level || "beginner",
      authProvider: input.authProvider || "manual",
      status: "pending",
      notes: input.notes?.trim() || null,
    })
    .returning();

  revalidatePath("/admin");
  revalidatePath("/admin/pending");
  revalidatePath("/admin/members");
  return { ok: true, pendingId: row.id };
}

// ---------- Approve & Activate Pending Member ----------
export async function approvePendingMemberAction(input: {
  pendingId: number;
  plan: "normal" | "pt";
  durationDays: number;
  price: number;
  paymentMethod: "UPI" | "Cash" | "Card";
  coachId?: number;
  password?: string;
  sendEmail?: boolean;
}) {
  await requireAdmin();

  const [pending] = await db
    .select()
    .from(pendingMembers)
    .where(eq(pendingMembers.id, input.pendingId))
    .limit(1);

  if (!pending) {
    return { ok: false, error: "Pending application not found." };
  }
  if (pending.status === "approved") {
    return { ok: false, error: "This application has already been approved." };
  }

  // Check if email was registered in the meantime
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, pending.email.toLowerCase()))
    .limit(1);

  if (existing.length) {
    return { ok: false, error: `Email ${pending.email} is already registered.` };
  }

  const rawPassword = input.password?.trim() || "";
  const finalPassword = rawPassword || `KC${Math.floor(100000 + Math.random() * 900000)}`;
  const code = await getNextUserCode("member");

  // 1. Create User
  const [newMember] = await db
    .insert(users)
    .values({
      code,
      name: pending.name,
      email: pending.email.toLowerCase(),
      phone: pending.phone,
      passwordHash: hashPassword(finalPassword),
      role: "member",
      goal: pending.goal || "recomp",
      level: pending.level || "beginner",
      avatarHue: Math.floor(Math.random() * 360),
    })
    .returning();

  // 2. Sync to members table
  try {
    await db.insert(members).values({
      userId: newMember.id,
      code,
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      goal: newMember.goal,
      level: newMember.level,
      avatarHue: newMember.avatarHue,
    });
  } catch (err) {
    console.error("Failed to sync members table:", err);
  }

  // 3. Create Membership
  await db.insert(memberships).values({
    userId: newMember.id,
    plan: input.plan,
    durationDays: Math.max(1, input.durationDays),
    startDate: todayStr(),
    pricePaid: Math.max(0, Math.round(input.price || 0)),
  });

  // 4. Create Payment record
  if (input.price > 0) {
    await db.insert(payments).values({
      userId: newMember.id,
      amount: Math.round(input.price),
      plan: input.plan,
      method: input.paymentMethod || "UPI",
    });
  }

  // 5. Optional Coach assignment
  let coachName: string | null = null;
  if (input.coachId) {
    await db.insert(coachAssignments).values({
      memberId: newMember.id,
      trainerId: input.coachId,
    });
    const [c] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, input.coachId))
      .limit(1);
    if (c) coachName = c.name;
  }

  // 6. Update pending status
  await db
    .update(pendingMembers)
    .set({
      status: "approved",
      approvedAt: new Date(),
      approvedUserId: newMember.id,
    })
    .where(eq(pendingMembers.id, pending.id));

  // 7. Auto welcome email dispatch
  let emailSent = false;
  if (input.sendEmail !== false) {
    try {
      const emailRes = await sendWelcomeEmail({
        toEmail: newMember.email,
        toName: newMember.name,
        memberCode: code,
        password: finalPassword,
        planName: `${input.durationDays} Days (${input.plan === "pt" ? "Personal Training" : "General Fitness"})`,
        startDate: prettyDate(new Date()),
        phone: newMember.phone,
        coachName,
      });
      emailSent = emailRes.success;
    } catch (err) {
      console.error("Auto welcome email failed:", err);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/admin/pending");
  revalidatePath("/admin/revenue");

  return {
    ok: true,
    code,
    password: finalPassword,
    email: newMember.email,
    phone: newMember.phone,
    name: newMember.name,
    emailSent,
  };
}

export async function rejectPendingMemberAction(pendingId: number) {
  await requireAdmin();
  await db
    .update(pendingMembers)
    .set({ status: "rejected" })
    .where(eq(pendingMembers.id, pendingId));

  revalidatePath("/admin");
  revalidatePath("/admin/pending");
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function updateUserPasswordAction(userId: number, newPassword: string) {
  await requireAdmin();
  const pwd = newPassword.trim();
  if (pwd.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(pwd) })
    .where(eq(users.id, userId));

  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteUserAction(userId: number) {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return { ok: false, error: "Cannot delete your own admin account" };
  }

  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/admin");
  revalidatePath("/trainer");
  return { ok: true };
}

export async function renewMembershipAction(
  memberId: number,
  plan: "normal" | "pt",
  durationDays: number,
  price: number,
  paymentMethod: "UPI" | "Cash" | "Card" = "UPI"
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
      .values({
        userId: memberId,
        amount: Math.round(price),
        plan,
        method: paymentMethod,
      });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/renewals");
  revalidatePath("/admin/revenue");
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

/**
 * Re-generates a secure password and emails the login credentials
 * (Member ID, Email, Password, Login link) to the member.
 */
export async function resendMemberCredentialsAction(userId: number) {
  await requireAdmin();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { ok: false, error: "Member not found" };
  }

  // Get latest membership info
  const [membership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.id))
    .limit(1);

  // Auto-generate fresh secure password
  const newPassword = `KC${Math.floor(100000 + Math.random() * 900000)}`;
  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(users.id, userId));

  const planName = membership
    ? `${membership.durationDays} Days (${membership.plan === "pt" ? "Personal Training" : "General Fitness"})`
    : "Active Member Access";

  const memberCode = user.code || `KCM${String(user.id).padStart(4, "0")}`;

  // Send the credentials email
  const emailRes = await sendWelcomeEmail({
    toEmail: user.email,
    toName: user.name,
    memberCode,
    password: newPassword,
    planName,
    startDate: membership?.startDate || todayStr(),
    phone: user.phone,
  });

  revalidatePath("/admin/members");
  return {
    ok: true,
    code: memberCode,
    email: user.email,
    name: user.name,
    password: newPassword,
    phone: user.phone,
    emailSent: emailRes.success,
    simulated: emailRes.simulated,
  };
}

