import { requireRole } from "@/lib/auth";
import {
  getAllMembers,
  getAllMemberships,
  getAllAttendance,
  getAllPayments,
  getAllTrainers,
} from "@/lib/data";
import { computeSubscription } from "@/lib/subscription";
import { prettyDate, prettyDateTime, todayDateString } from "@/lib/dates";
import { PageHead, Card } from "@/components/ui";
import { RenewalsManager } from "../admin-client";
import { RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RenewalsPage() {
  await requireRole("admin");
  const today = todayDateString();

  const [members, membershipsAll, attendanceAll, paymentsAll, trainers] = await Promise.all([
    getAllMembers(),
    getAllMemberships(),
    getAllAttendance(),
    getAllPayments(),
    getAllTrainers(),
  ]);

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

  const rows = members.map((u) => {
    const ms = membershipByUser.get(u.id) ?? null;
    const sub = ms ? computeSubscription(ms, attendanceByUser.get(u.id) ?? [], today) : null;
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
      coachId: null,
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

  const expiringSoon = rows.filter((r) => r.sub?.active && (r.sub?.remaining ?? 99) <= 3).length;
  const expiringWeek = rows.filter((r) => r.sub?.active && (r.sub?.remaining ?? 99) <= 7).length;
  const expiredCount = rows.filter((r) => !r.sub?.active).length;

  return (
    <div>
      <PageHead
        eyebrow="Admin"
        title="Subscription Renewals Hub"
        sub="Track expiring memberships, manage cycle renewals with Cash/UPI/Card payment methods, and review absent credit buffers."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-amber-400 uppercase">Expiring ≤3 Days</p>
          <p className="font-display text-2xl font-bold text-amber-300">{expiringSoon}</p>
          <p className="text-[11px] text-zinc-500">Urgent renewal required</p>
        </div>
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">Expiring ≤7 Days</p>
          <p className="font-display text-2xl font-bold text-volt">{expiringWeek}</p>
          <p className="text-[11px] text-zinc-500">Approaching renewal cycle</p>
        </div>
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">Expired / Inactive</p>
          <p className="font-display text-2xl font-bold text-zinc-400">{expiredCount}</p>
          <p className="text-[11px] text-zinc-500">Past cycle ended</p>
        </div>
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">Renewal Method</p>
          <p className="font-display text-xl font-bold text-emerald-300">UPI · Cash · Card</p>
          <p className="text-[11px] text-zinc-500">Selected at checkout</p>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl tracking-wide uppercase">Renewals Ledger</h3>
            <p className="text-xs text-zinc-500">
              Filter by urgency, search by Member ID, and start a new subscription cycle with a single click.
            </p>
          </div>
        </div>
        <RenewalsManager rows={rows} />
      </Card>
    </div>
  );
}
