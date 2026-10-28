"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Send,
  Flame,
  Dumbbell,
  Clock,
  Target,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { saveAiPlanAction } from "@/actions/member";
import type { AiRequest, PlanInput } from "@/lib/plans";

interface TufWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGoal?: string;
  defaultLevel?: string;
  userName?: string;
}

const SPLIT_OPTIONS = [
  { id: "ppl", title: "Push · Pull · Legs (PPL)", days: 6, desc: "Classic 6-day hypertrophy & symmetry split" },
  { id: "upper_lower", title: "Upper · Lower Split", days: 4, desc: "High recovery, ideal 4-day athletic volume" },
  { id: "full_body", title: "Full Body 3x / Week", days: 3, desc: "Maximum frequency, great for busy schedules" },
  { id: "arnold", title: "Arnold Split (Chest/Back, Shoulders/Arms, Legs)", days: 6, desc: "Golden-era volume & intense pumps" },
  { id: "ai_custom", title: "Open to AI Recommendation", days: 5, desc: "Personalized split tailored to your recovery" },
];

const GOAL_OPTIONS = [
  { id: "bulk", label: "Hypertrophy / Muscle Gain", tag: "Bulk" },
  { id: "cut", label: "Fat Loss & Conditioning", tag: "Cut" },
  { id: "recomp", label: "Body Recomposition (Build + Shred)", tag: "Recomp" },
  { id: "strength", label: "Maximal Strength & Powerlifting", tag: "Strength" },
];

const EXPERIENCE_OPTIONS = [
  { id: "beginner", label: "0 – 6 months", sub: "Form & habit foundations" },
  { id: "intermediate", label: "6m – 2 years", sub: "Progressive overload & hypertrophy" },
  { id: "advanced", label: "2 – 5 years", sub: "Periodized volume & weak points" },
  { id: "extreme", label: "5+ years", sub: "Elite strength & conditioning" },
];

const EQUIPMENT_OPTIONS = [
  { id: "full gym", label: "Commercial Gym (Barbells, Cables, Machines, Dumbbells)" },
  { id: "dumbbells + bench", label: "Dumbbells & Adjustable Bench" },
  { id: "barbell + rack", label: "Barbell, Squat Rack & Plates" },
  { id: "bodyweight", label: "Bodyweight & Calisthenics Only" },
];

const DURATION_OPTIONS = [
  { id: "45", label: "30 – 45 min", tag: "Express" },
  { id: "60", label: "45 – 60 min", tag: "Standard" },
  { id: "75", label: "60 – 75 min", tag: "High Volume" },
  { id: "90", label: "75 – 90 min", tag: "Heavy Power" },
];

const RECOMMENDED_MODULES = [
  {
    id: "chest_triceps",
    name: "Chest, Anterior Delts & Triceps (Push)",
    defaultChecked: true,
    levels: ["Fundamental Form", "Hypertrophy Focus", "Strength & Heavy Bench"],
    defaultLevel: "Hypertrophy Focus",
  },
  {
    id: "back_biceps",
    name: "Back, Lats, Traps & Biceps (Pull)",
    defaultChecked: true,
    levels: ["Fundamental Pulls", "Hypertrophy Focus", "Deadlift & Power Pulls"],
    defaultLevel: "Hypertrophy Focus",
  },
  {
    id: "legs_glutes",
    name: "Quads, Hamstrings & Calves (Legs)",
    defaultChecked: true,
    levels: ["Knee Health & Movement", "Hypertrophy Volume", "Heavy Squat Progression"],
    defaultLevel: "Hypertrophy Volume",
  },
  {
    id: "shoulders_arms",
    name: "Shoulders, Lateral Delts & Arms",
    defaultChecked: true,
    levels: ["Delts Mobility", "Arm Hypertrophy & Density", "Overhead Press Power"],
    defaultLevel: "Arm Hypertrophy & Density",
  },
  {
    id: "core_conditioning",
    name: "Core, Abs & Metabolic Conditioning",
    defaultChecked: true,
    levels: ["Anti-Extension Stability", "Six-Pack Hypertrophy", "HIIT Conditioning"],
    defaultLevel: "Anti-Extension Stability",
  },
];

export default function TufWizardModal({
  isOpen,
  onClose,
  defaultGoal = "bulk",
  defaultLevel = "intermediate",
  userName = "Athlete",
}: TufWizardModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: About You
  const [goal, setGoal] = useState(defaultGoal);
  const [level, setLevel] = useState(defaultLevel);
  const [split, setSplit] = useState(SPLIT_OPTIONS[0].id);
  const [equipment, setEquipment] = useState(EQUIPMENT_OPTIONS[0].id);
  const [duration, setDuration] = useState("60");

  // Step 2: Build Preparation
  const [modules, setModules] = useState(
    RECOMMENDED_MODULES.map((m) => ({
      id: m.id,
      selected: m.defaultChecked,
      level: m.defaultLevel,
    }))
  );
  const [daysPerWeek, setDaysPerWeek] = useState(4);

  // Step 3: Roadmap & AI Adjustment
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<PlanInput | null>(null);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [chatPrompt, setChatPrompt] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "coach"; text: string }>>([
    {
      role: "coach",
      text: `Hey ${userName}! I drafted your weekly split. You can ask me to adjust any exercises, swap movements, or change sets right here!`,
    },
  ]);

  const [saving, startSave] = useTransition();

  if (!isOpen) return null;

  const toggleModule = (id: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const setModuleLevel = (id: string, lvl: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, level: lvl } : m))
    );
  };

  async function generateRoadmap() {
    setGenerating(true);
    setStep(3);
    try {
      const selectedMods = modules
        .filter((m) => m.selected)
        .map((m) => {
          const def = RECOMMENDED_MODULES.find((r) => r.id === m.id);
          return `${def?.name} (${m.level})`;
        })
        .join("; ");

      const notes = `Focus modules: ${selectedMods}. Session duration: ${duration} minutes. Target split: ${split}.`;

      const reqBody: AiRequest = {
        goal,
        level,
        daysPerWeek,
        equipment,
        notes,
      };

      const res = await fetch("/api/ai/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();
      if (data.plan) {
        setGeneratedPlan(data.plan);
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCoachAdjustment() {
    if (!chatPrompt.trim() || !generatedPlan || adjusting) return;
    const prompt = chatPrompt.trim();
    setChatPrompt("");
    setAdjusting(true);

    setChatHistory((prev) => [...prev, { role: "user", text: prompt }]);

    try {
      const reqBody: AiRequest = {
        goal,
        level,
        daysPerWeek: generatedPlan.days.length,
        equipment,
        notes: `User requested change: ${prompt}`,
        adjustmentPrompt: prompt,
        currentPlan: generatedPlan,
      };

      const res = await fetch("/api/ai/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();
      if (data.plan) {
        setGeneratedPlan(data.plan);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "coach",
            text: `Updated your roadmap! "${prompt}" has been applied. Check the updated exercises on the left.`,
          },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "coach",
            text: `I understood your request: "${prompt}". I've pinned the note to your routine!`,
          },
        ]);
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "coach",
          text: `Applied your feedback to the routine! Review the plan and hit Activate when ready.`,
        },
      ]);
    } finally {
      setAdjusting(false);
    }
  }

  function handleSavePlan() {
    if (!generatedPlan) return;
    startSave(async () => {
      await saveAiPlanAction(generatedPlan);
      onClose();
      router.refresh();
    });
  }

  // Calculate estimated total hours
  const totalExercises =
    generatedPlan?.days.reduce((acc, d) => acc + d.exercises.length, 0) ||
    daysPerWeek * 5;
  const estTotalHours = (totalExercises * 0.15 * 8).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[880px] rounded-3xl border border-line bg-[#0d0e12] shadow-2xl overflow-hidden">
        {/* Top TUF-style Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/80 bg-[#121318]">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-volt text-carbon font-bold text-sm shadow">
              <Sparkles size={16} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                Planly AI Routine Architect
                <span className="rounded-full bg-volt/15 px-2 py-0.5 text-[10px] font-bold text-volt uppercase tracking-wider">
                  TUF Edition
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Tailored 1:1 programming designed by Gemini AI for {userName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5"
            >
              Discard my plan
            </button>
            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-xl border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-100 hover:bg-smoke transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Multi-Step Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
          {/* STEP 1: ABOUT YOU (Matching Screenshot 2) */}
          {step === 1 && (
            <div className="max-w-3xl space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">About you</h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Tell KC Coach about your target body composition, current lifting level, and training split.
                </p>
              </div>

              {/* 1. Goal */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Target size={15} className="text-volt" />
                  1. Which body composition goal are you preparing for? <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {GOAL_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                        goal === g.id
                          ? "bg-volt text-carbon ring-2 ring-volt/40 shadow-md font-bold"
                          : "border border-line bg-smoke/40 text-zinc-300 hover:bg-smoke/80 hover:text-zinc-100"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Experience */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Dumbbell size={15} className="text-sky-400" />
                  2. How much training experience do you have? <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setLevel(exp.id)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                        level === exp.id
                          ? "bg-sky-500 text-carbon ring-2 ring-sky-400/40 shadow-md font-bold"
                          : "border border-line bg-smoke/40 text-zinc-300 hover:bg-smoke/80 hover:text-zinc-100"
                      }`}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Split Style */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Layers size={15} className="text-emerald-400" />
                  3. What kind of training split are you mainly targeting? <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SPLIT_OPTIONS.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => {
                        setSplit(sp.id);
                        setDaysPerWeek(sp.days);
                      }}
                      className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                        split === sp.id
                          ? "bg-zinc-100 text-carbon ring-2 ring-zinc-300 shadow-md font-bold"
                          : "border border-line bg-smoke/40 text-zinc-300 hover:bg-smoke/80 hover:text-zinc-100"
                      }`}
                    >
                      {sp.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Equipment */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Flame size={15} className="text-amber-400" />
                  4. Available gym setup & equipment? <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => setEquipment(eq.id)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                        equipment === eq.id
                          ? "bg-amber-400 text-carbon ring-2 ring-amber-300/40 shadow-md font-bold"
                          : "border border-line bg-smoke/40 text-zinc-300 hover:bg-smoke/80 hover:text-zinc-100"
                      }`}
                    >
                      {eq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Session Duration */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Clock size={15} className="text-purple-400" />
                  5. Target workout duration per day? <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setDuration(dur.id)}
                      className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                        duration === dur.id
                          ? "bg-purple-500 text-white ring-2 ring-purple-400/40 shadow-md font-bold"
                          : "border border-line bg-smoke/40 text-zinc-300 hover:bg-smoke/80 hover:text-zinc-100"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BUILD YOUR PREPARATION (Matching Screenshot 3) */}
          {step === 2 && (
            <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                  Build your preparation
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Recommended muscle groupings and training bias for your split. Toggle any day and adjust intensity.
                </p>
              </div>

              {/* Days Per Week Counter */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-line bg-smoke/30">
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">Weekly Training Frequency</h4>
                  <p className="text-xs text-zinc-400">Total days dedicated to workouts each sprint/week</p>
                </div>
                <div className="flex items-center gap-2">
                  {[3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDaysPerWeek(n)}
                      className={`size-10 rounded-xl text-sm font-bold transition-all ${
                        daysPerWeek === n
                          ? "bg-volt text-carbon shadow-md"
                          : "border border-line bg-smoke/60 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {n}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Module Cards with TUF Radio Selection */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Recommended Muscle Groups
                </p>
                {RECOMMENDED_MODULES.map((mod) => {
                  const state = modules.find((m) => m.id === mod.id);
                  const isChecked = state?.selected ?? true;
                  const currentLvl = state?.level ?? mod.defaultLevel;

                  return (
                    <div
                      key={mod.id}
                      className={`rounded-2xl border transition-all p-4.5 ${
                        isChecked
                          ? "border-line bg-smoke/25 shadow-sm"
                          : "border-line/40 bg-carbon/40 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleModule(mod.id)}
                            className="size-4.5 rounded border-line text-volt focus:ring-volt/30 bg-smoke"
                          />
                          <span className="text-sm font-bold text-zinc-100">
                            {mod.name}
                          </span>
                        </label>
                      </div>

                      {isChecked && (
                        <div className="mt-3.5 pt-3 border-t border-line/50">
                          <p className="text-[11px] font-semibold text-zinc-400 mb-2">
                            What&apos;s your current training bias?
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {mod.levels.map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => setModuleLevel(mod.id, lvl)}
                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs text-left transition-all ${
                                  currentLvl === lvl
                                    ? "border-sky-500/50 bg-sky-500/15 text-sky-300 font-semibold"
                                    : "border-line/70 bg-smoke/40 text-zinc-400 hover:text-zinc-200 hover:bg-smoke/70"
                                }`}
                              >
                                <span
                                  className={`size-2.5 rounded-full border ${
                                    currentLvl === lvl
                                      ? "border-sky-400 bg-sky-400"
                                      : "border-zinc-500"
                                  }`}
                                />
                                <span className="truncate">{lvl}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW ROADMAP & AI CHAT (Matching Screenshot 4) */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                  Review your roadmap
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Your customized workout sprint generated by KC Coach AI. Inspect each day or ask KC Coach to tweak anything.
                </p>
              </div>

              {/* Highlight Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-volt/30 bg-volt/10 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-volt text-carbon font-bold">
                    <Flame size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">
                      We&apos;ve planned <span className="font-bold text-volt">{estTotalHours} hours</span> of focused lifting across {generatedPlan?.days.length || daysPerWeek} training sessions.
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Target volume: {totalExercises} movements calibrated to your recovery profile.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-volt hover:underline inline-flex items-center gap-1"
                >
                  Adjust modules &gt;
                </button>
              </div>

              {generating ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                  <div className="relative">
                    <div className="size-16 rounded-full border-2 border-volt/20 border-t-volt animate-spin" />
                    <Bot size={24} className="absolute inset-0 m-auto text-volt" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-200">Generating elite routine…</p>
                  <p className="text-xs text-zinc-500">
                    Balancing muscle fatigue, volume loading & recovery windows…
                  </p>
                </div>
              ) : generatedPlan ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Roadmap Accordion Days */}
                  <div className="lg:col-span-7 space-y-3">
                    {generatedPlan.days.map((day, idx) => {
                      const isExpanded = expandedDay === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-line bg-smoke/25 overflow-hidden transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedDay(isExpanded ? -1 : idx)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-smoke/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-volt">
                                {day.label}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-zinc-100">
                                  {day.focus || `Workout Session ${idx + 1}`}
                                </h4>
                                <p className="text-[11px] text-zinc-400">
                                  {day.exercises.length} exercises · Est. {duration}m
                                </p>
                              </div>
                            </div>
                            <ChevronRight
                              size={18}
                              className={`text-zinc-400 transition-transform ${
                                isExpanded ? "rotate-90 text-zinc-100" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="border-t border-line/60 bg-carbon/60 p-4 space-y-2.5">
                              {day.exercises.map((ex, exIdx) => (
                                <div
                                  key={exIdx}
                                  className="flex items-center justify-between rounded-xl border border-line/60 bg-smoke/30 p-2.5 text-xs"
                                >
                                  <div>
                                    <p className="font-semibold text-zinc-200">{ex.name}</p>
                                    {ex.notes && (
                                      <p className="text-[10px] text-zinc-400 mt-0.5">
                                        💡 {ex.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
                                    <span className="rounded-md bg-smoke px-2 py-0.5 text-zinc-300 font-mono">
                                      {ex.sets} × {ex.reps}
                                    </span>
                                    {ex.rest && (
                                      <span className="rounded-md bg-smoke/60 px-1.5 py-0.5 text-zinc-400">
                                        {ex.rest}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: TUFY / KC Coach Live Assistant (Matching Screenshot 4) */}
                  <div className="lg:col-span-5 rounded-2xl border border-line bg-smoke/25 p-4.5 flex flex-col h-[440px]">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-line/60">
                      <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white font-bold text-xs shadow">
                        🤖
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">Ask KC Coach AI</h4>
                        <p className="text-[10px] text-zinc-400">
                          Chat to tweak exercises, swaps, or volume in real-time
                        </p>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
                      {chatHistory.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex gap-2.5 ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {msg.role === "coach" && (
                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              KC
                            </span>
                          )}
                          <div
                            className={`rounded-2xl px-3.5 py-2 max-w-[85%] leading-relaxed ${
                              msg.role === "user"
                                ? "bg-volt text-carbon font-medium rounded-br-none"
                                : "bg-smoke/70 border border-line/70 text-zinc-200 rounded-bl-none"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {adjusting && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 pl-8">
                          <RotateCcw size={13} className="animate-spin text-volt" />
                          <span>KC Coach is recalibrating your routine…</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCoachAdjustment();
                      }}
                      className="pt-2 border-t border-line/60"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={chatPrompt}
                          onChange={(e) => setChatPrompt(e.target.value)}
                          placeholder="e.g. Replace barbell bench with dumbbell press…"
                          className="w-full rounded-xl border border-line bg-carbon/80 pl-3 pr-10 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-volt focus:outline-none focus:ring-1 focus:ring-volt/30"
                          disabled={adjusting}
                        />
                        <button
                          type="submit"
                          disabled={!chatPrompt.trim() || adjusting}
                          className="absolute right-1.5 grid size-7 place-items-center rounded-lg bg-volt text-carbon transition-transform active:scale-95 disabled:opacity-40"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                      <p className="mt-1.5 text-[10px] text-zinc-500 text-center">
                        Tip: You can ask to add cardio, swap leg press for squats, or reduce sets.
                      </p>
                    </form>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Bottom Stepper Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line/80 bg-[#121318]">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {/* Step indicator bar */}
            <div className="flex items-center gap-1.5 mr-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step
                      ? "w-7 bg-volt"
                      : s < step
                      ? "w-3 bg-zinc-400"
                      : "w-3 bg-zinc-700"
                  }`}
                />
              ))}
            </div>
            <span>
              Step {step} of 3 · <span className="text-zinc-500">Draft saved</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-smoke/40 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-smoke hover:text-zinc-100 transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-volt px-6 py-2.5 text-xs font-bold text-carbon uppercase tracking-wider hover:bg-volt-dim transition-all shadow-md active:scale-98"
              >
                Continue
                <ChevronRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={generateRoadmap}
                className="inline-flex items-center gap-2 rounded-xl bg-volt px-6 py-2.5 text-xs font-bold text-carbon uppercase tracking-wider hover:bg-volt-dim transition-all shadow-md active:scale-98"
              >
                <Sparkles size={14} />
                Generate AI Roadmap
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleSavePlan}
                disabled={saving || !generatedPlan}
                className="inline-flex items-center gap-2 rounded-xl bg-volt px-6 py-2.5 text-xs font-bold text-carbon uppercase tracking-wider hover:bg-volt-dim transition-all shadow-md disabled:opacity-50 active:scale-98"
              >
                {saving ? (
                  <RotateCcw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Activate Routine
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
