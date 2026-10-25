"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
import { logFoodAction } from "@/actions/member";

const numCls =
  "w-full rounded-lg border border-line bg-carbon px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none";

export default function DietLogger() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      meal: String(fd.get("meal") || "Meal"),
      food: String(fd.get("food") || ""),
      calories: Number(fd.get("calories") || 0),
      protein: Number(fd.get("protein") || 0),
      carbs: Number(fd.get("carbs") || 0),
      fat: Number(fd.get("fat") || 0),
    };
    if (!input.food.trim()) {
      setError("Name the food first.");
      return;
    }
    setError(null);
    start(async () => {
      await logFoodAction(input);
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-6 border-t border-line pt-5">
      <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
        Log food
      </p>
      <div className="grid grid-cols-3 gap-2">
        <select name="meal" className={numCls}>
          {["Breakfast", "Lunch", "Dinner", "Snack", "Pre-workout", "Post-workout"].map(
            (m) => (
              <option key={m}>{m}</option>
            )
          )}
        </select>
        <input name="food" placeholder="Food item" className={`${numCls} col-span-2`} />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        <input name="calories" type="number" min={0} placeholder="kcal" className={numCls} />
        <input name="protein" type="number" min={0} placeholder="P g" className={numCls} />
        <input name="carbs" type="number" min={0} placeholder="C g" className={numCls} />
        <input name="fat" type="number" min={0} placeholder="F g" className={numCls} />
      </div>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-volt px-4 py-3 text-sm font-bold tracking-widest text-carbon uppercase transition-colors hover:bg-volt-dim disabled:opacity-60"
      >
        {pending ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}
        Add entry
      </button>
    </form>
  );
}
