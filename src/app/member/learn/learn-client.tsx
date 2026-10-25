"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Extreme";
  goal: "Bulk" | "Cut" | "Recomp" | "Strength";
  minutes: string;
  video: string;
  poster: string;
  cues: string[];
}

const LIBRARY: Lesson[] = [
  {
    id: 1,
    title: "Squat Foundations",
    level: "Beginner",
    goal: "Strength",
    minutes: "8 min",
    video:
      "https://videos.pexels.com/video-files/20559800/20559800-hd_1080_1922_60fps.mp4",
    poster:
      "https://images.pexels.com/videos/20559800/pexels-photo-20559800.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["Brace before you unrack", "Knees track over toes", "Hip crease below knee"],
  },
  {
    id: 2,
    title: "Loading & Bar Setup 101",
    level: "Beginner",
    goal: "Strength",
    minutes: "4 min",
    video:
      "https://videos.pexels.com/video-files/5319998/5319998-uhd_3840_2160_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/5319998/pexels-photo-5319998.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["Collars on every set", "Load evenly, both sides", "Plan your jumps"],
  },
  {
    id: 3,
    title: "Bench Press Mastery",
    level: "Intermediate",
    goal: "Bulk",
    minutes: "10 min",
    video:
      "https://videos.pexels.com/video-files/5320001/5320001-uhd_3840_2160_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/5320001/pexels-photo-5320001.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["Legs drive, upper back tight", "Touch lower chest", "Bar path in a slight arc"],
  },
  {
    id: 4,
    title: "Rows & Pull Mechanics",
    level: "Intermediate",
    goal: "Bulk",
    minutes: "7 min",
    video:
      "https://videos.pexels.com/video-files/35585700/15079798_1080_1920_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/35585700/pexels-photo-35585700.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["Pull elbows, not hands", "Squeeze one second on top", "No torso heave"],
  },
  {
    id: 5,
    title: "Deadlift Setup Clinic",
    level: "Advanced",
    goal: "Bulk",
    minutes: "9 min",
    video:
      "https://videos.pexels.com/video-files/5319754/5319754-uhd_2160_3840_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/5319754/pexels-photo-5319754.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["Bar over mid-foot", "Push the floor away", "Lockout — glutes, not lower back"],
  },
  {
    id: 6,
    title: "Overhead Press Clinic",
    level: "Advanced",
    goal: "Strength",
    minutes: "8 min",
    video:
      "https://videos.pexels.com/video-files/5319763/5319763-uhd_2160_3840_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/5319763/pexels-photo-5319763.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["Glutes + abs locked", "Head through at lockout", "Slight press back, not out"],
  },
  {
    id: 7,
    title: "Rest-Pause Conditioning",
    level: "Extreme",
    goal: "Cut",
    minutes: "6 min",
    video:
      "https://videos.pexels.com/video-files/5320010/5320010-uhd_3840_2160_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/5320010/pexels-photo-5320010.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["15s breaks, repeated efforts", "Stop 2 reps before failure", "Nasal breathing between sets"],
  },
  {
    id: 8,
    title: "Olympic-Style Explosiveness",
    level: "Extreme",
    goal: "Strength",
    minutes: "6 min",
    video:
      "https://videos.pexels.com/video-files/35585701/15079610_1080_1920_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/35585701/pexels-photo-35585701.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["Extend violently, then pull under", "Meet the bar — don't chase it", "Reset between singles"],
  },
  {
    id: 9,
    title: "Cutting Without Losing Muscle",
    level: "Intermediate",
    goal: "Cut",
    minutes: "5 min",
    video:
      "https://videos.pexels.com/video-files/5320001/5320001-uhd_3840_2160_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/5320001/pexels-photo-5320001.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["Keep intensity, trim volume", "Protein every meal", "Steps before cardio sessions"],
  },
  {
    id: 10,
    title: "Hypertrophy Tempo Primer",
    level: "Beginner",
    goal: "Bulk",
    minutes: "5 min",
    video:
      "https://videos.pexels.com/video-files/20559800/20559800-hd_1080_1922_60fps.mp4",
    poster:
      "https://images.pexels.com/videos/20559800/pexels-photo-20559800.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    cues: ["3-second negatives", "Own the stretch", "Progress reps before load"],
  },
];

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced", "Extreme"] as const;
const GOALS = ["All", "Bulk", "Cut", "Recomp", "Strength"] as const;

const LEVEL_COLOR: Record<string, string> = {
  Beginner: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  Intermediate: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  Advanced: "text-orange-300 border-orange-400/30 bg-orange-400/10",
  Extreme: "text-red-300 border-red-400/30 bg-red-400/10",
};

export default function LearnLibrary() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("All");

  const filtered = LIBRARY.filter(
    (l) => (level === "All" || l.level === level) && (goal === "All" || l.goal === goal)
  );

  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all ${
      active
        ? "bg-volt text-carbon"
        : "border border-line bg-smoke/50 text-zinc-400 hover:text-zinc-100"
    }`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
          Level
        </span>
        {LEVELS.map((l) => (
          <button key={l} onClick={() => setLevel(l)} className={pill(level === l)}>
            {l}
          </button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
          Goal
        </span>
        {GOALS.map((g) => (
          <button key={g} onClick={() => setGoal(g)} className={pill(goal === g)}>
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">
          Nothing in the vault for that combo yet — we shoot new guides weekly.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <article
              key={l.id}
              className="group overflow-hidden rounded-2xl border border-line bg-carbon transition-colors hover:border-volt/40"
            >
              <div className="relative aspect-video overflow-hidden bg-smoke">
                <video
                  src={l.video}
                  poster={l.poster}
                  controls
                  preload="none"
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-carbon/70 px-3 py-1 text-[10px] font-bold tracking-widest uppercase backdrop-blur">
                  <Play size={10} className="text-volt" /> {l.minutes}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${LEVEL_COLOR[l.level]}`}
                  >
                    {l.level}
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                    {l.goal}
                  </span>
                </div>
                <h4 className="font-display mt-3 text-lg tracking-wide">{l.title}</h4>
                <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                  {l.cues.map((c) => (
                    <li key={c} className="flex items-center gap-2">
                      <span className="size-1 rounded-full bg-volt" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
