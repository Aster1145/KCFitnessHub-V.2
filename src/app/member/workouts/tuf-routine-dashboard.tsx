"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Play,
  Sparkles,
  Bot,
  Calendar,
  Clock,
  Dumbbell,
  Flame,
  ArrowRight,
  RotateCcw,
  Handshake,
  PencilRuler,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";
import type { PlanExercise, WorkoutDay, WorkoutPlan } from "@/db/schema";
import {
  toggleExerciseCompletionAction,
  batchCompleteExercisesAction,
} from "@/actions/member";
import TufWizardModal from "./tuf-wizard-modal";

export interface TufDashboardProps {
  user: {
    id: number;
    name: string;
    level?: string | null;
    goal?: string | null;
    createdAt: Date;
    subscriptionTier?: string | null;
  };
  plan?: WorkoutPlan | null;
  days?: (WorkoutDay & { exercises: PlanExercise[] })[];
  initialCompletedIds?: number[];
  allCompletions?: { id: number; exerciseId: number; date: string }[];
  coachName?: string | null;
}

export default function TufRoutineDashboard({
  user,
  plan,
  days = [],
  initialCompletedIds = [],
  allCompletions = [],
  coachName,
}: TufDashboardProps) {
  const router = useRouter();

  // Tab: Active vs Completed
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  // Selected Day Index (0 = Day 1, etc.)
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Selected Date string (defaults to today's local date YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Completed exercise IDs for current selected date
  const [completedIds, setCompletedIds] = useState<Set<number>>(
    new Set(initialCompletedIds)
  );

  // AI Wizard Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);

  const [pending, startTransition] = useTransition();

  if (!plan || days.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-line bg-[#101116] p-10 text-center shadow-2xl">
          <span className="grid size-16 place-items-center rounded-2xl bg-volt/10 text-volt shadow mb-4">
            <Sparkles size={32} />
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            Welcome to Planly AI Routine Architect
          </h2>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            You don&apos;t have an active workout routine yet. Use our multi-step AI planner to generate a personalized workout split with an interactive checklist!
          </p>

          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-volt px-6 py-3 text-xs font-bold uppercase tracking-wider text-carbon hover:bg-volt-dim transition-all shadow-lg active:scale-98"
          >
            <Sparkles size={16} />
            Launch AI Routine Wizard
          </button>
        </div>

        <TufWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          defaultGoal={user.goal || "bulk"}
          defaultLevel={user.level || "intermediate"}
          userName={user.name}
        />
      </div>
    );
  }

  const activeDay = days[activeDayIndex] || days[0];
  const dayExercises = activeDay?.exercises || [];

  // Toggle single exercise
  const handleToggle = (exerciseId: number) => {
    // Optimistic UI update
    setCompletedIds((prev) => {
      const next = new Set(prev);
      const isNowCompleted = !next.has(exerciseId);
      if (isNowCompleted) {
        next.add(exerciseId);
      } else {
        next.delete(exerciseId);
      }

      // Check if all exercises in this day are now completed
      const allDone = dayExercises.every((e) =>
        e.id === exerciseId ? isNowCompleted : next.has(e.id)
      );
      if (allDone && isNowCompleted) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }

      return next;
    });

    startTransition(async () => {
      await toggleExerciseCompletionAction(exerciseId, selectedDate);
      router.refresh();
    });
  };

  // Mark all exercises for the active day complete
  const handleMarkAllComplete = () => {
    const ids = dayExercises.map((e) => e.id);
    setCompletedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 5000);

    startTransition(async () => {
      await batchCompleteExercisesAction(ids, selectedDate);
      router.refresh();
    });
  };

  // Reset active day completions
  const handleResetDay = () => {
    const ids = dayExercises.map((e) => e.id);
    setCompletedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

    startTransition(async () => {
      for (const id of ids) {
        await toggleExerciseCompletionAction(id, selectedDate);
      }
      router.refresh();
    });
  };

  // Metrics for active day
  const completedInActiveDay = dayExercises.filter((e) =>
    completedIds.has(e.id)
  ).length;
  const totalInActiveDay = dayExercises.length;
  const dayProgressPct =
    totalInActiveDay > 0
      ? Math.round((completedInActiveDay / totalInActiveDay) * 100)
      : 0;

  // Metrics across the whole plan
  const totalExercisesInPlan = days.reduce(
    (acc, d) => acc + d.exercises.length,
    0
  );
  // Distinct exercises completed historically
  const distinctCompletedIds = new Set(allCompletions.map((c) => c.exerciseId));
  const planCompletedCount = distinctCompletedIds.size;
  const overallProgressPct =
    totalExercisesInPlan > 0
      ? Math.min(
          100,
          Math.round((planCompletedCount / totalExercisesInPlan) * 100)
        )
      : 0;

  // Time calculations
  const estMinutesSpentToday = completedInActiveDay * 12; // ~12m per completed exercise
  const estTotalProgramHours = (totalExercisesInPlan * 0.2 * 4).toFixed(1);

  // Date formatting
  const planStartDate = plan.createdAt
    ? new Date(plan.createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  // Estimated completion date: 6 weeks from start
  const estCompletionDate = new Date(
    (plan.createdAt ? new Date(plan.createdAt).getTime() : Date.now()) +
      42 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Celebration Banner Toast */}
      {showCelebration && (
        <div className="flex items-center justify-between rounded-2xl border border-volt/50 bg-volt/15 p-4 text-zinc-100 shadow-xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-volt text-carbon font-bold text-lg shadow">
              🔥
            </span>
            <div>
              <h4 className="text-sm font-bold text-volt uppercase tracking-wider">
                Workout Session Complete!
              </h4>
              <p className="text-xs text-zinc-300">
                All exercises for {activeDay.label} checked off. Gym attendance automatically recorded for today!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCelebration(false)}
            className="rounded-lg bg-smoke/60 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TUF Top Navigation & Action Bar (Matching Screenshot 1) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Active / Completed Tabs */}
        <div className="inline-flex rounded-xl border border-line bg-[#13141a] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "active"
                ? "bg-smoke/90 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "completed"
                ? "bg-smoke/90 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Top Right Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-volt/40 bg-volt/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-volt transition-all hover:bg-volt hover:text-carbon shadow-sm"
          >
            <Sparkles size={14} />
            AI Planly Wizard
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("today-checklist");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-carbon transition-all hover:bg-sky-400 shadow-md active:scale-98"
          >
            Resume My Routine
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Member Routine Header Info (Matching Screenshot 1) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
            {user.name}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Started on: <span className="text-zinc-300">{planStartDate}</span> · Currently on:{" "}
            <span className="font-semibold text-volt">Sprint 1 (Phase 1)</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-smoke/50 px-3 py-1 text-xs text-zinc-300">
            {plan.source === "ai" ? (
              <>
                <Bot size={13} className="text-volt" />
                AI Generated Program
              </>
            ) : plan.source === "coach" ? (
              <>
                <Handshake size={13} className="text-sky-400" />
                Coach Program {coachName ? `· ${coachName}` : ""}
              </>
            ) : (
              <>
                <PencilRuler size={13} className="text-amber-400" />
                Custom Program
              </>
            )}
          </span>
        </div>
      </div>

      {/* TUF 2-Column Grid Layout (Matching Screenshot 1) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CARD 1: OVERALL PROGRESS (Circular Ring) */}
        <div className="rounded-3xl border border-line bg-[#101116] p-6 shadow-xl relative overflow-hidden">
          <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4 flex items-center gap-2">
            <TrendingUp size={13} className="text-sky-400" />
            Overall Progress
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* SVG Circular Progress Ring */}
            <div className="relative grid place-items-center size-36 shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="stroke-[#1d1f27]"
                  strokeWidth="9"
                  fill="transparent"
                />
                {/* Foreground Animated Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="stroke-sky-400 transition-all duration-700 ease-out"
                  strokeWidth="9"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={
                    2 * Math.PI * 48 * (1 - overallProgressPct / 100)
                  }
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono text-zinc-100">
                  {overallProgressPct}%
                </span>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  completed
                </span>
              </div>
            </div>

            {/* Metrics Beside Ring */}
            <div className="space-y-3 w-full border-t sm:border-t-0 sm:border-l border-line/60 pt-3 sm:pt-0 sm:pl-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Sprints</span>
                <span className="font-mono font-semibold text-zinc-200">
                  Sprint 1 / 4
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Exercises Checked</span>
                <span className="font-mono font-semibold text-zinc-200">
                  {planCompletedCount} / {totalExercisesInPlan}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Time Spent in Gym</span>
                <span className="font-mono font-semibold text-zinc-200">
                  {Math.round(distinctCompletedIds.size * 0.2)}h / {estTotalProgramHours}h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: SPRINT PROGRESS (Horizontal Day Stepper) */}
        <div className="rounded-3xl border border-line bg-[#101116] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-2">
                <TrendingUp size={13} className="text-volt" />
                Sprint Progress
              </p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-smoke text-zinc-500 hover:text-zinc-200"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="font-semibold text-zinc-300">Sprint 1</span>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-smoke text-zinc-500 hover:text-zinc-200"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-5">
              Focus: <span className="text-zinc-200 font-medium">{activeDay?.focus || "Daily Routine"}</span>
            </p>

            {/* Stepper Circles Row (Matching Screenshot 1) */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 px-1">
              {days.map((day, idx) => {
                // Check if all exercises in this day are completed
                const allDayExercisesDone =
                  day.exercises.length > 0 &&
                  day.exercises.every((e) => completedIds.has(e.id));
                const isSelected = activeDayIndex === idx;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayIndex(idx)}
                    className="flex flex-col items-center gap-1.5 group focus:outline-none transition-transform"
                  >
                    <div
                      className={`grid size-9 place-items-center rounded-full text-xs font-bold transition-all ${
                        allDayExercisesDone
                          ? "bg-sky-500 text-carbon shadow-md"
                          : isSelected
                          ? "border-2 border-volt bg-volt/15 text-volt ring-2 ring-volt/20"
                          : "border border-line bg-smoke/50 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-smoke"
                      }`}
                    >
                      {allDayExercisesDone ? (
                        <Check size={16} strokeWidth={3} />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-medium transition-colors ${
                        isSelected
                          ? "text-zinc-100 font-bold border-b-2 border-volt pb-0.5"
                          : "text-zinc-500 group-hover:text-zinc-400"
                      }`}
                    >
                      {day.label.replace("Day ", "Day ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-volt" />
              Active: {activeDay?.label} ({dayExercises.length} movements)
            </span>
            <span className="text-zinc-500 text-[11px]">Click any day circle to switch checklist</span>
          </div>
        </div>

        {/* CARD 3: TODAY'S TASK (The Interactive Checklist!) */}
        <div
          id="today-checklist"
          className="rounded-3xl border border-line bg-[#101116] p-6 shadow-xl lg:col-span-1 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line/70">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-smoke text-volt text-xs font-bold">
                  @
                </span>
                <h3 className="text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase">
                  Today&apos;s Task
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-zinc-400">
                  {completedInActiveDay} / {totalInActiveDay} completed
                </span>
                <button
                  type="button"
                  onClick={handleMarkAllComplete}
                  className="rounded-lg border border-line/80 bg-smoke/40 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:bg-smoke hover:text-zinc-100 transition-colors"
                >
                  Check All
                </button>
                {completedInActiveDay > 0 && (
                  <button
                    type="button"
                    onClick={handleResetDay}
                    className="rounded-lg border border-line/80 bg-smoke/40 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Checklist Items (Matching Screenshot 1) */}
            <div className="space-y-2.5">
              {dayExercises.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  No exercises planned for this day.
                </div>
              ) : (
                dayExercises.map((ex) => {
                  const isChecked = completedIds.has(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => handleToggle(ex.id)}
                      className={`group flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? "border-line/40 bg-carbon/60 opacity-70"
                          : "border-line/80 bg-smoke/30 hover:border-volt/40 hover:bg-smoke/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Circular Checkbox Button */}
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 focus:outline-none"
                          aria-label={`Mark ${ex.name} as complete`}
                        >
                          {isChecked ? (
                            <span className="grid size-5 place-items-center rounded-full bg-volt text-carbon shadow-sm transition-transform active:scale-90">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          ) : (
                            <span className="grid size-5 place-items-center rounded-full border border-zinc-500 bg-transparent group-hover:border-volt transition-colors" />
                          )}
                        </button>

                        <div>
                          <p
                            className={`text-sm font-semibold transition-all ${
                              isChecked
                                ? "line-through text-zinc-500"
                                : "text-zinc-100 group-hover:text-volt"
                            }`}
                          >
                            {ex.name}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                            <span className="font-mono rounded bg-smoke/80 px-1.5 py-0.5 text-zinc-300">
                              {ex.sets} sets × {ex.reps} reps
                            </span>
                            {ex.rest && (
                              <span className="rounded bg-smoke/50 px-1.5 py-0.5 text-zinc-400">
                                ⏱️ {ex.rest} rest
                              </span>
                            )}
                          </div>

                          {ex.notes && (
                            <p className="mt-1 text-[11px] text-zinc-500 italic">
                              Cue: {ex.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Estimated Duration */}
                      <span className="shrink-0 text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400">
                        Est. 12m
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-zinc-500">
            <span>Tap any movement to check off</span>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="text-volt hover:underline"
            >
              Add or customize exercises
            </button>
          </div>
        </div>

        {/* CARD 4: TODAY'S PROGRESS (Matching Screenshot 1) */}
        <div className="rounded-3xl border border-line bg-[#101116] p-6 shadow-xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4 flex items-center gap-2">
              <TrendingUp size={13} className="text-volt" />
              Today&apos;s Progress
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs py-1 border-b border-line/50">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Dumbbell size={14} className="text-sky-400" />
                  Exercises
                </span>
                <span className="font-mono font-semibold text-zinc-200">
                  {completedInActiveDay} / {totalInActiveDay}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-b border-line/50">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Clock size={14} className="text-amber-400" />
                  Time spent
                </span>
                <span className="font-mono font-semibold text-zinc-200">
                  {estMinutesSpentToday} min
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-b border-line/50">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Calendar size={14} className="text-purple-400" />
                  Session Status
                </span>
                <span
                  className={`font-semibold ${
                    dayProgressPct === 100 ? "text-volt" : "text-zinc-300"
                  }`}
                >
                  {dayProgressPct === 100
                    ? "Completed 🔥"
                    : dayProgressPct > 0
                    ? "In Progress"
                    : "Not Started"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-zinc-400">Day Completion</span>
                  <span className="font-mono font-bold text-volt">
                    {dayProgressPct}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-smoke/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-volt transition-all duration-500"
                    style={{ width: `${dayProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-line/60">
            <button
              type="button"
              onClick={handleMarkAllComplete}
              disabled={dayProgressPct === 100 || pending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-volt py-3 text-xs font-bold uppercase tracking-wider text-carbon hover:bg-volt-dim transition-all shadow-md active:scale-98 disabled:opacity-50"
            >
              {pending ? (
                <RotateCcw size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {dayProgressPct === 100
                ? "Session Completed & Logged!"
                : "Finish Today's Session & Log Attendance"}
            </button>
          </div>
        </div>
      </div>

      {/* TUF Bottom Banner (Matching Screenshot 1) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-[#101116] p-4 text-xs">
        <div className="flex items-center gap-2.5 text-zinc-400">
          <Calendar size={15} className="text-volt" />
          <span>
            Est. completion on:{" "}
            <span className="font-semibold text-zinc-200">{estCompletionDate}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("today-checklist");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold uppercase tracking-wider text-carbon hover:bg-sky-400 transition-all shadow-sm"
        >
          Continue where you left off
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Multi-Step AI Wizard Modal */}
      <TufWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        defaultGoal={user.goal || "bulk"}
        defaultLevel={user.level || "intermediate"}
        userName={user.name}
      />
    </div>
  );
}
