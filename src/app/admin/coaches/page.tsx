import { requireRole } from "@/lib/auth";
import {
  getAllMembers,
  getAllMemberships,
  getAllAttendance,
  getAllTrainers,
} from "@/lib/data";
import { db } from "@/db";
import { coachAssignments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { computeSubscription } from "@/lib/subscription";
import { prettyDate, todayDateString } from "@/lib/dates";
import { PageHead, Card, Chip } from "@/components/ui";
import { CoachesManager } from "../admin-client";
import Link from "next/link";
import { UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoachesPage() {
  await requireRole("admin");
  const today = todayDateString();

  const [
    members,
    membershipsAll,
    attendanceAll,
    trainers,
    assignments,
  ] = await Promise.all([
    getAllMembers(),
    getAllMemberships(),
    getAllAttendance(),
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
    return {
      user: {
        id: u.id,
        code: u.code,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatarHue: u.avatarHue,
      },
      membership: ms,
      sub,
      coachId: coachByMember.get(u.id) ?? null,
    };
  });

  const coachRows = trainers.map((t) => {
    const assignedMembers = rows
      .filter((r) => r.coachId === t.id)
      .map((r) => ({
        id: r.user.id,
        code: r.user.code,
        name: r.user.name,
        email: r.user.email,
        phone: r.user.phone,
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
      phone: t.phone,
      specialty: t.specialty,
      avatarHue: t.avatarHue,
      createdAt: prettyDate(t.createdAt),
      clientsCount: assignedMembers.length,
      clients: assignedMembers,
    };
  });

  const totalClients = coachRows.reduce((acc, c) => acc + c.clientsCount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHead
          eyebrow="Admin"
          title="Coaches & Trainers Roster"
          sub="Search coaches by ID (e.g. KCC0001), specialty, and click any coach to view their complete profile card and active PT clients roster."
        />
        <Link
          href="/admin/add"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-xs font-bold tracking-widest text-carbon uppercase hover:bg-sky-300 transition-all self-start"
        >
          <UserCheck size={14} /> Add Coach
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-4">
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">Registered Coaches</p>
          <p className="font-display text-2xl font-bold text-sky-300">{trainers.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">Active PT Clients</p>
          <p className="font-display text-2xl font-bold text-volt">{totalClients}</p>
        </div>
        <div className="rounded-xl border border-line bg-smoke/60 p-3.5 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">Coaching Status</p>
          <p className="font-display text-2xl font-bold text-emerald-400">100% Certified</p>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl tracking-wide uppercase">Trainer Directory</h3>
            <p className="text-xs text-zinc-500">Manage credentials, view assigned PT clients, and adjust specialties.</p>
          </div>
          <Chip tone="blue">{trainers.length} registered</Chip>
        </div>
        <CoachesManager coaches={coachRows} />
      </Card>
    </div>
  );
}
