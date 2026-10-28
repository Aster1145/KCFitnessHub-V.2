import { eq } from "drizzle-orm";
import { db } from "@/db";
import { planExercises, workoutDays, workoutPlans } from "@/db/schema";

export interface PlanExerciseInput {
  name: string;
  sets?: string;
  reps?: string;
  rest?: string;
  notes?: string;
}

export interface PlanDayInput {
  label: string;
  focus?: string;
  exercises: PlanExerciseInput[];
}

export interface PlanInput {
  title: string;
  summary?: string;
  goal?: string;
  level?: string;
  days: PlanDayInput[];
}

export function normalizePlan(input: PlanInput): PlanInput {
  return {
    title: input.title?.trim() || "My Program",
    summary: input.summary ?? "",
    goal: input.goal ?? "recomp",
    level: input.level ?? "intermediate",
    days: input.days
      .map((d, i) => ({
        label: d.label?.trim() || `Day ${i + 1}`,
        focus: d.focus ?? "",
        exercises: d.exercises
          .filter((e) => e.name?.trim())
          .map((e, j) => ({
            name: e.name.trim(),
            sets: e.sets || "3",
            reps: e.reps || "10-12",
            rest: e.rest || "60s",
            notes: e.notes ?? "",
            orderIndex: j,
          })),
      }))
      .filter((d) => d.exercises.length > 0),
  };
}

/** Deactivates previous plans and inserts the new active plan. */
export async function insertPlan(
  userId: number,
  source: "custom" | "ai" | "coach",
  input: PlanInput,
  createdBy?: number
) {
  const clean = normalizePlan(input);
  if (!clean.days.length) throw new Error("Plan needs at least one exercise");

  await db
    .update(workoutPlans)
    .set({ isActive: false })
    .where(eq(workoutPlans.userId, userId));

  const [plan] = await db
    .insert(workoutPlans)
    .values({
      userId,
      title: clean.title,
      summary: clean.summary,
      goal: clean.goal,
      level: clean.level,
      source,
      isActive: true,
      createdBy: createdBy ?? null,
    })
    .returning();

  for (let i = 0; i < clean.days.length; i++) {
    const day = clean.days[i];
    const [dayRow] = await db
      .insert(workoutDays)
      .values({ planId: plan.id, dayIndex: i, label: day.label, focus: day.focus })
      .returning();
    if (day.exercises.length) {
      await db.insert(planExercises).values(
        day.exercises.map((e, j) => ({
          dayId: dayRow.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          notes: e.notes,
          orderIndex: j,
        }))
      );
    }
  }
  return plan;
}

// ---------------------------------------------------------------
// Deterministic fallback plan builder (used when Gemini is absent)
// ---------------------------------------------------------------
export interface AiRequest {
  goal: string;
  level: string;
  daysPerWeek: number;
  equipment: string;
  notes?: string;
  adjustmentPrompt?: string;
  currentPlan?: PlanInput;
}

const SPLITS: Record<number, { label: string; focus: string }[]> = {
  3: [
    { label: "Day 1", focus: "Full Body A" },
    { label: "Day 2", focus: "Full Body B" },
    { label: "Day 3", focus: "Full Body C" },
  ],
  4: [
    { label: "Day 1", focus: "Upper Body A" },
    { label: "Day 2", focus: "Lower Body A" },
    { label: "Day 3", focus: "Upper Body B" },
    { label: "Day 4", focus: "Lower Body B" },
  ],
  5: [
    { label: "Day 1", focus: "Push" },
    { label: "Day 2", focus: "Pull" },
    { label: "Day 3", focus: "Legs" },
    { label: "Day 4", focus: "Upper Body" },
    { label: "Day 5", focus: "Arms + Core" },
  ],
  6: [
    { label: "Day 1", focus: "Push A" },
    { label: "Day 2", focus: "Pull A" },
    { label: "Day 3", focus: "Legs A" },
    { label: "Day 4", focus: "Push B" },
    { label: "Day 5", focus: "Pull B" },
    { label: "Day 6", focus: "Legs B" },
  ],
};

const LIB: Record<string, Record<string, string[]>> = {
  Push: {
    compound: ["Barbell Bench Press", "Overhead Press", "Incline DB Press"],
    accessory: ["Lateral Raise", "Rope Pushdown", "Overhead Extension", "Chest Fly"],
  },
  Pull: {
    compound: ["Deadlift", "Barbell Row", "Pull-Up", "Lat Pulldown"],
    accessory: ["Face Pull", "Barbell Curl", "Hammer Curl", "Rear Delt Fly"],
  },
  Legs: {
    compound: ["Back Squat", "Romanian Deadlift", "Leg Press"],
    accessory: ["Walking Lunge", "Leg Curl", "Standing Calf Raise", "Hip Thrust"],
  },
  "Upper Body": {
    compound: ["Bench Press", "Barbell Row", "Overhead Press"],
    accessory: ["Lat Pulldown", "Lateral Raise", "Bicep Curl"],
  },
  "Full Body": {
    compound: ["Back Squat", "Bench Press", "Deadlift", "Overhead Press"],
    accessory: ["Pull-Up", "Lunge", "Plank"],
  },
  "Arms + Core": {
    compound: ["Close-Grip Bench", "Barbell Curl"],
    accessory: ["Rope Pushdown", "Hammer Curl", "Hanging Leg Raise", "Cable Crunch"],
  },
};

function bucketFor(focus: string): string {
  if (focus.includes("Push")) return "Push";
  if (focus.includes("Pull")) return "Pull";
  if (focus.includes("Legs")) return "Legs";
  if (focus.includes("Upper")) return "Upper Body";
  if (focus.includes("Full Body")) return "Full Body";
  if (focus.includes("Arms")) return "Arms + Core";
  return "Full Body";
}

export function buildFallbackPlan(req: AiRequest): PlanInput {
  const days = SPLITS[req.daysPerWeek] ?? SPLITS[4];
  const heavy = req.goal === "strength" || req.goal === "bulk";
  const cut = req.goal === "cut";
  const repScheme = req.level === "beginner" ? "10-12" : heavy ? "5-8" : "8-12";
  const rest = heavy ? "2-3 min" : cut ? "45-60s" : "60-90s";

  const planDays = days.map((d, i) => {
    const lib = LIB[bucketFor(d.focus)];
    const compound = lib.compound[i % lib.compound.length];
    const compound2 = lib.compound[(i + 1) % lib.compound.length];
    const accessories = lib.accessory;
    const exercises: PlanExerciseInput[] = [
      { name: compound, sets: "4", reps: repScheme, rest, notes: "Primary lift — progressive overload" },
      { name: compound2, sets: "3", reps: heavy ? "6-10" : "8-12", rest, notes: "" },
      { name: accessories[i % accessories.length], sets: "3", reps: cut ? "12-15" : "10-12", rest: "60s", notes: "" },
      { name: accessories[(i + 1) % accessories.length], sets: "3", reps: "12-15", rest: "45-60s", notes: "Controlled tempo" },
    ];
    if (cut) exercises.push({ name: "Zone-2 Cardio Finisher", sets: "1", reps: "15 min", rest: "—", notes: "Incline walk or bike" });
    if (req.goal === "bulk" && d.focus.includes("Legs"))
      exercises.push({ name: "Leg Curl", sets: "3", reps: "10-12", rest: "60s", notes: "" });
    return { label: d.label, focus: d.focus, exercises };
  });

  return {
    title: `${req.level[0].toUpperCase() + req.level.slice(1)} ${
      req.goal === "bulk" ? "Hypertrophy" : req.goal === "cut" ? "Shred" : req.goal === "strength" ? "Strength" : "Recomposition"
    } — ${req.daysPerWeek}-Day Split`,
    summary: `A ${req.daysPerWeek}-day ${req.goal} program tuned for ${req.level} lifters with ${req.equipment} equipment.${
      req.notes ? ` Note: ${req.notes}` : ""
    }`,
    goal: req.goal,
    level: req.level,
    days: planDays,
  };
}
