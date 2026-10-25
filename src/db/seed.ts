import "dotenv/config";
import crypto from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  attendance,
  coachAssignments,
  dietAssignments,
  dietLogs,
  memberships,
  messages,
  payments,
  planExercises,
  users,
  workoutDays,
  workoutPlans,
} from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const isSupabase =
  connectionString.includes("supabase.co") ||
  connectionString.includes("pooler.supabase.com") ||
  connectionString.includes("sslmode=require");

const pool = new Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});
const db = drizzle(pool);

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// deterministic RNG
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysAgoTs(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(rand() * 50), 0, 0);
  return d;
}

async function main() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) {
    console.log("Database already seeded — skipping.");
    return;
  }

  // ---------- Users ----------
  const [admin] = await db
    .insert(users)
    .values({
      name: "Vikram Rao",
      email: "admin@forge.com",
      passwordHash: hashPassword("admin123"),
      role: "admin",
      avatarHue: 55,
    })
    .returning();

  const trainerSeeds = [
    { name: "Rahul Verma", email: "coach@forge.com", specialty: "Strength & Hypertrophy · 9 yrs", hue: 22 },
    { name: "Sneha Kulkarni", email: "sneha@forge.com", specialty: "Recomposition & Mobility · 6 yrs", hue: 200 },
    { name: "Dev Patel", email: "dev@forge.com", specialty: "Fat Loss & Conditioning · 7 yrs", hue: 265 },
  ];
  const trainerRows = await db
    .insert(users)
    .values(
      trainerSeeds.map((t) => ({
        name: t.name,
        email: t.email,
        passwordHash: hashPassword("coach123"),
        role: "trainer" as const,
        specialty: t.specialty,
        avatarHue: t.hue,
      }))
    )
    .returning();
  const [rahul, sneha, dev] = trainerRows;

  const memberSeeds = [
    { name: "Arjun Nair", email: "member@forge.com", goal: "bulk", level: "intermediate", hue: 80, pt: true, days: 20, attendanceRate: 0.9 },
    { name: "Diya Rao", email: "diya@forge.com", goal: "cut", level: "beginner", hue: 320, pt: false, days: 24, attendanceRate: 0.75 },
    { name: "Kabir Singh", email: "kabir@forge.com", goal: "strength", level: "advanced", hue: 15, pt: true, days: 40, attendanceRate: 0.85 },
    { name: "Meera Iyer", email: "meera@forge.com", goal: "recomp", level: "beginner", hue: 160, pt: false, days: 12, attendanceRate: 0.9 },
    { name: "Rohan Das", email: "rohan@forge.com", goal: "bulk", level: "intermediate", hue: 210, pt: false, days: 55, attendanceRate: 0.55 },
    { name: "Ananya Menon", email: "ananya@forge.com", goal: "cut", level: "intermediate", hue: 300, pt: true, days: 30, attendanceRate: 0.8 },
    { name: "Vihaan Joshi", email: "vihaan@forge.com", goal: "strength", level: "extreme", hue: 100, pt: false, days: 70, attendanceRate: 0.95 },
    { name: "Ishita Bose", email: "ishita@forge.com", goal: "recomp", level: "beginner", hue: 45, pt: false, days: 8, attendanceRate: 0.85 },
    { name: "Aditya Kulkarni", email: "aditya@forge.com", goal: "bulk", level: "advanced", hue: 130, pt: true, days: 50, attendanceRate: 0.7 },
    { name: "Nikhil Rao", email: "nikhil@forge.com", goal: "cut", level: "beginner", hue: 0, pt: false, days: 35, attendanceRate: 0.5 },
  ];

  const memberRows = await db
    .insert(users)
    .values(
      memberSeeds.map((m) => ({
        name: m.name,
        email: m.email,
        passwordHash: hashPassword("member123"),
        role: "member" as const,
        goal: m.goal,
        level: m.level,
        avatarHue: m.hue,
        createdAt: daysAgoTs(m.days),
      }))
    )
    .returning();

  // ---------- Memberships + payments ----------
  const coachMap = new Map<number, number>(); // memberId -> trainerId
  for (let i = 0; i < memberRows.length; i++) {
    const u = memberRows[i];
    const meta = memberSeeds[i];
    const plan = meta.pt ? "pt" : "normal";
    const price = meta.pt ? 4999 : 1499;
    const duration = meta.pt ? 30 : meta.days > 45 ? 90 : 30;
    const startDate = daysAgoStr(meta.days);

    await db.insert(memberships).values({
      userId: u.id,
      plan,
      durationDays: duration,
      startDate,
      pricePaid: price,
      createdAt: daysAgoTs(meta.days, 9),
    });
    await db.insert(payments).values({
      userId: u.id,
      amount: price,
      plan,
      method: i % 3 === 0 ? "Card" : "UPI",
      createdAt: daysAgoTs(meta.days, 9),
    });

    if (meta.pt) coachMap.set(u.id, trainerRows[i % trainerRows.length].id);

    // attendance history
    const rows: { userId: number; date: string; createdAt: Date }[] = [];
    for (let d = meta.days; d >= 1; d--) {
      // members attend more often on weekdays
      const date = daysAgoStr(d);
      const weekday = new Date(date + "T00:00:00").getDay();
      const weekendPenalty = weekday === 0 ? 0.25 : 0;
      if (rand() < meta.attendanceRate - weekendPenalty) {
        rows.push({ userId: u.id, date, createdAt: daysAgoTs(d, 6 + Math.floor(rand() * 13)) });
      }
    }
    if (rows.length) await db.insert(attendance).values(rows);
  }

  // coach assignments
  await db.insert(coachAssignments).values(
    [...coachMap.entries()].map(([memberId, trainerId]) => ({ memberId, trainerId }))
  );

  // extra historical payments for the revenue curve (churned alumni)
  for (const u of memberRows) {
    for (const back of [75, 130, 170]) {
      if (rand() < 0.55) {
        const plan = rand() < 0.35 ? "pt" : "normal";
        await db.insert(payments).values({
          userId: u.id,
          amount: plan === "pt" ? 4999 : 1499,
          plan,
          method: "UPI",
          createdAt: daysAgoTs(back, 11 + Math.floor(rand() * 6)),
        });
      }
    }
  }

  // ---------- Demo member: full experience ----------
  const arjun = memberRows[0];

  // coach-authored workout plan for Arjun (from Rahul)
  const [plan] = await db
    .insert(workoutPlans)
    .values({
      userId: arjun.id,
      title: "Arjun — Lean Bulk Block 1",
      summary:
        "4-day Upper/Lower with a top-set bias. Add 2.5kg to compounds when all sets clear the top of the rep range.",
      source: "coach",
      goal: "bulk",
      level: "intermediate",
      createdBy: rahul.id,
    })
    .returning();

  const block: { focus: string; ex: [string, string, string, string, string][] }[] = [
    {
      focus: "Upper A — Chest/Back",
      ex: [
        ["Barbell Bench Press", "4", "5-7", "2-3 min", "Top set heavy, back-offs crisp"],
        ["Weighted Pull-Up", "3", "6-8", "2 min", "Add dumbbell between feet"],
        ["Incline DB Press", "3", "8-10", "90s", "Full stretch at bottom"],
        ["Chest-Supported Row", "3", "10-12", "90s", "Squeeze upper back"],
        ["Lateral Raise", "3", "12-15", "60s", "Lead with elbows"],
      ],
    },
    {
      focus: "Lower A — Squat bias",
      ex: [
        ["Back Squat", "4", "5-7", "2-3 min", "Brace hard, full depth"],
        ["Romanian Deadlift", "3", "8-10", "90s", "Hinge, soft knees"],
        ["Walking Lunge", "3", "10/leg", "75s", "Long stride"],
        ["Standing Calf Raise", "4", "12-15", "45s", "Pause top & bottom"],
        ["Hanging Leg Raise", "3", "10-12", "60s", "No swing"],
      ],
    },
    {
      focus: "Upper B — Shoulders/Arms",
      ex: [
        ["Overhead Press", "4", "6-8", "2 min", "Glutes tight"],
        ["Lat Pulldown", "3", "10-12", "90s", "Elbows to ribs"],
        ["Seated DB Shoulder Press", "3", "8-10", "90s", ""],
        ["Barbell Curl", "3", "8-10", "60s", "No body English"],
        ["Rope Pushdown", "3", "12-15", "60s", "Split the rope at bottom"],
      ],
    },
    {
      focus: "Lower B — Posterior chain",
      ex: [
        ["Deadlift", "3", "4-6", "3 min", "Push the floor away"],
        ["Leg Press", "3", "10-12", "90s", "Full foot pressure"],
        ["Leg Curl", "3", "10-12", "60s", ""],
        ["Hip Thrust", "3", "8-10", "90s", "Chin tucked"],
        ["Cable Crunch", "3", "12-15", "45s", "Round the spine"],
      ],
    },
  ];

  for (let i = 0; i < block.length; i++) {
    const [dayRow] = await db
      .insert(workoutDays)
      .values({ planId: plan.id, dayIndex: i, label: `Day ${i + 1}`, focus: block[i].focus })
      .returning();
    await db.insert(planExercises).values(
      block[i].ex.map(([name, sets, reps, rest, notes], j) => ({
        dayId: dayRow.id,
        name,
        sets,
        reps,
        rest,
        notes,
        orderIndex: j,
      }))
    );
  }

  // AI plan for Diya
  const [diyaPlan] = await db
    .insert(workoutPlans)
    .values({
      userId: memberRows[1].id,
      title: "Beginner Shred — 3-Day Full Body",
      summary: "Full-body basics with short rests and a conditioning finisher each session.",
      source: "ai",
      goal: "cut",
      level: "beginner",
    })
    .returning();
  const diyaDay = await db
    .insert(workoutDays)
    .values({ planId: diyaPlan.id, dayIndex: 0, label: "Day 1", focus: "Full Body" })
    .returning();
  await db.insert(planExercises).values(
    [
      ["Goblet Squat", "3", "10-12", "60s", "Heels down"],
      ["Lat Pulldown", "3", "10-12", "60s", ""],
      ["Incline Push-Up", "3", "AMRAP-1", "60s", "Stop one shy"],
      ["Plank", "3", "40s", "45s", ""],
    ].map(([name, sets, reps, rest, notes], j) => ({
      dayId: diyaDay[0].id,
      name,
      sets,
      reps,
      rest,
      notes,
      orderIndex: j,
    }))
  );

  // diet assignments for Arjun from Rahul
  await db.insert(dietAssignments).values(
    [
      { meal: "Breakfast", food: "6 whole eggs + 80g oats + banana", calories: 760, protein: 48, carbs: 82, fat: 28, notes: "Creatine 5g with this" },
      { meal: "Lunch", food: "180g chicken breast + 250g rice + salad", calories: 720, protein: 52, carbs: 88, fat: 12, notes: "" },
      { meal: "Pre-workout", food: "2 rice cakes + honey + whey half scoop", calories: 260, protein: 14, carbs: 45, fat: 2, notes: "45 min before" },
      { meal: "Post-workout", food: "Whey isolate 2 scoops + dates", calories: 320, protein: 54, carbs: 28, fat: 2, notes: "" },
      { meal: "Dinner", food: "200g paneer bhurji + 3 roti", calories: 640, protein: 42, carbs: 60, fat: 26, notes: "" },
      { meal: "Snack", food: "Greek yogurt + 30g peanuts", calories: 340, protein: 22, carbs: 14, fat: 20, notes: "Before bed" },
    ].map((a) => ({ ...a, trainerId: rahul.id, memberId: arjun.id }))
  );

  // Arjun's food logs for the last 4 days
  for (const [d, items] of (
    [
      [1, [["Breakfast", "Eggs + oats", 720, 46, 78, 26], ["Lunch", "Chicken + rice", 700, 50, 84, 12], ["Dinner", "Paneer + roti", 610, 40, 58, 24]]],
      [2, [["Breakfast", "Oats + whey", 560, 42, 70, 12], ["Lunch", "Chicken + rice", 730, 53, 90, 12]]],
      [3, [["Lunch", "Chicken salad bowl", 520, 48, 22, 26], ["Post-workout", "Whey + dates", 320, 54, 28, 2]]],
      [4, [["Breakfast", "Eggs + toast", 610, 40, 48, 28]]],
    ] as [number, [string, string, number, number, number, number][]][]
  )) {
    await db.insert(dietLogs).values(
      items.map(([meal, food, calories, protein, carbs, fat]) => ({
        userId: arjun.id,
        date: daysAgoStr(d - 1),
        meal,
        food,
        calories,
        protein,
        carbs,
        fat,
        createdAt: daysAgoTs(d - 1, 12),
      }))
    );
  }

  // message thread Arjun <-> Rahul
  const thread: [number, number, string, number][] = [
    [rahul.id, arjun.id, "Welcome aboard Arjun. Block 1 is live in your app — 4 days, squat Saturday.", 3],
    [arjun.id, rahul.id, "Legend. Bench felt heavy today, hit 5 reps at 80kg.", 3],
    [rahul.id, arjun.id, "Good. Repeat 80 next week, then 82.5. Log every session.", 2],
    [arjun.id, rahul.id, "Copy that. Diet's on track too — protein's hitting 190.", 1],
    [rahul.id, arjun.id, "Solid. Keep steps at 8k and sleep before 11. Deload in week 5.", 0],
  ];
  await db.insert(messages).values(
    thread.map(([fromId, toId, body, d]) => ({
      fromId,
      toId,
      body,
      createdAt: daysAgoTs(d, 18),
    }))
  );

  // admin inbox demo
  await db.insert(messages).values({
    fromId: memberRows[4].id,
    toId: admin.id,
    body: "UPGRADE_REQUEST :: Rohan Das wants Personal Training (rohan@forge.com)",
    createdAt: daysAgoTs(1, 14),
  });

  console.log("✅ FORGE seed complete.");
  console.log("   admin@forge.com / admin123");
  console.log("   coach@forge.com / coach123");
  console.log("   member@forge.com / member123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
