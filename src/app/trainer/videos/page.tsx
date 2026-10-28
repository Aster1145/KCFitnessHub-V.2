import { requireRole } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import { db } from "@/db";
import { workoutVideos, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import CoachVideoStudio from "./coach-video-studio";
import { type VideoWithCoach } from "@/actions/videos";

export const dynamic = "force-dynamic";

export default async function TrainerVideosPage() {
  const coach = await requireRole("trainer");

  const rows = await db
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
    .orderBy(desc(workoutVideos.createdAt));

  return (
    <div>
      <PageHead
        eyebrow="Trainer Academy"
        title="PT Video Studio"
        sub="Record, upload and organize tutorial videos for PT Lite & PT subscribers. Categorize each video by technical difficulty and physique goal."
      />
      <CoachVideoStudio
        initialVideos={rows as VideoWithCoach[]}
        coachId={coach.id}
      />
    </div>
  );
}
