import { requireRole } from "@/lib/auth";
import {
  getAllMembers,
  getAllMemberships,
  getAllAttendance,
  getAllPayments,
  getAllTrainers,
  getAdminInbox,
  revenueByMonth,
  attendanceLast7,
  getCheckinsOn,
} from "@/lib/data";
import { db } from "@/db";
import { coachAssignments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { computeSubscription } from "@/lib/subscription";
import {
  inr,
  monthKey,
  monthLabel,
  prettyDate,
  prettyDateTime,
  todayDateString,
  weekdayShort,
} from "@/lib/dates";
import { PageHead, Card, Stat, Chip, Avatar } from "@/components/ui";
import { RevenueChart, SplitChart } from "@/components/charts";
import {
  DismissBtn,
  ReadOnlyMembersTable,
  ReadOnlyCoachesTable,
} from "./admin-client";
import Link from "next/link";
import {
  Users,
  Award,
  UserPlus,
  RotateCcw,
  CreditCard,
  ArrowRight,
  Activity,
  Flame,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole("admin");
  const today = todayDateString();

  const [
    members,
    membershipsAll,
    attendanceAll,
    paymentsAll,
    trainers,
    inbox,
    revenueRaw,
    weeklyRaw,
    todayCheckins,
    assignments,
  ] = await Promise.all([
    getAllMembers(),
    getAllMemberships(),
    getAllAttendance(),
    getAllPayments(),
    getAllTrainers(),
    getAdminInbox(),
    revenueByMonth(6),
    attendanceLast7(),
    getCheckinsOn(today),
    db.select().from(coachAssignments).orderBy(desc(coachAssignments.createdAt)),
  ]);

  // ---- per-member computed rows ----
  const attendanceByUser = new Map<number, string[]>();
  for (const a of attendanceAll) {
    const list = attendanceByUser.get(a.userId) ?? [];
    list.push(a.date);
    attendanceByUser.set(a.userId, list);
  }
  const membershipByUser = new Map<number, (typeof membershipsAll)[number]>();
  for (const m of membershipsAll) {
    if (!membershipByUser.has(m.userId)) membershipByUser.set(m.userId, m);
  }
  const coachByMember = new Map(assignments.map((a) => [a.memberId, a.trainerId]));

  const rows = members.map((u) => {
    const ms = membershipByUser.get(u.id) ?? null;
    const sub = ms ? computeSubscription(ms, attendanceByUser.get(u.id) ?? [], today) : null;
    const coachId = coachByMember.get(u.id) ?? null;
    const assignedCoach = coachId ? trainers.find((t) => t.id === coachId) : null;
    const userPayment = paymentsAll.find((p) => p.payment.userId === u.id);

    return {
      user: {
        id: u.id,
        code: u.code,
        name: u.name,
        email: u.email,
        avatarHue: u.avatarHue,
        goal: u.goal,
        level: u.level,
        createdAt: prettyDate(u.createdAt),
      },
      membership: ms,
      sub: sub
        ? {
            active: sub.active,
            remaining: sub.remaining,
            totalDays: sub.totalDays,
            pct: sub.pct,
            endDate: prettyDate(sub.endDate),
            absent: sub.absent,
          }
        : null,
      coachId,
      coachName: assignedCoach?.name ?? null,
      coachCode: assignedCoach?.code ?? null,
      coachSpecialty: assignedCoach?.specialty ?? null,
      attendanceCount: (attendanceByUser.get(u.id) ?? []).length,
      latestPayment: userPayment
        ? {
            amount: userPayment.payment.amount,
            method: userPayment.payment.method,
            plan: userPayment.payment.plan,
            date: prettyDateTime(userPayment.payment.createdAt),
          }
        : null,
    };
  });

  const activeRows = rows.filter((r) => r.sub?.active);
  const ptRows = rows.filter((r) => r.membership?.plan === "pt" && r.sub?.active);
  const normalRows = rows.filter((r) => r.membership?.plan === "normal" && r.sub?.active);
  const expiringSoon = activeRows.filter((r) => (r.sub?.remaining ?? 99) <= 3).length;

  const revenueThisMonth = paymentsAll
    .filter((p) => monthKey(p.payment.createdAt) === monthKey(new Date()))
    .reduce((a, p) => a + p.payment.amount, 0);
  const revenueTotal = paymentsAll.reduce((a, p) => a + p.payment.amount, 0);
  const ptRevenue = paymentsAll
    .filter((p) => p.payment.plan === "pt")
    .reduce((a, p) => a + p.payment.amount, 0);

  const revenueData = revenueRaw.map((b) => ({
    label: monthLabel(b.key),
    normal: b.normal,
    pt: b.pt,
  }));
  const splitData = [
    { name: "Normal", value: normalRows.length },
    { name: "Personal Training", value: ptRows.length },
  ].filter((d) => d.value > 0);

  const coachRows = trainers.map((t) => {
    const assignedMembers = rows
      .filter((r) => r.coachId === t.id)
      .map((r) => ({
        id: r.user.id,
        code: r.user.code,
        name: r.user.name,
        email: r.user.email,
        avatarHue: r.user.avatarHue,
        plan: r.membership?.plan ?? "pt",
        remaining: r.sub?.remaining ?? 0,
        active: r.sub?.active ?? false,
      }));

    return {
      id: t.id,
      code: t.code,
      name: t.name,
      email: t.email,
      specialty: t.specialty,
      avatarHue: t.avatarHue,
      createdAt: prettyDate(t.createdAt),
      clientsCount: assignedMembers.length,
      clients: assignedMembers,
    };
  });
  const requests = inbox.filter((m) => m.body.includes("::"));

  return (
    <div>
      <PageHead
        eyebrow="Admin"
        title="Control Room"
        sub="Executive overview of KC Fitness Hub — read-only operations dashboard and high-level analytics."
      />

      {/* Quick Navigation Cards to Subsections */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 mb-5">
        <Link
          href="/admin/members"
          className="group flex flex-col justify-between rounded-xl border border-line bg-smoke/60 p-3.5 hover:border-volt/50 hover:bg-smoke transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-volt transition-colors">
              Members
            </span>
            <Users size={16} className="text-volt" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl font-bold text-zinc-100">{members.length}</p>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 inline-flex items-center gap-0.5">
              Manage <ArrowRight size={11} />
            </span>
          </div>
        </Link>

        <Link
          href="/admin/coaches"
          className="group flex flex-col justify-between rounded-xl border border-line bg-smoke/60 p-3.5 hover:border-sky-400/50 hover:bg-smoke transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-sky-300 transition-colors">
              Coaches
            </span>
            <Award size={16} className="text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl font-bold text-zinc-100">{trainers.length}</p>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 inline-flex items-center gap-0.5">
              Roster <ArrowRight size={11} />
            </span>
          </div>
        </Link>

        <Link
          href="/admin/add"
          className="group flex flex-col justify-between rounded-xl border border-line bg-smoke/60 p-3.5 hover:border-emerald-400/50 hover:bg-smoke transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-emerald-300 transition-colors">
              Registration
            </span>
            <UserPlus size={16} className="text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-xl font-bold text-emerald-300">Add New</p>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 inline-flex items-center gap-0.5">
              Portal <ArrowRight size={11} />
            </span>
          </div>
        </Link>

        <Link
          href="/admin/renewals"
          className="group flex flex-col justify-between rounded-xl border border-line bg-smoke/60 p-3.5 hover:border-amber-400/50 hover:bg-smoke transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-amber-300 transition-colors">
              Renewals
            </span>
            <RotateCcw size={16} className="text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-2xl font-bold text-amber-300">{expiringSoon}</p>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 inline-flex items-center gap-0.5">
              Expiring <ArrowRight size={11} />
            </span>
          </div>
        </Link>

        <Link
          href="/admin/revenue"
          className="group flex flex-col justify-between rounded-xl border border-line bg-smoke/60 p-3.5 hover:border-purple-400/50 hover:bg-smoke transition-all col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-purple-300 transition-colors">
              Revenue
            </span>
            <CreditCard size={16} className="text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-xl font-bold text-volt">{inr(revenueThisMonth)}</p>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 inline-flex items-center gap-0.5">
              Ledger <ArrowRight size={11} />
            </span>
          </div>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total Members" value={members.length} sub={`${activeRows.length} active plans`} />
        <Stat label="PT Clients" value={ptRows.length} accent sub="Coached members" />
        <Stat label="Coaches" value={trainers.length} sub="Active on roster" />
        <Stat label="Checked in today" value={todayCheckins.length} sub="Live attendance" />
        <Stat label="Revenue (month)" value={inr(revenueThisMonth)} accent sub={inr(revenueTotal) + " lifetime"} />
        <Stat label="Expiring ≤3d" value={expiringSoon} sub="Sessions remaining" />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide uppercase">Revenue Trend — 6 months</h3>
            <div className="flex gap-3 text-[10px] font-semibold tracking-widest uppercase">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="size-2 rounded-full bg-volt" /> Memberships
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="size-2 rounded-full bg-sky-400" /> PT
              </span>
            </div>
          </div>
          <RevenueChart data={revenueData} />
        </Card>
        <Card>
          <h3 className="font-display mb-2 text-xl tracking-wide uppercase">Plan Mix</h3>
          <SplitChart data={splitData.length ? splitData : [{ name: "No active plans", value: 1 }]} />
          <p className="mt-2 text-center text-xs text-zinc-500">
            PT revenue share:{" "}
            <span className="font-semibold text-sky-300">
              {revenueTotal ? Math.round((ptRevenue / revenueTotal) * 100) : 0}%
            </span>
          </p>
        </Card>
      </div>

      {/* Attendance & Requests */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide uppercase">
              Live Check-Ins Today ({todayCheckins.length})
            </h3>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="size-2 rounded-full bg-volt animate-pulse" />
              Live Gym Floor
            </span>
          </div>
          {todayCheckins.length === 0 ? (
            <p className="text-xs text-zinc-500">No member check-ins recorded yet today.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todayCheckins.slice(0, 9).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-smoke/40 p-2.5 text-xs"
                >
                  <Avatar name={c.name} hue={c.hue} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-200">{c.name}</p>
                    <p className="font-mono text-[10px] text-zinc-500">
                      {new Date(c.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide uppercase">Inbox & Requests</h3>
            <Chip tone="zinc">{requests.length}</Chip>
          </div>
          {requests.length === 0 ? (
            <p className="text-xs text-zinc-500">No pending member or trainer requests.</p>
          ) : (
            <ul className="space-y-2">
              {requests.slice(0, 4).map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-carbon p-3">
                  <div>
                    <p className="text-xs leading-relaxed text-zinc-300">{m.body.replace(" :: ", " — ")}</p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      {m.fromName} · {prettyDateTime(m.createdAt)}
                    </p>
                  </div>
                  <DismissBtn id={m.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Read-Only Members Overview */}
      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl tracking-wide uppercase">
              Members Overview (Read-Only)
            </h3>
            <p className="text-xs text-zinc-500">
              Active subscriptions & progress snapshot. To edit, renew, or manage members, open the Members Directory.
            </p>
          </div>
          <Link
            href="/admin/members"
            className="inline-flex items-center gap-1.5 rounded-lg border border-volt/30 bg-volt/10 px-3 py-1.5 text-xs font-bold text-volt hover:bg-volt/20 transition-all"
          >
            Open Members Directory <ArrowRight size={12} />
          </Link>
        </div>
        <ReadOnlyMembersTable rows={rows} />
      </Card>

      {/* Read-Only Coaches Overview */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl tracking-wide uppercase">
                Coaches Roster (Read-Only)
              </h3>
              <p className="text-xs text-zinc-500">
                Staff credentials and active student ratios. To manage coaches or specialties, visit Coaches Roster.
              </p>
            </div>
            <Link
              href="/admin/coaches"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-400/20 transition-all"
            >
              Open Coaches Roster <ArrowRight size={12} />
            </Link>
          </div>
          <ReadOnlyCoachesTable coaches={coachRows} />
        </Card>

        {/* Recent Transactions */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide uppercase">Recent Payments</h3>
            <Link
              href="/admin/revenue"
              className="text-xs font-semibold text-volt hover:text-volt-dim transition-colors"
            >
              All →
            </Link>
          </div>
          <div className="space-y-2.5">
            {paymentsAll.slice(0, 5).map(({ payment, name }) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl border border-line bg-carbon p-3 text-xs"
              >
                <div>
                  <p className="font-medium text-zinc-200">{name}</p>
                  <p className="text-[10px] text-zinc-500">
                    {payment.method} · {payment.plan === "pt" ? "Personal Training" : "Gym Access"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-volt text-sm">{inr(payment.amount)}</p>
                  <p className="text-[10px] text-zinc-500">{prettyDate(payment.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
