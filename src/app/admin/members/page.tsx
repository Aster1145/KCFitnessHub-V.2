import { requireRole } from "@/lib/auth";
import {
  getAllMembers,
  getAllMemberships,
  getAllAttendance,
  getAllPayments,
  getAllTrainers,
} from "@/lib/data";
import { db } from "@/db";
import { coachAssignments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { computeSubscription } from "@/lib/subscription";
import { prettyDate, prettyDateTime, todayDateString } from "@/lib/dates";
import { PageHead, Card, Chip } from "@/components/ui";
import { MembersManager } from "../admin-client";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  await requireRole("admin");
  const today = todayDateString();

  const [
    members,
    membershipsAll,
    attendanceAll,
    paymentsAll,
    trainers,
    assignments,
  ] = await Promise.all([
    getAllMembers(),
    getAllMemberships(),
    getAllAttendance(),
    getAllPayments(),
    getAllTrainers(),
    db.select().from(coachAssignments).orderBy(desc(coachAssignments.createdAt)),
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
        phone: u.phone,
        avatarHue: u.avatarHue,
        goal: u.goal,
        level: u.level,
        subscriptionTier: u.subscriptionTier,
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

  const trainerOptions = trainers.map((t) => ({ id: t.id, name: t.name, specialty: t.specialty ?? "" }));
  const activeRows = rows.filter((r) => r.sub?.active);
  const ptRows = rows.filter((r) => r.membership?.plan === "pt" && r.sub?.active);
  const expiringSoon = activeRows.filter((r) => (r.sub?.remaining ?? 99) <= 3).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHead
          eyebrow="Admin"
          title="Members Directory"
          sub="Search by Member ID (e.g. KCM0001), filter by status, and click any member to view their complete profile card."
        />
        <Link
          href="/admin/add"
          className="inline-flex items-center gap-2 rounded-xl bg-volt px-4 py-2.5 text-xs font-bold tracking-widest text-carbon uppercase hover:bg-volt-dim transition-all self-start"
        >
          <UserPlus size={14} /> Add Member
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">Total Members</p>
          <p className="font-display text-2xl font-bold text-zinc-100">{members.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">Active Subscriptions</p>
          <p className="font-display text-2xl font-bold text-volt">{activeRows.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">PT Coached Clients</p>
          <p className="font-display text-2xl font-bold text-sky-400">{ptRows.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">Expiring ≤3 Days</p>
          <p className="font-display text-2xl font-bold text-amber-400">{expiringSoon}</p>
        </div>
      </div>

      <Card>
        <MembersManager rows={rows} trainers={trainerOptions} />
      </Card>
    </div>
  );
}
