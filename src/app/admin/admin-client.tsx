"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  KeyRound,
  LoaderCircle,
  QrCode,
  RotateCcw,
  Search,
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

export type MemberRowData = {
  user: {
    id: number;
    code: string | null;
    name: string;
    email: string;
    avatarHue: number;
  };
  membership: {
    id: number;
    plan: "normal" | "pt";
    durationDays: number;
    pricePaid: number;
  } | null;
  sub: {
    active: boolean;
    remaining: number;
    totalDays: number;
    pct: number;
    endDate: string;
    absent: number;
  } | null;
  coachId: number | null;
};

export function MembersManager({
  rows,
  trainers,
}: {
  rows: MemberRowData[];
  trainers: { id: number; name: string; specialty: string }[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "pt" | "expiring">("all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (r.user.code && r.user.code.toLowerCase().includes(q)) ||
        r.user.name.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (filter === "active") return r.sub?.active;
      if (filter === "pt") return r.membership?.plan === "pt" && r.sub?.active;
      if (filter === "expiring") return r.sub?.active && (r.sub.remaining ?? 99) <= 3;
      return true;
    });
  }, [rows, search, filter]);

  const activeCount = useMemo(() => rows.filter((r) => r.sub?.active).length, [rows]);
  const ptCount = useMemo(
    () => rows.filter((r) => r.membership?.plan === "pt" && r.sub?.active).length,
    [rows]
  );
  const expiringCount = useMemo(
    () => rows.filter((r) => r.sub?.active && (r.sub.remaining ?? 99) <= 3).length,
    [rows]
  );

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Member ID (e.g. KCM0001), name, or email…"
            className="w-full rounded-xl border border-line bg-carbon py-2.5 pl-10 pr-9 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-1 focus:ring-volt/40"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              filter === "all"
                ? "bg-zinc-200 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({rows.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              filter === "active"
                ? "bg-volt text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter("pt")}
            className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              filter === "pt"
                ? "bg-sky-400 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            PT ({ptCount})
          </button>
          <button
            onClick={() => setFilter("expiring")}
            className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
              filter === "expiring"
                ? "bg-amber-400 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Expiring ≤3d ({expiringCount})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              <th className="py-2.5 pr-3">Member ID</th>
              <th className="py-2.5 pr-4">Member</th>
              <th className="py-2.5 pr-4">Plan</th>
              <th className="py-2.5 pr-4">Progress</th>
              <th className="py-2.5 pr-4">Adjusted End</th>
              <th className="py-2.5 pr-4">Coach</th>
              <th className="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.user.id} className="border-b border-line/60 align-middle">
                <td className="py-3 pr-3">
                  <span className="inline-flex items-center rounded-md border border-volt/30 bg-volt/10 px-2 py-0.5 font-mono text-[11px] font-bold text-volt">
                    {r.user.code || `KCM${String(r.user.id).padStart(4, "0")}`}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.user.name} hue={r.user.avatarHue} size={34} />
                    <div>
                      <p className="font-medium text-zinc-100">{r.user.name}</p>
                      <p className="text-xs text-zinc-500">{r.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {r.membership ? (
                    <Chip tone={r.membership.plan === "pt" ? "blue" : "volt"}>
                      {r.membership.plan === "pt" ? "PT" : "Normal"}
                    </Chip>
                  ) : (
                    <Chip tone="zinc">—</Chip>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {r.sub ? (
                    <div className="w-36">
                      <p className="mb-1 text-xs text-zinc-400">
                        <span className="font-semibold text-zinc-200">{r.sub.remaining}</span>
                        {" / "}
                        {r.sub.totalDays} left
                      </p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-smoke">
                        <div
                          className={`h-full rounded-full ${
                            r.sub.active ? "bg-volt" : "bg-zinc-600"
                          }`}
                          style={{ width: `${r.sub.pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600">no plan</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-xs text-zinc-400">
                  {r.sub ? (
                    <>
                      {r.sub.endDate}
                      <span className="ml-1 text-zinc-600">(+{r.sub.absent}d)</span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4">
                  {r.membership?.plan === "pt" ? (
                    <CoachAssigner
                      memberId={r.user.id}
                      trainers={trainers}
                      currentId={r.coachId}
                    />
                  ) : (
                    <span className="text-xs text-zinc-600">not eligible</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <RenewForm memberId={r.user.id} />
                    <ResetPasswordBtn userId={r.user.id} userName={r.user.name} />
                    <DeleteUserBtn userId={r.user.id} userName={r.user.name} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-zinc-500">
                  {search
                    ? `No members found matching ID or name "${search}".`
                    : "No members found."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AddMemberForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [successData, setSuccessData] = useState<{
    code?: string;
    email: string;
    password: string;
    name: string;
    method: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [planType, setPlanType] = useState<
    "monthly" | "quarterly" | "halfYearly" | "annual" | "pt"
  >("monthly");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(1399);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Cash" | "Card">("UPI");

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
        paymentMethod: paymentMethod,
        goal: String(fd.get("goal") ?? "recomp"),
      });
      if (res.ok && res.email && res.password) {
        form.reset();
        setSuccessData({
          code: res.code,
          email: res.email,
          password: res.password,
          name: res.name ?? "Member",
          method: paymentMethod,
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
      `Member ID: ${successData.code || "Assigned"}\nName: ${successData.name}\nEmail: ${successData.email}\nPassword: ${successData.password}\nPayment: ${successData.method}`
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
        placeholder="Member Email (or login ID)"
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
          User ID (e.g. KCM0001) is auto-generated upon registration.
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

      {/* Payment Method Selector */}
      <div>
        <label className="mb-1 block text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod("UPI")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
              paymentMethod === "UPI"
                ? "border-volt bg-volt/10 text-volt"
                : "border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <QrCode size={13} /> UPI
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("Cash")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
              paymentMethod === "Cash"
                ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                : "border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Banknote size={13} /> Cash
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("Card")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
              paymentMethod === "Card"
                ? "border-purple-400 bg-purple-400/10 text-purple-300"
                : "border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CreditCard size={13} /> Card
          </button>
        </div>
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
            Member ID: <span className="font-bold text-volt">{successData.code}</span>
            <br />
            Email: <span className="text-white">{successData.email}</span>
            <br />
            Password: <span className="text-volt font-bold">{successData.password}</span>
            <br />
            Method: <span className="text-zinc-300 uppercase">{successData.method}</span>
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
    code?: string;
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
          code: res.code,
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
      `Coach ID: ${successData.code || "Assigned"}\nName: ${successData.name}\nEmail: ${successData.email}\nPassword: ${successData.password}`
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
        placeholder="Coach Email (or login ID)"
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
          Coach ID (e.g. KCC0001) is auto-generated upon registration.
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
            Coach ID: <span className="font-bold text-sky-300">{successData.code}</span>
            <br />
            Name: <span className="text-white">{successData.name}</span>
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
  trainers: {
    id: number;
    code: string | null;
    name: string;
    email: string;
    specialty: string | null;
    avatarHue: number;
  }[];
  studentCounts: Record<number, number>;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter(
      (t) =>
        (t.code && t.code.toLowerCase().includes(q)) ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.specialty && t.specialty.toLowerCase().includes(q))
    );
  }, [trainers, search]);

  return (
    <div>
      <div className="mb-3 relative max-w-sm">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Coach ID (e.g. KCC0001) or name…"
          className="w-full rounded-xl border border-line bg-carbon py-2 pl-9 pr-8 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-sky-400 focus:outline-none"
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              <th className="py-2.5 pr-3">Coach ID</th>
              <th className="py-2.5 pr-4">Coach</th>
              <th className="py-2.5 pr-4">Specialty</th>
              <th className="py-2.5 pr-4">PT Clients</th>
              <th className="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-line/60 align-middle">
                <td className="py-3 pr-3">
                  <span className="inline-flex items-center rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-300">
                    {t.code || `KCC${String(t.id).padStart(4, "0")}`}
                  </span>
                </td>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-zinc-500">
                  {search
                    ? `No coaches found matching "${search}".`
                    : "No coaches registered yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
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
    if (
      !confirm(
        `Are you sure you want to remove ${userName}? This will remove their portal access.`
      )
    ) {
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
  const [method, setMethod] = useState<"UPI" | "Cash" | "Card">("UPI");

  function applyPreset(p: "normal" | "pt", d: number, pr: number) {
    setPlan(p);
    setDays(d);
    setPrice(pr);
  }

  function submit() {
    start(async () => {
      await renewMembershipAction(memberId, plan, days, price, method);
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
        <div className="absolute right-0 top-9 z-30 w-72 rounded-xl border border-line bg-smoke p-3 shadow-2xl shadow-black/80">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
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
          <div className="mb-2 flex gap-2">
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-1/2 rounded-lg border border-line bg-carbon px-2.5 py-2 text-xs text-zinc-200"
              placeholder="Sessions"
            />
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-1/2 rounded-lg border border-line bg-carbon px-2.5 py-2 text-xs text-zinc-200"
              placeholder="₹"
            />
          </div>

          <div className="mb-3">
            <p className="mb-1 text-[10px] text-zinc-400 font-semibold uppercase">Payment Method</p>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setMethod("UPI")}
                className={`py-1 rounded text-[11px] font-semibold border ${
                  method === "UPI"
                    ? "border-volt bg-volt/20 text-volt"
                    : "border-line bg-carbon text-zinc-400"
                }`}
              >
                UPI
              </button>
              <button
                type="button"
                onClick={() => setMethod("Cash")}
                className={`py-1 rounded text-[11px] font-semibold border ${
                  method === "Cash"
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                    : "border-line bg-carbon text-zinc-400"
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setMethod("Card")}
                className={`py-1 rounded text-[11px] font-semibold border ${
                  method === "Card"
                    ? "border-purple-400 bg-purple-400/20 text-purple-300"
                    : "border-line bg-carbon text-zinc-400"
                }`}
              >
                Card
              </button>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-volt py-2 text-xs font-bold tracking-widest text-carbon uppercase hover:bg-volt-dim disabled:opacity-60"
          >
            {pending ? <LoaderCircle size={12} className="animate-spin" /> : <Check size={12} />}
            Start cycle
          </button>
        </div>
      ) : null}
    </div>
  );
}
