import { NextResponse } from "next/server";
import { getWorkoutVideos, uploadWorkoutVideo, type DifficultyLevel, type BodyGoal } from "@/actions/videos";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const difficultyLevel = searchParams.get("difficulty_level") || searchParams.get("difficultyLevel") || undefined;
    const bodyGoal = searchParams.get("body_goal") || searchParams.get("bodyGoal") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await getWorkoutVideos({
      difficultyLevel,
      bodyGoal,
      search,
    });

    if (!result.ok) {
      if (result.locked) {
        return NextResponse.json(
          {
            error: result.error,
            locked: true,
            currentTier: result.currentTier,
          },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ videos: result.videos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "trainer" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only coaches or admins can upload tutorial videos" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = await uploadWorkoutVideo({
      title: body.title,
      videoUrl: body.video_url || body.videoUrl,
      difficultyLevel: (body.difficulty_level || body.difficultyLevel) as DifficultyLevel,
      bodyGoal: (body.body_goal || body.bodyGoal) as BodyGoal,
      description: body.description,
      thumbnailUrl: body.thumbnail_url || body.thumbnailUrl,
      duration: body.duration,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, videoId: result.videoId }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
