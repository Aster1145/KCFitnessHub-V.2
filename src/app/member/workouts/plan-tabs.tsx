"use client";

import { useState } from "react";
import type { PlanExercise } from "@/db/schema";

export interface PlanDayVM {
  id: number;
  label: string;
  focus: string | null;
  exercises: PlanExercise[];
}

export default function PlanTabs({ days }: { days: PlanDayVM[] }) {
  const [active, setActive] = useState(0);
  const day = days[active];
  if (!day) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActive(i)}
            className={`rounded-xl px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
              i === active
                ? "bg-volt text-carbon"
                : "border border-line bg-smoke/50 text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {day.focus ? (
          <p className="mb-3 text-sm font-semibold tracking-widest text-zinc-400 uppercase">
            {day.focus}
          </p>
        ) : null}
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-smoke/60 text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                <th className="px-4 py-2.5">Exercise</th>
                <th className="w-20 px-3 py-2.5">Sets</th>
                <th className="w-24 px-3 py-2.5">Reps</th>
                <th className="hidden w-24 px-3 py-2.5 sm:table-cell">Rest</th>
                <th className="hidden px-3 py-2.5 md:table-cell">Cue</th>
              </tr>
            </thead>
            <tbody>
              {day.exercises.map((e) => (
                <tr key={e.id} className="border-t border-line/70">
                  <td className="px-4 py-3 font-medium text-zinc-100">{e.name}</td>
                  <td className="px-3 py-3 text-zinc-300">{e.sets}</td>
                  <td className="px-3 py-3 text-zinc-300">{e.reps}</td>
                  <td className="hidden px-3 py-3 text-zinc-400 sm:table-cell">{e.rest}</td>
                  <td className="hidden px-3 py-3 text-xs text-zinc-500 md:table-cell">
                    {e.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
