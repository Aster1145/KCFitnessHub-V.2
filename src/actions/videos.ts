"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { users, workoutVideos, type WorkoutVideo } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";
export type BodyGoal = "Cut" | "Bulk" | "Fat Loss" | "Body Recomposition";

export interface VideoFilterParams {
  difficultyLevel?: string;
  bodyGoal?: string;
  search?: string;
}

export interface VideoWithCoach extends WorkoutVideo {
  coachName: string;
  coachCode: string | null;
  coachAvatarHue: number;
}

/** Helper to extract YouTube video ID and produce fallback thumbnail */
function extractYoutubeThumbnail(url: string): string | null {
  try {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  } catch {
    // Ignore invalid regex match
  }
  return null;
}

/**
 * Step 2: Server Action to handle video uploads for coaches.
 * RBAC: Only users with the COACH (trainer) or ADMIN role can upload videos.
 */
export async function uploadWorkoutVideo(input: {
  title: string;
  videoUrl: string;
  difficultyLevel: DifficultyLevel;
  bodyGoal: BodyGoal;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
}) {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  // RBAC check: Only users with the COACH (trainer) or ADMIN role can upload videos.
  if (user.role !== "trainer" && user.role !== "admin") {
    return {
      ok: false,
      error: "Access Denied: Only coaches and administrators can upload workout videos.",
    };
  }

  const title = input.title?.trim();
  const videoUrl = input.videoUrl?.trim();
  const difficultyLevel = input.difficultyLevel;
  const bodyGoal = input.bodyGoal;

  if (!title) {
    return { ok: false, error: "Video title is required." };
  }

  if (!videoUrl) {
    return { ok: false, error: "Video URL or source link is required." };
  }

  const validDifficulties: DifficultyLevel[] = ["Beginner", "Intermediate", "Advanced"];
  if (!validDifficulties.includes(difficultyLevel)) {
    return { ok: false, error: "Please select a valid difficulty level." };
  }

  const validGoals: BodyGoal[] = ["Cut", "Bulk", "Fat Loss", "Body Recomposition"];
  if (!validGoals.includes(bodyGoal)) {
    return { ok: false, error: "Please select a valid body goal." };
  }

  // Determine thumbnail
  let thumbnail = input.thumbnailUrl?.trim() || null;
  if (!thumbnail) {
    thumbnail = extractYoutubeThumbnail(videoUrl) || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80";
  }

  const [inserted] = await db
    .insert(workoutVideos)
    .values({
      coachId: user.id,
      title,
      videoUrl,
      difficultyLevel,
      bodyGoal,
      description: input.description?.trim() || null,
      thumbnailUrl: thumbnail,
      duration: input.duration?.trim() || "10:00",
    })
    .returning({ id: workoutVideos.id });

  revalidatePath("/trainer/videos");
  revalidatePath("/trainer");
  revalidatePath("/member/workouts");
  revalidatePath("/member/workouts/pt-lite");

  return { ok: true, videoId: inserted?.id };
}

/**
 * Step 2: Server Action to fetch videos for members with filters.
 * RBAC: Only users with subscription_tier set to PT_LITE or PT can fetch and view the videos.
 * (Trainers and Admins can also view all videos).
 */
export async function getWorkoutVideos(filters?: VideoFilterParams): Promise<{
  ok: boolean;
  locked?: boolean;
  currentTier?: string;
  error?: string;
  videos?: VideoWithCoach[];
}> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  // RBAC check:
  // If user is a member, they MUST have subscription_tier set to 'PT_LITE' or 'PT'
  if (user.role === "member") {
    const tier = user.subscriptionTier || "STANDARD";
    if (tier !== "PT_LITE" && tier !== "PT") {
      return {
        ok: false,
        locked: true,
        currentTier: tier,
        error:
          "Access Denied: PT Lite or standard PT subscription tier required to access coach workout tutorials.",
      };
    }
  }

  // Build conditions
  const conditions = [];

  if (filters?.difficultyLevel && filters.difficultyLevel !== "ALL") {
    conditions.push(
      eq(workoutVideos.difficultyLevel, filters.difficultyLevel as DifficultyLevel)
    );
  }

  if (filters?.bodyGoal && filters.bodyGoal !== "ALL") {
    conditions.push(eq(workoutVideos.bodyGoal, filters.bodyGoal as BodyGoal));
  }

  if (filters?.search && filters.search.trim()) {
    conditions.push(ilike(workoutVideos.title, `%${filters.search.trim()}%`));
  }

  const query = db
    .select({
      id: workoutVideos.id,
      coachId: workoutVideos.coachId,
      title: workoutVideos.title,
      videoUrl: workoutVideos.videoUrl,
      difficultyLevel: workoutVideos.difficultyLevel,
      bodyGoal: workoutVideos.bodyGoal,
      description: workoutVideos.description,
      thumbnailUrl: workoutVideos.thumbnailUrl,
      duration: workoutVideos.duration,
      createdAt: workoutVideos.createdAt,
      coachName: users.name,
      coachCode: users.code,
      coachAvatarHue: users.avatarHue,
    })
    .from(workoutVideos)
    .innerJoin(users, eq(workoutVideos.coachId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(workoutVideos.createdAt));

  const rows = await query;

  return {
    ok: true,
    videos: rows as VideoWithCoach[],
  };
}

/**
 * Delete workout video (Coach who uploaded or Admin only)
 */
export async function deleteWorkoutVideo(videoId: string) {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  if (user.role !== "trainer" && user.role !== "admin") {
    return { ok: false, error: "Only coaches and admins can delete videos." };
  }

  const existing = await db
    .select()
    .from(workoutVideos)
    .where(eq(workoutVideos.id, videoId))
    .limit(1);

  if (!existing.length) {
    return { ok: false, error: "Video not found." };
  }

  // If coach, make sure they own the video
  if (user.role === "trainer" && existing[0].coachId !== user.id) {
    return { ok: false, error: "You can only delete videos you uploaded." };
  }

  await db.delete(workoutVideos).where(eq(workoutVideos.id, videoId));

  revalidatePath("/trainer/videos");
  revalidatePath("/trainer");
  revalidatePath("/member/workouts");
  revalidatePath("/member/workouts/pt-lite");

  return { ok: true };
}

/**
 * Member upgrade action: upgrades member's subscription_tier to 'PT_LITE' (or 'PT')
 */
export async function upgradeSubscriptionTierAction(tier: "PT_LITE" | "PT") {
  const user = await getSessionUser();
  if (!user || user.role !== "member") {
    return { ok: false, error: "Only members can upgrade subscription tier." };
  }

  await db
    .update(users)
    .set({ subscriptionTier: tier })
    .where(eq(users.id, user.id));

  revalidatePath("/member");
  revalidatePath("/member/workouts");
  revalidatePath("/member/workouts/pt-lite");

  return { ok: true, tier };
}
