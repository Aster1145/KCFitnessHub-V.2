"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Copy,
  KeyRound,
  LoaderCircle,
  RotateCcw,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  addCoachAction,
  addMemberAction,
  assignCoachAction,
  deleteUserAction,
  dismissMessageAction,
  renewMembershipAction,
  updateUserPasswordAction,
} from "@/actions/admin";
import { Avatar, Chip } from "@/components/ui";

const inputCls =
  "w-full rounded-xl border border-line bg-smoke/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20";

export function AddMemberForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [successData, setSuccessData] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [planType, setPlanType] = useState<
    "monthly" | "quarterly" | "halfYearly" | "annual" | "pt"
  >("monthly");
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
    setSuccessData(null);
    setErr(null);
    setCopied(false);

    start(async () => {
      const res = await addMemberAction({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
        plan: presets[planType].plan,
        durationDays: duration,
        price: price,
        goal: String(fd.get("goal") ?? "recomp"),
      });
      if (res.ok && res.email && res.password) {
        form.reset();
        setSuccessData({
          email: res.email,
          password: res.password,
          name: res.name ?? "Member",
        });
        router.refresh();
      } else {
        setErr(res.error ?? "Failed to add member");
      }
    });
  }

  const copyCreds = () => {
    if (!successData) return;
    navigator.clipboard.writeText(
      `Email: ${successData.email}\nPassword: ${successData.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        name="name"
        required
        placeholder="Full name"
        className={inputCls}
      />
      <input
        name="email"
        required
        type="email"
        placeholder="Member Email (Login ID)"
        className={inputCls}
      />
      <div>
        <input
          name="password"
          type="text"
          placeholder="Password (leave empty to auto-generate)"
          className={inputCls}
        />
        <p className="mt-1 text-[11px] text-zinc-500">
          Set real password (min 6 characters) or leave blank for a secure auto-code.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={planType}
          onChange={(e) =>
            onPresetChange(e.target.value as keyof typeof presets)
          }
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

      {err ? (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-2.5 text-xs text-red-300">
          {err}
        </p>
      ) : null}

      {successData ? (
        <div className="rounded-xl border border-volt/30 bg-volt/10 p-3 text-xs text-zinc-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-volt">Member Registered!</span>
            <button
              type="button"
              onClick={copyCreds}
              className="flex items-center gap-1 text-[11px] font-bold text-volt hover:underline"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy Credentials"}
            </button>
          </div>
          <p className="mt-1 font-mono text-[11px] text-zinc-300">
            Email: <span className="text-white">{successData.email}</span>
            <br />
            Password: <span className="text-volt font-bold">{successData.password}</span>
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-volt px-4 py-3 text-sm font-bold tracking-widest text-carbon uppercase hover:bg-volt-dim disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <UserPlus size={15} />
        )}
        Activate Membership
      </button>
    </form>
  );
}

export function AddCoachForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [successData, setSuccessData] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSuccessData(null);
    setErr(null);
    setCopied(false);

    start(async () => {
      const res = await addCoachAction({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
        specialty: String(fd.get("specialty") ?? ""),
      });
      if (res.ok && res.email && res.password) {
        form.reset();
        setSuccessData({
          email: res.email,
          password: res.password,
          name: res.name ?? "Coach",
        });
        router.refresh();
      } else {
        setErr(res.error ?? "Failed to add coach");
      }
    });
  }

  const copyCreds = () => {
    if (!successData) return;
    navigator.clipboard.writeText(
      `Coach: ${successData.name}\nEmail: ${successData.email}\nPassword: ${successData.password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        name="name"
        required
        placeholder="Coach / Trainer Name"
        className={inputCls}
      />
      <input
        name="email"
        required
        type="email"
        placeholder="Coach Email (Login ID)"
        className={inputCls}
      />
      <div>
        <input
          name="password"
          type="text"
          placeholder="Password (leave empty to auto-generate)"
          className={inputCls}
        />
        <p className="mt-1 text-[11px] text-zinc-500">
          Set real password (min 6 characters) or leave blank for a secure auto-code.
        </p>
      </div>
      <select
        name="specialty"
        defaultValue="Strength & Conditioning"
        className={inputCls}
      >
        <option value="Strength & Conditioning">Strength & Conditioning</option>
        <option value="Hypertrophy & Bodybuilding">Hypertrophy & Bodybuilding</option>
        <option value="Weight Loss & Transformation">Weight Loss & Transformation</option>
        <option value="CrossFit & Athletic Performance">CrossFit & Athletic Performance</option>
        <option value="Functional Movement & Mobility">Functional Movement & Mobility</option>
        <option value="Boxing & Cardio Conditioning">Boxing & Cardio Conditioning</option>
      </select>

      {err ? (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-2.5 text-xs text-red-300">
          {err}
        </p>
      ) : null}

      {successData ? (
        <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-3 text-xs text-zinc-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sky-300">Coach Registered!</span>
            <button
              type="button"
              onClick={copyCreds}
              className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:underline"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy Credentials"}
            </button>
          </div>
          <p className="mt-1 font-mono text-[11px] text-zinc-300">
            Coach: <span className="text-white">{successData.name}</span>
            <br />
            Email: <span className="text-white">{successData.email}</span>
            <br />
            Password: <span className="text-sky-300 font-bold">{successData.password}</span>
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-3 text-sm font-bold tracking-widest text-carbon uppercase hover:bg-sky-300 disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <UserCheck size={15} />
        )}
        Add Coach to KC
      </button>
    </form>
  );
}

export function CoachesManager({
  trainers,
  studentCounts,
}: {
  trainers: { id: number; name: string; email: string; specialty: string | null; avatarHue: number }[];
  studentCounts: Record<number, number>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
            <th className="py-2.5 pr-4">Coach</th>
            <th className="py-2.5 pr-4">Specialty</th>
            <th className="py-2.5 pr-4">PT Clients</th>
            <th className="py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trainers.map((t) => (
            <tr key={t.id} className="border-b border-line/60 align-middle">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} hue={t.avatarHue} size={34} />
                  <div>
                    <p className="font-medium text-zinc-100">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4">
                <Chip tone="blue">{t.specialty || "Coach"}</Chip>
              </td>
              <td className="py-3 pr-4 text-xs font-semibold text-zinc-300">
                {studentCounts[t.id] ?? 0} active
              </td>
              <td className="py-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <ResetPasswordBtn userId={t.id} userName={t.name} />
                  <DeleteUserBtn userId={t.id} userName={t.name} />
                </div>
              </td>
            </tr>
          ))}
          {trainers.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-xs text-zinc-500">
                No coaches registered yet. Add your first coach using the form above.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function ResetPasswordBtn({
  userId,
  userName,
}: {
  userId: number;
  userName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleReset = () => {
    if (newPassword.trim().length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    setErr(null);
    setMsg(null);
    start(async () => {
      const res = await updateUserPasswordAction(userId, newPassword);
      if (res.ok) {
        setMsg("Password updated successfully!");
        setTimeout(() => {
          setOpen(false);
          setMsg(null);
          setNewPassword("");
        }, 1200);
        router.refresh();
      } else {
        setErr(res.error ?? "Failed to update password");
      }
    });
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:border-volt/40 hover:text-volt"
        title="Change Password"
      >
        <KeyRound size={12} />
        <span className="hidden sm:inline">Password</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-40 w-64 rounded-xl border border-line bg-smoke p-3 shadow-2xl shadow-black/80">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
              Reset Password for {userName}
            </p>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X size={13} />
            </button>
          </div>
          <input
            type="text"
            placeholder="New password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-2 w-full rounded-lg border border-line bg-carbon px-2.5 py-2 text-xs text-zinc-200 focus:border-volt focus:outline-none"
          />
          {err ? <p className="mb-2 text-[10px] text-red-300">{err}</p> : null}
          {msg ? <p className="mb-2 text-[10px] text-volt">{msg}</p> : null}
          <button
            onClick={handleReset}
            disabled={pending || !newPassword}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-volt py-1.5 text-xs font-bold uppercase text-carbon hover:bg-volt-dim disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            Save Password
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function DeleteUserBtn({
  userId,
  userName,
}: {
  userId: number;
  userName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to remove ${userName}? This will remove their portal access.`)) {
      return;
    }
    start(async () => {
      const res = await deleteUserAction(userId);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.error ?? "Failed to delete user");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="rounded-lg border border-line p-1.5 text-zinc-500 transition-colors hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"
      title={`Remove ${userName}`}
    >
      {pending ? <LoaderCircle size={12} className="animate-spin" /> : <Trash2 size={12} />}
    </button>
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
        <LoaderCircle
          size={12}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
        />
      ) : (
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
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
