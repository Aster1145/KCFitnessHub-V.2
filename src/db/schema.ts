import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "member", "trainer"] })
    .notNull()
    .default("member"),
  specialty: text("specialty"), // trainers
  goal: text("goal"), // members: bulk | cut | recomp | strength
  level: text("level"), // members: beginner | intermediate | advanced | extreme
  avatarHue: integer("avatar_hue").notNull().default(80),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["normal", "pt"] }).notNull(),
  durationDays: integer("duration_days").notNull(), // promised ATTENDED sessions
  startDate: date("start_date", { mode: "string" }).notNull(),
  pricePaid: integer("price_paid").notNull().default(0), // INR
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("attendance_user_date").on(t.userId, t.date)]
);

export const coachAssignments = pgTable(
  "coach_assignments",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trainerId: integer("trainer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("coach_assignments_member").on(t.memberId)]
);

export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary"),
  source: text("source", { enum: ["custom", "ai", "coach"] })
    .notNull()
    .default("custom"),
  goal: text("goal"),
  level: text("level"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by"), // trainer id when source = coach
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workoutDays = pgTable("workout_days", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id")
    .notNull()
    .references(() => workoutPlans.id, { onDelete: "cascade" }),
  dayIndex: integer("day_index").notNull(),
  label: text("label").notNull(), // "Day 1"
  focus: text("focus"), // "Push / Chest + Triceps"
});

export const planExercises = pgTable("plan_exercises", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id")
    .notNull()
    .references(() => workoutDays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sets: text("sets"),
  reps: text("reps"),
  rest: text("rest"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const dietLogs = pgTable("diet_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  meal: text("meal").notNull().default("Meal"),
  food: text("food").notNull(),
  calories: integer("calories").notNull().default(0),
  protein: integer("protein").notNull().default(0),
  carbs: integer("carbs").notNull().default(0),
  fat: integer("fat").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dietAssignments = pgTable("diet_assignments", {
  id: serial("id").primaryKey(),
  trainerId: integer("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memberId: integer("member_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  meal: text("meal").notNull().default("Meal"),
  food: text("food").notNull(),
  calories: integer("calories").notNull().default(0),
  protein: integer("protein").notNull().default(0),
  carbs: integer("carbs").notNull().default(0),
  fat: integer("fat").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // INR
  plan: text("plan").notNull().default("normal"),
  method: text("method").notNull().default("UPI"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  toId: integer("to_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type WorkoutDay = typeof workoutDays.$inferSelect;
export type PlanExercise = typeof planExercises.$inferSelect;
export type DietLog = typeof dietLogs.$inferSelect;
export type DietAssignment = typeof dietAssignments.$inferSelect;
export type Message = typeof messages.$inferSelect;
