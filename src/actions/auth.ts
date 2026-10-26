"use server";

import { eq, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
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
