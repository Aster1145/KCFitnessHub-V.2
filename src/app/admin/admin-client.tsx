"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, LoaderCircle, RotateCcw, UserPlus, X } from "lucide-react";
import { addMemberAction, assignCoachAction, dismissMessageAction, renewMembershipAction } from "@/actions/admin";

const inputCls =
  "w-full rounded-xl border border-line bg-smoke/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20";

export function AddMemberForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [planType, setPlanType] = useState<"monthly" | "quarterly" | "halfYearly" | "annual" | "pt">("monthly");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(1399);

  const presets = {
    monthly: { plan: "normal" as const, days: 30, price: 1399 },
    quarterly: { plan: "normal" as const, days: 90, price: 3999 },
    halfYearly: { plan: "normal" as const, days: 180, price: 6999 },
    annual: { plan: "normal" as const, days: 365, price: 11999 },
    pt: { plan: "pt" as const, days: 30, price: 4999 },
  };

  function onPresetChange(key: keyof typeof presets) {
    setPlanType(key);
    setDuration(presets[key].days);
    setPrice(presets[key].price);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    setErr(null);
    start(async () => {
      const res = await addMemberAction({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        plan: presets[planType].plan,
        durationDays: duration,
        price: price,
        goal: String(fd.get("goal") ?? "recomp"),
      });
      if (res.ok) {
        form.reset();
        setMsg(`Member added. Temp password: ${res.tempPassword}`);
        router.refresh();
      } else {
        setErr(res.error ?? "Failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="name" required placeholder="Full name" className={inputCls} />
      <input name="email" required type="email" placeholder="Email (login ID)" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={planType}
          onChange={(e) => onPresetChange(e.target.value as keyof typeof presets)}
          className={inputCls}
        >
          <option value="monthly">Monthly — ₹1,399 / 30d</option>
          <option value="quarterly">Quarterly — ₹3,999 / 90d</option>
          <option value="halfYearly">Half Yearly — ₹6,999 / 180d</option>
          <option value="annual">Annual — ₹11,999 / 365d</option>
          <option value="pt">PT (Coached) — ₹4,999 / 30d</option>
        </select>
        <select name="goal" className={inputCls} defaultValue="recomp">
          <option value="bulk">Goal: Bulk</option>
          <option value="cut">Goal: Cut</option>
          <option value="recomp">Goal: Recomp</option>
          <option value="strength">Goal: Strength</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="duration"
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          placeholder="Sessions promised"
          className={inputCls}
        />
        <input
          name="price"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Price ₹"
          className={inputCls}
        />
      </div>
      {err ? <p className="text-xs text-red-300">{err}</p> : null}
      {msg ? <p className="text-xs text-volt">{msg}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-volt px-4 py-3 text-sm font-bold tracking-widest text-carbon uppercase hover:bg-volt-dim disabled:opacity-60"
      >
        {pending ? <LoaderCircle size={15} className="animate-spin" /> : <UserPlus size={15} />}
        Activate membership
      </button>
    </form>
  );
}

export function CoachAssigner({
  memberId,
  trainers,
  currentId,
}: {
  memberId: number;
  trainers: { id: number; name: string; specialty: string }[];
  currentId: number | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="relative inline-block">
      <select
        value={currentId ?? ""}
        disabled={pending}
        onChange={(e) => {
          const id = Number(e.target.value);
          if (!id) return;
          start(async () => {
            await assignCoachAction(memberId, id);
            router.refresh();
          });
        }}
        className={`appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs font-medium focus:border-volt focus:outline-none ${
          currentId
            ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
            : "border-dashed border-line bg-carbon text-zinc-500"
        }`}
      >
        <option value="" disabled>
          Assign coach…
        </option>
        {trainers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {pending ? (
        <LoaderCircle size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />
      ) : (
        <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
      )}
    </div>
  );
}

export function DismissBtn({ id }: { id: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await dismissMessageAction(id);
          router.refresh();
        })
      }
      className="shrink-0 rounded-lg border border-line p-1.5 text-zinc-500 transition-colors hover:border-volt/40 hover:text-volt"
      title="Mark handled"
    >
      {pending ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}
    </button>
  );
}

export function RenewForm({ memberId }: { memberId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState<"normal" | "pt">("normal");
  const [days, setDays] = useState(30);
  const [price, setPrice] = useState(1399);

  function applyPreset(p: "normal" | "pt", d: number, pr: number) {
    setPlan(p);
    setDays(d);
    setPrice(pr);
  }

  function submit() {
    start(async () => {
      await renewMembershipAction(memberId, plan, days, price);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-volt/40 hover:text-volt"
      >
        <RotateCcw size={12} /> Renew
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-30 w-64 rounded-xl border border-line bg-smoke p-3 shadow-2xl shadow-black/60">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
              Renew Subscription
            </p>
            <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-300">
              <X size={13} />
            </button>
          </div>
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === "monthly") applyPreset("normal", 30, 1399);
              else if (val === "quarterly") applyPreset("normal", 90, 3999);
              else if (val === "halfYearly") applyPreset("normal", 180, 6999);
              else if (val === "annual") applyPreset("normal", 365, 11999);
              else if (val === "pt") applyPreset("pt", 30, 4999);
            }}
            className="mb-2 w-full rounded-lg border border-line bg-carbon px-2.5 py-2 text-xs text-zinc-200"
          >
            <option value="monthly">Monthly — ₹1,399 (30d)</option>
            <option value="quarterly">Quarterly — ₹3,999 (90d)</option>
            <option value="halfYearly">Half Yearly — ₹6,999 (180d)</option>
            <option value="annual">Annual — ₹11,999 (365d)</option>
            <option value="pt">PT Coached — ₹4,999 (30d)</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-1/2 rounded-lg border border-line bg-carbon px-2.5 py-2 text-xs"
              placeholder="Sessions"
            />
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-1/2 rounded-lg border border-line bg-carbon px-2.5 py-2 text-xs"
              placeholder="₹"
            />
          </div>
          <button
            onClick={submit}
            disabled={pending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-volt py-2 text-xs font-bold tracking-widest text-carbon uppercase hover:bg-volt-dim disabled:opacity-60"
          >
            {pending ? <LoaderCircle size={12} className="animate-spin" /> : <Check size={12} />}
            Start cycle
          </button>
        </div>
      ) : null}
    </div>
  );
}
