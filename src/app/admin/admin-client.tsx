"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Award,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Dumbbell,
  ExternalLink,
  Eye,
  Flame,
  KeyRound,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  QrCode,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  addCoachAction,
  addMemberAction,
  approvePendingMemberAction,
  assignCoachAction,
  deleteUserAction,
  dismissMessageAction,
  rejectPendingMemberAction,
  renewMembershipAction,
  resendMemberCredentialsAction,
  updateUserPasswordAction,
} from "@/actions/admin";
import {
  approvePtLiteUpgradeAction,
  updateMemberSubscriptionTierAction,
} from "@/actions/videos";
import { Avatar, Chip } from "@/components/ui";

const inputCls =
  "w-full rounded-xl border border-line bg-smoke/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20";

export type MemberRowData = {
  user: {
    id: number;
    code: string | null;
    name: string;
    email: string;
    phone?: string | null;
    avatarHue: number;
    goal?: string | null;
    level?: string | null;
    subscriptionTier?: string | null;
    createdAt?: string | null;
  };
  membership: {
    id: number;
    plan: "normal" | "pt";
    durationDays: number;
    startDate?: string | null;
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
  coachName?: string | null;
  coachCode?: string | null;
  coachSpecialty?: string | null;
  attendanceCount?: number;
  latestPayment?: {
    amount: number;
    method: string;
    plan: string;
    date: string;
  } | null;
};

export type CoachDetailData = {
  id: number;
  code: string | null;
  name: string;
  email: string;
  phone?: string | null;
  specialty: string | null;
  avatarHue: number;
  createdAt?: string | null;
  clientsCount: number;
  clients: {
    id: number;
    code: string | null;
    name: string;
    email: string;
    phone?: string | null;
    avatarHue: number;
    plan: string;
    remaining: number;
    active: boolean;
  }[];
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
  const [selectedMember, setSelectedMember] = useState<MemberRowData | null>(null);

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
              <tr
                key={r.user.id}
                onClick={() => setSelectedMember(r)}
                className="group border-b border-line/60 align-middle hover:bg-smoke/70 cursor-pointer transition-colors"
              >
                <td className="py-3 pr-3">
                  <span
                    className="inline-flex items-center gap-1 rounded-md border border-volt/30 bg-volt/10 px-2 py-0.5 font-mono text-[11px] font-bold text-volt group-hover:border-volt group-hover:bg-volt/20 transition-all"
                    title="Click to view member card"
                  >
                    <Eye size={10} className="opacity-70 group-hover:opacity-100" />
                    {r.user.code || `KCM${String(r.user.id).padStart(4, "0")}`}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.user.name} hue={r.user.avatarHue} size={34} />
                    <div>
                      <p className="font-medium text-zinc-100 group-hover:text-volt transition-colors">
                        {r.user.name}
                      </p>
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
                <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
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
                <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember(r);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-zinc-400 hover:border-volt/40 hover:text-volt"
                      title="View Member Details Card"
                    >
                      <Eye size={12} />
                      <span className="hidden sm:inline">Card</span>
                    </button>
                    <ShareCredentialsBtn
                      userId={r.user.id}
                      userName={r.user.name}
                      userEmail={r.user.email}
                      userPhone={r.user.phone}
                      userCode={r.user.code}
                    />
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

      {selectedMember ? (
        <MemberDetailModal
          member={selectedMember}
          trainers={trainers}
          onClose={() => setSelectedMember(null)}
        />
      ) : null}
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
        phone: String(fd.get("phone") ?? ""),
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
      <input
        name="phone"
        type="tel"
        placeholder="Phone Number (e.g. +91 98450 12345)"
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
        phone: String(fd.get("phone") ?? ""),
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
      <input
        name="phone"
        type="tel"
        placeholder="Phone Number (e.g. +91 98450 12345)"
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
  coaches,
}: {
  coaches: CoachDetailData[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<CoachDetailData | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coaches;
    return coaches.filter(
      (t) =>
        (t.code && t.code.toLowerCase().includes(q)) ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.specialty && t.specialty.toLowerCase().includes(q))
    );
  }, [coaches, search]);

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
              <tr
                key={t.id}
                onClick={() => setSelectedCoach(t)}
                className="group border-b border-line/60 align-middle hover:bg-smoke/70 cursor-pointer transition-colors"
              >
                <td className="py-3 pr-3">
                  <span
                    className="inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-300 group-hover:border-sky-400 group-hover:bg-sky-400/20 transition-all"
                    title="Click to view coach card"
                  >
                    <Eye size={10} className="opacity-70 group-hover:opacity-100" />
                    {t.code || `KCC${String(t.id).padStart(4, "0")}`}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} hue={t.avatarHue} size={34} />
                    <div>
                      <p className="font-medium text-zinc-100 group-hover:text-sky-300 transition-colors">
                        {t.name}
                      </p>
                      <p className="text-xs text-zinc-500">{t.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <Chip tone="blue">{t.specialty || "Coach"}</Chip>
                </td>
                <td className="py-3 pr-4 text-xs font-semibold text-zinc-300">
                  {t.clientsCount} active
                </td>
                <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCoach(t);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-xs font-medium text-zinc-400 hover:border-sky-400/40 hover:text-sky-300"
                      title="View Coach Details Card"
                    >
                      <Eye size={12} />
                      <span className="hidden sm:inline">Card</span>
                    </button>
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

      {selectedCoach ? (
        <CoachDetailModal
          coach={selectedCoach}
          onClose={() => setSelectedCoach(null)}
        />
      ) : null}
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

export function ShareCredentialsBtn({
  userId,
  userName,
  userEmail,
  userPhone,
  userCode,
}: {
  userId: number;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  userCode?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    code: string;
    password: string;
    email: string;
    emailSent: boolean;
    simulated?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  const handleShare = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLoading(true);
    setErr("");
    try {
      const res = await resendMemberCredentialsAction(userId);
      if (res.ok && res.password) {
        setResult({
          code: res.code,
          password: res.password,
          email: res.email,
          emailSent: !!res.emailSent,
          simulated: res.simulated,
        });
      } else {
        setErr(res.error || "Failed to generate credentials");
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error sending credentials");
    } finally {
      setLoading(false);
    }
  };

  const copyCreds = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!result) return;
    const loginUrl = (typeof window !== "undefined" ? window.location.origin : "https://kcfitnesshub.com") + "/login";
    const text = `Welcome to KC Fitness Hub!\n\nHere are your member login credentials:\n• Member ID: ${result.code}\n• Registered Email: ${result.email}\n• Password: ${result.password}\n\nSign in here: ${loginUrl}\n(You can log in using either your Member ID or Email)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = userPhone?.replace(/[^0-9]/g, "");
  const loginUrl = typeof window !== "undefined" ? window.location.origin + "/login" : "https://kcfitnesshub.com/login";
  const waText = result
    ? encodeURIComponent(
        `Hello ${userName}! Welcome to KC Fitness Hub 💪\n\nYour member credentials are:\n• Member ID: ${result.code}\n• Email: ${result.email}\n• Password: ${result.password}\n\nLogin portal: ${loginUrl}`
      )
    : "";

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-1 rounded-lg border border-volt/40 bg-volt/10 px-2 py-1.5 text-xs font-medium text-volt hover:bg-volt hover:text-carbon transition-colors disabled:opacity-50"
        title="Email auto-generated ID & password to member"
      >
        {loading ? (
          <LoaderCircle size={12} className="animate-spin" />
        ) : (
          <Mail size={12} />
        )}
        <span className="hidden sm:inline">Credentials</span>
      </button>

      {/* Result Modal / Popup */}
      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150 text-left"
          onClick={(e) => {
            e.stopPropagation();
            setResult(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-volt/40 bg-[#121418] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-volt text-carbon font-bold">
                  <Mail size={16} />
                </span>
                <div>
                  <h3 className="font-display text-lg tracking-wide uppercase text-zinc-100">
                    Credentials Dispatched
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Auto-generated login details for {userName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="grid size-7 place-items-center rounded-lg border border-line bg-smoke/60 text-zinc-400 hover:text-zinc-100"
              >
                <X size={14} />
              </button>
            </div>

            <div className="rounded-xl border border-line/80 bg-carbon/80 p-4 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-sans text-xs">Member ID:</span>
                <span className="font-bold text-volt text-sm">{result.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-sans text-xs">Registered Email:</span>
                <span className="text-zinc-200">{result.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-sans text-xs">Auto Password:</span>
                <span className="rounded bg-smoke px-2.5 py-1 font-bold text-white tracking-widest text-sm border border-line">
                  {result.password}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-line/50">
                <span className="text-zinc-500 font-sans text-[11px]">Email Dispatch:</span>
                <span className={`text-[11px] font-sans font-semibold ${result.emailSent ? "text-emerald-400" : "text-amber-400"}`}>
                  {result.emailSent ? "✓ Sent to Inbox" : "✓ Generated (Simulated)"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCreds}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-volt py-2.5 text-xs font-bold uppercase tracking-wider text-carbon hover:bg-volt-dim transition-all shadow-md active:scale-98"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied to Clipboard!" : "Copy Credentials"}
                </button>

                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-carbon transition-all"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                )}
              </div>

              <p className="text-[10px] text-zinc-500 text-center">
                Member can sign in using either Member ID or Email with this password.
              </p>
            </div>
          </div>
        </div>
      )}

      {err && (
        <span className="text-[11px] text-red-400 block mt-1">{err}</span>
      )}
    </>
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

export function ApprovePtLiteBtn({
  messageId,
  memberUserId,
  memberName,
}: {
  messageId: number;
  memberUserId: number;
  memberName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (
            !confirm(
              `Confirm payment of ₹999 received and activate PT Lite access for ${memberName}?`
            )
          )
            return;
          const res = await approvePtLiteUpgradeAction(messageId, memberUserId);
          if (res.ok) {
            router.refresh();
          } else {
            alert(res.error || "Failed to approve PT Lite.");
          }
        })
      }
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-carbon disabled:opacity-50 cursor-pointer"
      title="Confirm Payment & Activate PT Lite"
    >
      {pending ? (
        <LoaderCircle size={12} className="animate-spin" />
      ) : (
        <>
          <CheckCircle2 size={12} />
          Approve PT Lite (₹999)
        </>
      )}
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

export function AdminTierToggleBtn({
  userId,
  memberName,
  currentTier,
}: {
  userId: number;
  memberName: string;
  currentTier: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const handleSetTier = (tier: "STANDARD" | "PT_LITE" | "PT") => {
    if (tier === currentTier) return;
    if (!confirm(`Update subscription tier for ${memberName} to ${tier}?`)) return;
    start(async () => {
      const res = await updateMemberSubscriptionTierAction(userId, tier);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.error || "Failed to update tier");
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        disabled={pending || currentTier === "STANDARD"}
        onClick={() => handleSetTier("STANDARD")}
        className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
          currentTier === "STANDARD"
            ? "bg-zinc-700 text-white cursor-default"
            : "border border-line bg-smoke text-zinc-400 hover:text-white"
        }`}
      >
        Standard
      </button>
      <button
        type="button"
        disabled={pending || currentTier === "PT_LITE"}
        onClick={() => handleSetTier("PT_LITE")}
        className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
          currentTier === "PT_LITE"
            ? "bg-volt text-carbon shadow cursor-default"
            : "border border-volt/30 bg-volt/10 text-volt hover:bg-volt/20"
        }`}
      >
        PT Lite (Approve)
      </button>
      <button
        type="button"
        disabled={pending || currentTier === "PT"}
        onClick={() => handleSetTier("PT")}
        className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
          currentTier === "PT"
            ? "bg-amber-400 text-carbon shadow cursor-default"
            : "border border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
        }`}
      >
        Full PT VIP
      </button>
    </div>
  );
}

export function MemberDetailModal({
  member,
  trainers,
  onClose,
}: {
  member: MemberRowData;
  trainers: { id: number; name: string; specialty: string }[];
  onClose: () => void;
}) {
  const [copiedId, setCopiedId] = useState(false);

  const copyId = () => {
    if (!member.user.code) return;
    navigator.clipboard.writeText(member.user.code);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-smoke p-6 shadow-2xl shadow-black/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg border border-line bg-carbon p-1.5 text-zinc-400 hover:text-zinc-100"
        >
          <X size={16} />
        </button>

        {/* Header with Avatar & Details */}
        <div className="flex items-start gap-4 pb-5 border-b border-line">
          <Avatar name={member.user.name} hue={member.user.avatarHue} size={58} />
          <div className="flex-1 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold tracking-wide uppercase text-white">
                {member.user.name}
              </h2>
              <span className="inline-flex items-center rounded-md border border-volt/30 bg-volt/10 px-2 py-0.5 font-mono text-xs font-bold text-volt">
                {member.user.code || `KCM${String(member.user.id).padStart(4, "0")}`}
              </span>
              <button
                type="button"
                onClick={copyId}
                className="text-[11px] font-semibold text-zinc-400 hover:text-volt transition-colors inline-flex items-center gap-1"
                title="Copy Member ID"
              >
                {copiedId ? <Check size={12} className="text-volt" /> : <Copy size={12} />}
                <span className="text-[10px] uppercase">{copiedId ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Mail size={12} className="text-zinc-500" />
                <a href={`mailto:${member.user.email}`} className="hover:text-zinc-200">
                  {member.user.email}
                </a>
              </span>
              {member.user.phone ? (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="text-volt" />
                    <a href={`tel:${member.user.phone}`} className="font-mono text-zinc-300 hover:text-volt">
                      {member.user.phone}
                    </a>
                    <a
                      href={`https://wa.me/${member.user.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle size={10} />
                      WhatsApp
                    </a>
                  </span>
                </>
              ) : null}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-zinc-500" />
                Joined: {member.user.createdAt || "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-line bg-carbon/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">
                Subscription Status
              </span>
              {member.sub?.active ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/10 px-2.5 py-0.5 text-xs font-bold text-volt">
                  <span className="size-1.5 rounded-full bg-volt animate-pulse" />
                  Active Membership
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-0.5 text-xs font-bold text-red-300">
                  <span className="size-1.5 rounded-full bg-red-400" />
                  Inactive / Expired
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-line/60 bg-smoke/40 p-2.5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Plan Type</p>
                <p className="mt-0.5 font-bold text-zinc-100 flex items-center gap-1.5">
                  <Dumbbell size={13} className="text-volt" />
                  {member.membership?.plan === "pt" ? "Personal Training (PT)" : "Normal Gym Access"}
                </p>
              </div>

              <div className="rounded-lg border border-line/60 bg-smoke/40 p-2.5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Gym Check-Ins</p>
                <p className="mt-0.5 font-bold text-zinc-100 flex items-center gap-1.5">
                  <Activity size={13} className="text-volt" />
                  {member.attendanceCount ?? 0} days attended
                </p>
              </div>
            </div>

            {member.sub ? (
              <div className="mt-3 rounded-lg border border-line/60 bg-smoke/40 p-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">Sessions Remaining:</span>
                  <span className="font-bold text-zinc-100 font-mono">
                    <span className="text-volt">{member.sub.remaining}</span> / {member.sub.totalDays} sessions
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-carbon">
                  <div
                    className={`h-full rounded-full transition-all ${
                      member.sub.active ? "bg-volt shadow-[0_0_10px_rgba(204,255,0,0.5)]" : "bg-zinc-600"
                    }`}
                    style={{ width: `${member.sub.pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Cycle end: <strong className="text-zinc-200">{member.sub.endDate}</strong></span>
                  <span className="text-zinc-500">(+{member.sub.absent}d absent buffer)</span>
                </div>
              </div>
            ) : null}

            {member.latestPayment ? (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-line/40 bg-smoke/20 px-3 py-2 text-xs">
                <span className="text-zinc-400">Latest Payment:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-100">₹{member.latestPayment.amount.toLocaleString("en-IN")}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      member.latestPayment.method === "Cash"
                        ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : member.latestPayment.method === "Card"
                        ? "border border-purple-400/30 bg-purple-400/10 text-purple-300"
                        : "border border-sky-400/30 bg-sky-400/10 text-sky-300"
                    }`}
                  >
                    {member.latestPayment.method}
                  </span>
                  <span className="text-[10px] text-zinc-500">{member.latestPayment.date}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Fitness Goals Profile */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-carbon/70 p-3.5">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Target size={12} className="text-volt" /> Fitness Goal
              </span>
              <p className="text-sm font-semibold text-zinc-100 capitalize">
                {member.user.goal || "General Fitness"}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-carbon/70 p-3.5">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <Flame size={12} className="text-volt" /> Experience Level
              </span>
              <p className="text-sm font-semibold text-zinc-100 capitalize">
                {member.user.level || "Beginner"}
              </p>
            </div>
          </div>

          {/* Assigned Coach Section */}
          <div className="rounded-xl border border-line bg-carbon/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 flex items-center gap-1.5">
                <Award size={12} className="text-sky-400" /> Assigned Coach / Trainer
              </span>
              {member.membership?.plan === "pt" ? (
                <Chip tone="blue">PT Coached</Chip>
              ) : (
                <Chip tone="zinc">General Plan</Chip>
              )}
            </div>

            {member.membership?.plan === "pt" ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <p className="font-semibold text-zinc-200">
                    {member.coachName || "No coach assigned yet"}
                  </p>
                  {member.coachSpecialty ? (
                    <p className="text-xs text-zinc-500">{member.coachSpecialty}</p>
                  ) : null}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <CoachAssigner
                    memberId={member.user.id}
                    trainers={trainers}
                    currentId={member.coachId}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                General gym access. Upgrading to Personal Training enables coach assignment.
              </p>
            )}
          </div>

          {/* Subscription Tier & Video Vault Access */}
          <div className="rounded-xl border border-line bg-carbon/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 flex items-center gap-1.5">
                <Zap size={12} className="text-volt" /> Subscription Tier (Video Vault)
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  member.user.subscriptionTier === "PT"
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : member.user.subscriptionTier === "PT_LITE"
                    ? "bg-volt/20 text-volt border border-volt/40"
                    : "bg-zinc-700/50 text-zinc-300 border border-zinc-600"
                }`}
              >
                {member.user.subscriptionTier || "STANDARD"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <AdminTierToggleBtn
                userId={member.user.id}
                memberName={member.user.name}
                currentTier={member.user.subscriptionTier || "STANDARD"}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <ShareCredentialsBtn
              userId={member.user.id}
              userName={member.user.name}
              userEmail={member.user.email}
              userPhone={member.user.phone}
              userCode={member.user.code}
            />
            <RenewForm memberId={member.user.id} />
            <ResetPasswordBtn userId={member.user.id} userName={member.user.name} />
            <DeleteUserBtn userId={member.user.id} userName={member.user.name} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-carbon px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-smoke hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function CoachDetailModal({
  coach,
  onClose,
}: {
  coach: CoachDetailData;
  onClose: () => void;
}) {
  const [copiedId, setCopiedId] = useState(false);

  const copyId = () => {
    if (!coach.code) return;
    navigator.clipboard.writeText(coach.code);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-smoke p-6 shadow-2xl shadow-black/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg border border-line bg-carbon p-1.5 text-zinc-400 hover:text-zinc-100"
        >
          <X size={16} />
        </button>

        {/* Header with Avatar & Details */}
        <div className="flex items-start gap-4 pb-5 border-b border-line">
          <Avatar name={coach.name} hue={coach.avatarHue} size={58} />
          <div className="flex-1 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold tracking-wide uppercase text-white">
                {coach.name}
              </h2>
              <span className="inline-flex items-center rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 font-mono text-xs font-bold text-sky-300">
                {coach.code || `KCC${String(coach.id).padStart(4, "0")}`}
              </span>
              <button
                type="button"
                onClick={copyId}
                className="text-[11px] font-semibold text-zinc-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1"
                title="Copy Coach ID"
              >
                {copiedId ? <Check size={12} className="text-sky-300" /> : <Copy size={12} />}
                <span className="text-[10px] uppercase">{copiedId ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Mail size={12} className="text-zinc-500" />
                <a href={`mailto:${coach.email}`} className="hover:text-zinc-200">
                  {coach.email}
                </a>
              </span>
              {coach.phone ? (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="text-sky-400" />
                    <a href={`tel:${coach.phone}`} className="font-mono text-zinc-300 hover:text-sky-300">
                      {coach.phone}
                    </a>
                    <a
                      href={`https://wa.me/${coach.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle size={10} />
                      WhatsApp
                    </a>
                  </span>
                </>
              ) : null}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-zinc-500" />
                Joined: {coach.createdAt || "Active Coach"}
              </span>
            </div>
          </div>
        </div>

        {/* Coach Specialty & Credentials */}
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-line bg-carbon/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">
                Specialty & Certification
              </span>
              <Chip tone="blue">Certified KC Coach</Chip>
            </div>
            <p className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Award size={15} className="text-sky-400" />
              {coach.specialty || "Strength & Conditioning"}
            </p>
          </div>

          {/* Assigned PT Clients Roster */}
          <div className="rounded-xl border border-line bg-carbon/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">
                Assigned PT Clients
              </span>
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-0.5 text-xs font-bold text-sky-300">
                {coach.clientsCount} Active Clients
              </span>
            </div>

            {coach.clients.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {coach.clients.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-line/60 bg-smoke/40 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} hue={c.avatarHue} size={28} />
                      <div>
                        <p className="font-semibold text-zinc-100">{c.name}</p>
                        <p className="font-mono text-[10px] text-volt">
                          {c.code || `KCM${String(c.id).padStart(4, "0")}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-200">
                        {c.remaining} sessions left
                      </p>
                      <span className={`text-[10px] ${c.active ? "text-emerald-400" : "text-zinc-500"}`}>
                        {c.active ? "● Active Plan" : "○ Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-line/60 p-5 text-center text-xs text-zinc-500">
                No PT clients currently assigned to {coach.name}.
                <br />
                You can assign members to this coach in the Members Directory.
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <div className="flex items-center gap-2">
            <ResetPasswordBtn userId={coach.id} userName={coach.name} />
            <DeleteUserBtn userId={coach.id} userName={coach.name} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-carbon px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-smoke hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReadOnlyMembersTable({
  rows,
}: {
  rows: MemberRowData[];
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              <th className="py-2.5 pr-3">Member ID</th>
              <th className="py-2.5 pr-4">Member</th>
              <th className="py-2.5 pr-4">Plan</th>
              <th className="py-2.5 pr-4">Sessions Remaining</th>
              <th className="py-2.5 pr-4">Adjusted End</th>
              <th className="py-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 6).map((r) => (
              <tr key={r.user.id} className="border-b border-line/60 align-middle">
                <td className="py-2.5 pr-3">
                  <span className="inline-flex items-center rounded-md border border-volt/30 bg-volt/10 px-2 py-0.5 font-mono text-[11px] font-bold text-volt">
                    {r.user.code || `KCM${String(r.user.id).padStart(4, "0")}`}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.user.name} hue={r.user.avatarHue} size={30} />
                    <div>
                      <p className="font-medium text-zinc-200">{r.user.name}</p>
                      <p className="text-[11px] text-zinc-500">{r.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  {r.membership ? (
                    <Chip tone={r.membership.plan === "pt" ? "blue" : "volt"}>
                      {r.membership.plan === "pt" ? "PT" : "Normal"}
                    </Chip>
                  ) : (
                    <Chip tone="zinc">—</Chip>
                  )}
                </td>
                <td className="py-2.5 pr-4">
                  {r.sub ? (
                    <div className="w-32">
                      <p className="mb-1 text-xs text-zinc-400">
                        <span className="font-semibold text-zinc-200">{r.sub.remaining}</span> / {r.sub.totalDays} left
                      </p>
                      <div className="h-1.5 overflow-hidden rounded-full bg-smoke">
                        <div
                          className={`h-full rounded-full ${r.sub.active ? "bg-volt" : "bg-zinc-600"}`}
                          style={{ width: `${r.sub.pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600">no plan</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-xs text-zinc-400">
                  {r.sub ? r.sub.endDate : "—"}
                </td>
                <td className="py-2.5 text-right">
                  {r.sub?.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-400" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-smoke px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                      Inactive
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href="/admin/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-volt hover:text-volt-dim transition-colors"
        >
          Manage All Members ({rows.length}) <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export function ReadOnlyCoachesTable({
  coaches,
}: {
  coaches: CoachDetailData[];
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              <th className="py-2.5 pr-3">Coach ID</th>
              <th className="py-2.5 pr-4">Coach</th>
              <th className="py-2.5 pr-4">Specialty</th>
              <th className="py-2.5 text-right">PT Clients</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((c) => (
              <tr key={c.id} className="border-b border-line/60 align-middle">
                <td className="py-2.5 pr-3">
                  <span className="inline-flex items-center rounded-md border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-300">
                    {c.code || `KCC${String(c.id).padStart(4, "0")}`}
                  </span>
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} hue={c.avatarHue} size={30} />
                    <div>
                      <p className="font-medium text-zinc-200">{c.name}</p>
                      <p className="text-[11px] text-zinc-500">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <Chip tone="blue">{c.specialty || "Coach"}</Chip>
                </td>
                <td className="py-2.5 text-right font-semibold text-zinc-300 text-xs">
                  {c.clientsCount} active
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href="/admin/coaches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
        >
          Manage All Coaches ({coaches.length}) <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export function RenewalsManager({
  rows,
}: {
  rows: MemberRowData[];
}) {
  const [tab, setTab] = useState<"urgent" | "soon" | "active" | "all">("urgent");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (r.user.code && r.user.code.toLowerCase().includes(q)) ||
        r.user.name.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const remaining = r.sub?.remaining ?? 99;
      if (tab === "urgent") return r.sub?.active && remaining <= 3;
      if (tab === "soon") return r.sub?.active && remaining <= 7;
      if (tab === "active") return r.sub?.active;
      return true;
    });
  }, [rows, tab, search]);

  const urgentCount = useMemo(() => rows.filter((r) => r.sub?.active && (r.sub?.remaining ?? 99) <= 3).length, [rows]);
  const soonCount = useMemo(() => rows.filter((r) => r.sub?.active && (r.sub?.remaining ?? 99) <= 7).length, [rows]);
  const activeCount = useMemo(() => rows.filter((r) => r.sub?.active).length, [rows]);

  return (
    <div>
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
            placeholder="Search renewals by Member ID (e.g. KCM0001) or name…"
            className="w-full rounded-xl border border-line bg-carbon py-2.5 pl-10 pr-9 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
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
            onClick={() => setTab("urgent")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === "urgent"
                ? "bg-amber-400 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Expiring ≤3d ({urgentCount})
          </button>
          <button
            onClick={() => setTab("soon")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === "soon"
                ? "bg-volt text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Expiring ≤7d ({soonCount})
          </button>
          <button
            onClick={() => setTab("active")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === "active"
                ? "bg-zinc-200 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Active ({activeCount})
          </button>
          <button
            onClick={() => setTab("all")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === "all"
                ? "bg-zinc-200 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Members ({rows.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              <th className="py-2.5 pr-3">Member ID</th>
              <th className="py-2.5 pr-4">Member</th>
              <th className="py-2.5 pr-4">Plan</th>
              <th className="py-2.5 pr-4">Sessions Remaining</th>
              <th className="py-2.5 pr-4">Cycle End Date</th>
              <th className="py-2.5 pr-4">Buffer</th>
              <th className="py-2.5 text-right">Quick Renewal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const remaining = r.sub?.remaining ?? 0;
              const isUrgent = r.sub?.active && remaining <= 3;
              return (
                <tr key={r.user.id} className="border-b border-line/60 align-middle">
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center rounded-md border border-volt/30 bg-volt/10 px-2 py-0.5 font-mono text-[11px] font-bold text-volt">
                      {r.user.code || `KCM${String(r.user.id).padStart(4, "0")}`}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.user.name} hue={r.user.avatarHue} size={32} />
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
                      <Chip tone="zinc">None</Chip>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {r.sub ? (
                      <div className="w-36">
                        <p className={`mb-1 text-xs font-semibold ${isUrgent ? "text-amber-400" : "text-zinc-200"}`}>
                          {r.sub.remaining} / {r.sub.totalDays} sessions left
                        </p>
                        <div className="h-1.5 overflow-hidden rounded-full bg-smoke">
                          <div
                            className={`h-full rounded-full ${
                              isUrgent ? "bg-amber-400" : r.sub.active ? "bg-volt" : "bg-zinc-600"
                            }`}
                            style={{ width: `${r.sub.pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">Expired</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-xs font-medium text-zinc-300">
                    {r.sub ? r.sub.endDate : "—"}
                  </td>
                  <td className="py-3 pr-4 text-xs text-zinc-500">
                    {r.sub ? `+${r.sub.absent}d absent` : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <RenewForm memberId={r.user.id} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                  No subscriptions found matching the selected criteria.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RevenueManager({
  payments,
}: {
  payments: {
    payment: {
      id: number;
      userId: number;
      amount: number;
      plan: string;
      method: string;
      createdAt: Date;
    };
    name: string;
    code?: string | null;
  }[];
}) {
  const [methodFilter, setMethodFilter] = useState<"all" | "UPI" | "Cash" | "Card">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        String(p.payment.amount).includes(q);

      if (!matchesSearch) return false;
      if (methodFilter !== "all" && p.payment.method !== methodFilter) return false;
      return true;
    });
  }, [payments, methodFilter, search]);

  const totalAmount = useMemo(() => payments.reduce((acc, p) => acc + p.payment.amount, 0), [payments]);
  const upiTotal = useMemo(
    () => payments.filter((p) => p.payment.method === "UPI").reduce((acc, p) => acc + p.payment.amount, 0),
    [payments]
  );
  const cashTotal = useMemo(
    () => payments.filter((p) => p.payment.method === "Cash").reduce((acc, p) => acc + p.payment.amount, 0),
    [payments]
  );
  const cardTotal = useMemo(
    () => payments.filter((p) => p.payment.method === "Card").reduce((acc, p) => acc + p.payment.amount, 0),
    [payments]
  );

  return (
    <div>
      {/* Revenue Breakdown by Method */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        <div className="rounded-xl border border-line bg-smoke/60 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">Total Collected</p>
          <p className="mt-1 font-display text-2xl font-bold text-volt">₹{totalAmount.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-zinc-500">{payments.length} transactions</p>
        </div>
        <div className="rounded-xl border border-sky-400/30 bg-sky-400/5 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-sky-400 uppercase flex items-center gap-1">
            <QrCode size={12} /> UPI Payments
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-sky-300">₹{upiTotal.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-zinc-500">
            {payments.filter((p) => p.payment.method === "UPI").length} payments
          </p>
        </div>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase flex items-center gap-1">
            <Banknote size={12} /> Cash Payments
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-300">₹{cashTotal.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-zinc-500">
            {payments.filter((p) => p.payment.method === "Cash").length} payments
          </p>
        </div>
        <div className="rounded-xl border border-purple-400/30 bg-purple-400/5 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-purple-400 uppercase flex items-center gap-1">
            <CreditCard size={12} /> Card / POS
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-purple-300">₹{cardTotal.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-zinc-500">
            {payments.filter((p) => p.payment.method === "Card").length} payments
          </p>
        </div>
      </div>

      {/* Filter and Search */}
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
            placeholder="Search transactions by member name or amount…"
            className="w-full rounded-xl border border-line bg-carbon py-2.5 pl-10 pr-9 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
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
            onClick={() => setMethodFilter("all")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              methodFilter === "all"
                ? "bg-zinc-200 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Methods
          </button>
          <button
            onClick={() => setMethodFilter("UPI")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              methodFilter === "UPI"
                ? "bg-sky-400 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            UPI
          </button>
          <button
            onClick={() => setMethodFilter("Cash")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              methodFilter === "Cash"
                ? "bg-emerald-400 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Cash
          </button>
          <button
            onClick={() => setMethodFilter("Card")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              methodFilter === "Card"
                ? "bg-purple-400 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Card
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
              <th className="py-2.5 pr-4">Tx ID</th>
              <th className="py-2.5 pr-4">Member</th>
              <th className="py-2.5 pr-4">Plan Type</th>
              <th className="py-2.5 pr-4">Payment Method</th>
              <th className="py-2.5 pr-4">Date & Time</th>
              <th className="py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ payment, name, code }) => (
              <tr key={payment.id} className="border-b border-line/60 align-middle">
                <td className="py-2.5 pr-4 font-mono text-xs text-zinc-500">
                  #{String(payment.id).padStart(5, "0")}
                </td>
                <td className="py-2.5 pr-4">
                  <div>
                    <p className="font-medium text-zinc-200">{name}</p>
                    {code ? <p className="font-mono text-[10px] text-volt">{code}</p> : null}
                  </div>
                </td>
                <td className="py-2.5 pr-4">
                  <Chip tone={payment.plan === "pt" ? "blue" : "volt"}>
                    {payment.plan === "pt" ? "Personal Training" : "Normal"}
                  </Chip>
                </td>
                <td className="py-2.5 pr-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      payment.method === "Cash"
                        ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : payment.method === "Card"
                        ? "border border-purple-400/30 bg-purple-400/10 text-purple-300"
                        : "border border-sky-400/30 bg-sky-400/10 text-sky-300"
                    }`}
                  >
                    {payment.method}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-xs text-zinc-400">
                  {new Date(payment.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-2.5 text-right font-display text-base font-bold text-volt">
                  ₹{payment.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-zinc-500">
                  No payment transactions found matching the filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PENDING MEMBERS MANAGER (New Joins & Payment Activation Hub)
// -------------------------------------------------------------
export type PendingMemberRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  durationDays: number;
  goal: string | null;
  level: string | null;
  authProvider: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  createdAt: string;
  approvedAt?: string | null;
};

export function PendingMembersManager({
  initialApplications,
  trainers,
}: {
  initialApplications: PendingMemberRow[];
  trainers: { id: number; name: string; specialty: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending");
  const [search, setSearch] = useState("");
  const [activeModalMember, setActiveModalMember] = useState<PendingMemberRow | null>(null);

  // Activation Form State inside Modal
  const [actPlan, setActPlan] = useState<"normal" | "pt">("normal");
  const [actDays, setActDays] = useState(90);
  const [actPrice, setActPrice] = useState(6500);
  const [actMethod, setActMethod] = useState<"UPI" | "Cash" | "Card">("UPI");
  const [actCoachId, setActCoachId] = useState<number | undefined>(undefined);
  const [actPassword, setActPassword] = useState("");
  const [actSendEmail, setActSendEmail] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState<{
    code: string;
    password: string;
    email: string;
    phone: string;
    name: string;
    emailSent: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Pre-fill form when activating an applicant
  const openActivationModal = (m: PendingMemberRow) => {
    setActiveModalMember(m);
    setActivationSuccess(null);
    setModalError("");
    setActPlan(m.plan === "pt" ? "pt" : "normal");
    setActDays(m.durationDays || 30);
    // calculate default price
    const defaultPrices: Record<number, number> = {
      30: m.plan === "pt" ? 8000 : 2500,
      90: 6500,
      180: 11000,
      365: 19000,
    };
    setActPrice(defaultPrices[m.durationDays] || 2500);
    setActMethod("UPI");
    setActCoachId(undefined);
    setActPassword(`KC${Math.floor(100000 + Math.random() * 900000)}`);
    setActSendEmail(true);
  };

  const handleConfirmActivation = async () => {
    if (!activeModalMember) return;
    setIsSubmitting(true);
    setModalError("");

    try {
      const res = await approvePendingMemberAction({
        pendingId: activeModalMember.id,
        plan: actPlan,
        durationDays: actDays,
        price: actPrice,
        paymentMethod: actMethod,
        coachId: actCoachId,
        password: actPassword,
        sendEmail: actSendEmail,
      });

      if (!res.ok) {
        setModalError(res.error || "Failed to activate member");
        setIsSubmitting(false);
        return;
      }

      setActivationSuccess({
        code: res.code || "KCM....",
        password: res.password || actPassword,
        email: res.email || activeModalMember.email,
        phone: res.phone || activeModalMember.phone,
        name: res.name || activeModalMember.name,
        emailSent: res.emailSent || false,
      });
      router.refresh();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Activation error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this registration application?")) return;
    await rejectPendingMemberAction(id);
    router.refresh();
  };

  const copyCreds = () => {
    if (!activationSuccess) return;
    const text = `Welcome to KC Fitness Hub!\n\nMember ID: ${activationSuccess.code}\nRegistered Email: ${activationSuccess.email}\nPassword: ${activationSuccess.password}\n\nLogin: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = useMemo(() => {
    return initialApplications.filter((m) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (tab === "pending") return m.status === "pending";
      if (tab === "approved") return m.status === "approved";
      return true;
    });
  }, [initialApplications, search, tab]);

  const pendingCount = useMemo(
    () => initialApplications.filter((m) => m.status === "pending").length,
    [initialApplications]
  );
  const approvedCount = useMemo(
    () => initialApplications.filter((m) => m.status === "approved").length,
    [initialApplications]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
            Pending Member Onboarding
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Incoming registrations via website (Google Auth & Manual). Collect payment, approve, and send auto welcome credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-bold text-amber-300">
            <Clock size={13} /> {pendingCount} Awaiting Payment
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
            <CheckCircle2 size={13} /> {approvedCount} Activated
          </span>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone number…"
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
            onClick={() => setTab("pending")}
            className={`rounded-lg px-3 py-1.5 font-bold transition-colors ${
              tab === "pending"
                ? "bg-amber-400 text-carbon"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Pending Payment ({pendingCount})
          </button>
          <button
            onClick={() => setTab("approved")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === "approved"
                ? "bg-emerald-500 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setTab("all")}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === "all"
                ? "bg-zinc-200 text-carbon font-bold"
                : "border border-line bg-smoke/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({initialApplications.length})
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-smoke/40">
        <table className="w-full min-w-[850px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase bg-carbon/50">
              <th className="py-3 pl-4 pr-3">Applicant</th>
              <th className="py-3 pr-4">Contact</th>
              <th className="py-3 pr-4">Requested Plan</th>
              <th className="py-3 pr-4">Fitness Goal</th>
              <th className="py-3 pr-4">Applied</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-line/60 align-middle hover:bg-smoke/70 transition-colors">
                {/* Applicant Name & Provider */}
                <td className="py-3 pl-4 pr-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} hue={m.authProvider === "google" ? 210 : 80} size={34} />
                    <div>
                      <p className="font-semibold text-zinc-100 flex items-center gap-1.5">
                        {m.name}
                        {m.authProvider === "google" ? (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/20"
                            title="Verified Google Account"
                          >
                            Google
                          </span>
                        ) : (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                            Manual
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-zinc-500">App #{m.id}</p>
                    </div>
                  </div>
                </td>

                {/* Contact: Email & Phone */}
                <td className="py-3 pr-4 text-xs">
                  <p className="text-zinc-300 font-mono text-[11px]">{m.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <a
                      href={`tel:${m.phone}`}
                      className="font-mono text-xs font-semibold text-volt hover:underline flex items-center gap-1"
                    >
                      <Phone size={10} />
                      {m.phone}
                    </a>
                    <a
                      href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20"
                      title="Chat on WhatsApp"
                    >
                      WhatsApp
                    </a>
                  </div>
                </td>

                {/* Requested Plan */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5">
                    <Chip tone={m.plan === "pt" ? "blue" : "volt"}>
                      {m.durationDays}d {m.plan === "pt" ? "PT" : "General"}
                    </Chip>
                  </div>
                  {m.notes ? (
                    <p className="mt-1 text-[11px] text-zinc-400 italic line-clamp-1 max-w-xs">
                      &quot;{m.notes}&quot;
                    </p>
                  ) : null}
                </td>

                {/* Fitness Goal & Level */}
                <td className="py-3 pr-4 text-xs">
                  <span className="capitalize font-medium text-zinc-200">
                    {m.goal || "Recomposition"}
                  </span>
                  <p className="text-[10px] text-zinc-500 capitalize">{m.level || "Beginner"}</p>
                </td>

                {/* Applied Date */}
                <td className="py-3 pr-4 text-xs text-zinc-400 font-mono">
                  {m.createdAt}
                </td>

                {/* Status */}
                <td className="py-3 pr-4">
                  {m.status === "pending" ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      <Clock size={11} /> Awaiting Payment
                    </span>
                  ) : m.status === "approved" ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      <CheckCircle2 size={11} /> Activated
                    </span>
                  ) : (
                    <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                      Rejected
                    </span>
                  )}
                </td>

                {/* Action */}
                <td className="py-3 pr-4 text-right">
                  {m.status === "pending" ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openActivationModal(m)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-volt px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-carbon hover:bg-volt-dim transition-all shadow-[0_0_15px_rgba(204,255,0,0.25)] active:scale-95"
                      >
                        <Zap size={13} />
                        Approve & Activate
                      </button>
                      <button
                        onClick={() => handleReject(m.id)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:text-red-400 hover:bg-smoke"
                        title="Reject application"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Completed
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-xs text-zinc-500">
                  No applications found in this category.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* ---------------- ACTIVATION & PAYMENT MODAL ---------------- */}
      {activeModalMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setActiveModalMember(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-volt/30 bg-smoke p-6 shadow-2xl shadow-black/90"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveModalMember(null)}
              className="absolute right-4 top-4 rounded-lg border border-line bg-carbon p-1.5 text-zinc-400 hover:text-zinc-100"
            >
              <X size={16} />
            </button>

            {!activationSuccess ? (
              <div>
                <div className="flex items-center gap-3 border-b border-line pb-4 mb-5">
                  <div className="grid size-11 place-items-center rounded-2xl bg-volt/20 border border-volt/30 text-volt">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
                      Confirm Payment & Activate
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {activeModalMember.name} · {activeModalMember.phone}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Plan & Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                        Membership Plan
                      </label>
                      <select
                        value={actPlan}
                        onChange={(e) => {
                          const p = e.target.value as "normal" | "pt";
                          setActPlan(p);
                          if (p === "pt") setActPrice(8000);
                          else setActPrice(actDays === 30 ? 2500 : actDays === 90 ? 6500 : 11000);
                        }}
                        className={inputCls}
                      >
                        <option value="normal">General Fitness</option>
                        <option value="pt">Personal Training (PT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                        Attended Days Promised
                      </label>
                      <select
                        value={actDays}
                        onChange={(e) => {
                          const d = Number(e.target.value);
                          setActDays(d);
                          if (actPlan === "pt") setActPrice(8000);
                          else {
                            if (d === 30) setActPrice(2500);
                            else if (d === 90) setActPrice(6500);
                            else if (d === 180) setActPrice(11000);
                            else if (d === 365) setActPrice(19000);
                          }
                        }}
                        className={inputCls}
                      >
                        <option value={30}>30 Days (1 Month)</option>
                        <option value={90}>90 Days (3 Months)</option>
                        <option value={180}>180 Days (6 Months)</option>
                        <option value={365}>365 Days (1 Year)</option>
                      </select>
                    </div>
                  </div>

                  {/* Price & Payment Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                        Payment Collected (₹ INR) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={actPrice}
                        onChange={(e) => setActPrice(Number(e.target.value))}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={actMethod}
                        onChange={(e) => setActMethod(e.target.value as "UPI" | "Cash" | "Card")}
                        className={inputCls}
                      >
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Cash">Cash at Desk</option>
                        <option value="Card">Card Swipe / POS</option>
                      </select>
                    </div>
                  </div>

                  {/* Assign Coach (Optional) */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                      Assigned Coach (Optional)
                    </label>
                    <select
                      value={actCoachId ?? ""}
                      onChange={(e) => setActCoachId(e.target.value ? Number(e.target.value) : undefined)}
                      className={inputCls}
                    >
                      <option value="">No dedicated coach (Gym Floor Trainer)</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto-generated Password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                      Initial Login Password
                    </label>
                    <input
                      type="text"
                      value={actPassword}
                      onChange={(e) => setActPassword(e.target.value)}
                      className={inputCls}
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">
                      User ID (e.g. KCM0004) will be generated automatically and emailed along with this password.
                    </p>
                  </div>

                  {/* Checkbox: Auto Welcome Email */}
                  <label className="flex items-center gap-2.5 rounded-xl border border-line bg-carbon/50 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actSendEmail}
                      onChange={(e) => setActSendEmail(e.target.checked)}
                      className="size-4 accent-volt rounded"
                    />
                    <div>
                      <span className="font-semibold text-zinc-200">
                        Auto-dispatch welcome email with User ID & password
                      </span>
                      <p className="text-[11px] text-zinc-500">
                        Sends a branded credentials email to {activeModalMember.email}.
                      </p>
                    </div>
                  </label>

                  {modalError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
                      {modalError}
                    </div>
                  )}

                  <button
                    onClick={handleConfirmActivation}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-volt py-3.5 text-xs font-extrabold uppercase tracking-wider text-carbon hover:bg-volt-dim transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle size={15} className="animate-spin" />
                        Activating & Sending Email...
                      </>
                    ) : (
                      <>
                        <Check size={16} strokeWidth={3} />
                        Confirm ₹{actPrice.toLocaleString("en-IN")} Payment & Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Success Celebration State */
              <div className="text-center py-4 space-y-5">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-mono text-xs font-bold text-emerald-400 uppercase">
                    Member Activated Successfully
                  </span>
                  <h3 className="font-display text-2xl font-black uppercase text-white mt-2">
                    {activationSuccess.name}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Account created and payment logged into KC Fitness Hub ledger.
                  </p>
                </div>

                {/* Generated Credentials Card */}
                <div className="rounded-2xl border border-line bg-carbon p-4 text-left text-xs space-y-2.5">
                  <div className="flex justify-between items-center py-1 border-b border-line/60">
                    <span className="text-zinc-500 font-semibold uppercase text-[10px]">Official Member ID</span>
                    <span className="font-mono text-sm font-bold text-volt">{activationSuccess.code}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-line/60">
                    <span className="text-zinc-500 font-semibold uppercase text-[10px]">Registered Email</span>
                    <span className="font-mono text-zinc-200">{activationSuccess.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-line/60">
                    <span className="text-zinc-500 font-semibold uppercase text-[10px]">Initial Password</span>
                    <span className="font-mono font-bold text-white bg-smoke px-2 py-0.5 rounded">{activationSuccess.password}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500 font-semibold uppercase text-[10px]">Welcome Email</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <Mail size={12} />
                      {activationSuccess.emailSent ? "Dispatched to Inbox" : "Rendered & Logged"}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={copyCreds}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-line bg-smoke py-2.5 text-xs font-bold text-zinc-200 hover:text-white hover:bg-smoke/80"
                  >
                    {copied ? <Check size={14} className="text-volt" /> : <Copy size={14} />}
                    {copied ? "Copied to Clipboard" : "Copy Credentials"}
                  </button>

                  <a
                    href={`https://wa.me/${activationSuccess.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Welcome to KC Fitness Hub, ${activationSuccess.name}!\n\nYour membership is active!\nMember ID: ${activationSuccess.code}\nPassword: ${activationSuccess.password}\nLogin: ${window.location.origin}/login\n\nSee you on the gym floor!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold uppercase text-black hover:bg-emerald-400"
                  >
                    <MessageCircle size={14} />
                    Send via WhatsApp
                  </a>
                </div>

                <button
                  onClick={() => setActiveModalMember(null)}
                  className="w-full text-xs text-zinc-400 hover:text-zinc-200 py-1"
                >
                  Done & Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

