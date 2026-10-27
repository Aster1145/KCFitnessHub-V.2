"use server";

import { eq, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pendingMembers, users } from "@/db/schema";
import {
  createSession,
  destroySession,
  homeForRole,
  verifyPassword,
} from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Enter your User ID or email, and password." };
  }

  // Allow login with either Email or User ID (e.g. KCM0001, KCC0001, KCA0001)
  const rows = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.email, identifier.toLowerCase()),
        eq(sql`LOWER(${users.code})`, identifier.toLowerCase())
      )
    )
    .limit(1);

  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid credentials. Please check your ID/Email and password." };
  }

  await createSession(user.id);
  // One portal, any role — the member never sees a role picker.
  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function googleLoginAction(
  email: string
): Promise<{ ok: boolean; error?: string; redirectUrl?: string }> {
  if (!email) {
    return { ok: false, error: "No email received from Google account." };
  }

  const normalized = email.trim().toLowerCase();

  // Find user by registered email in users table
  const rows = await db
    .select()
    .from(users)
    .where(eq(sql`LOWER(${users.email})`, normalized))
    .limit(1);

  const user = rows[0];

  if (!user) {
    // Check if there is a pending registration
    const pending = await db
      .select()
      .from(pendingMembers)
      .where(eq(sql`LOWER(${pendingMembers.email})`, normalized))
      .limit(1);

    if (pending.length > 0 && pending[0].status === "pending") {
      return {
        ok: false,
        error: `Your membership application (${pending[0].name}) is currently pending payment and admin activation. Once admin confirms your payment, your account will be activated.`,
      };
    }

    return {
      ok: false,
      error: `No KC Fitness Hub account found for "${email}". If you are a new member, please submit an application at the Join page first.`,
    };
  }

  await createSession(user.id);
  return {
    ok: true,
    redirectUrl: homeForRole(user.role),
  };
}
