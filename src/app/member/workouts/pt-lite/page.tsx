import { requireRole } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import { db } from "@/db";
import { workoutVideos, users, messages } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import PtLiteHub from "./pt-lite-hub";
import { type VideoWithCoach } from "@/actions/videos";

export const dynamic = "force-dynamic";

export default async function PtLitePage() {
  const user = await requireRole("member");

  // Fetch all videos joined with coach info
  const [rows, pendingRequests] = await Promise.all([
    db
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
      .orderBy(desc(workoutVideos.createdAt)),
    db
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.fromId, user.id),
          ilike(messages.body, "PT_LITE_UPGRADE_REQUEST%")
        )
      )
      .limit(1),
  ]);

  const isPendingApproval = pendingRequests.length > 0;

  return (
    <div>
      <PageHead
        eyebrow="Tutorial Vault"
        title="PT Lite Video Coaching"
        sub="Master exercise execution, injury prevention, and program cues recorded by KC certified personal trainers."
      />
      <PtLiteHub
        subscriptionTier={user.subscriptionTier || "STANDARD"}
        memberName={user.name}
        memberGoal={user.goal}
        memberLevel={user.level}
        isPendingApproval={isPendingApproval}
        videos={rows as VideoWithCoach[]}
      />
    </div>
  );
}
