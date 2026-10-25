import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coachAssignments } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import {
  attendanceLast7,
  getAdminInbox,
  getAllAttendance,
  getAllMembers,
  getAllMemberships,
  getAllPayments,
  getAllTrainers,
  getCheckinsOn,
  revenueByMonth,
} from "@/lib/data";
import { monthKey, monthLabel, prettyDate, prettyDateTime, todayStr, weekdayShort } from "@/lib/dates";
import { computeSubscription } from "@/lib/subscription";
import { Avatar, Card, Chip, PageHead, Stat } from "@/components/ui";
import { RevenueChart, SplitChart, WeeklyChart } from "@/components/charts";
import { AddMemberForm, CoachAssigner, DismissBtn, RenewForm } from "./admin-client";

export const dynamic = "force-dynamic";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function AdminPage() {
  await requireRole("admin");
  const today = todayStr();

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
    if (!membershipByUser.has(m.userId)) membershipByUser.set(m.userId, m); // desc order ⇒ first is latest
  }
  const coachByMember = new Map(assignments.map((a) => [a.memberId, a.trainerId]));

  const rows = members.map((u) => {
    const ms = membershipByUser.get(u.id) ?? null;
    const sub = ms ? computeSubscription(ms, attendanceByUser.get(u.id) ?? [], today) : null;
    return {
      user: u,
      membership: ms,
      sub,
      coachId: coachByMember.get(u.id) ?? null,
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
  const weeklyData = weeklyRaw.map((w) => ({ label: weekdayShort(w.date), count: w.count }));
  const splitData = [
    { name: "Normal", value: normalRows.length },
    { name: "Personal Training", value: ptRows.length },
  ].filter((d) => d.value > 0);

  const trainerOptions = trainers.map((t) => ({ id: t.id, name: t.name, specialty: t.specialty ?? "" }));
  const requests = inbox.filter((m) => m.body.includes("::"));

  return (
    <div>
      <PageHead
        eyebrow="Admin"
        title="Control Room"
        sub="Everything at a glance — subscriptions, coaches, attendance and revenue."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Members" value={members.length} sub={`${activeRows.length} active plans`} />
        <Stat label="PT clients" value={ptRows.length} accent sub="Coached members" />
        <Stat label="Coaches" value={trainers.length} sub="On roster" />
        <Stat label="Checked in today" value={todayCheckins.length} sub="Live attendance" />
        <Stat label="Revenue (month)" value={inr(revenueThisMonth)} accent sub={inr(revenueTotal) + " lifetime"} />
        <Stat label="Expiring ≤3d" value={expiringSoon} sub="Sessions remaining" />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide uppercase">Revenue — 6 months</h3>
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
          <h3 className="font-display mb-2 text-xl tracking-wide uppercase">Plan mix</h3>
          <SplitChart data={splitData.length ? splitData : [{ name: "No active plans", value: 1 }]} />
          <p className="mt-2 text-center text-xs text-zinc-500">
            PT revenue share:{" "}
            <span className="font-semibold text-sky-300">
              {revenueTotal ? Math.round((ptRevenue / revenueTotal) * 100) : 0}%
            </span>
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h3 className="font-display mb-2 text-xl tracking-wide uppercase">
            Check-ins — last 7 days
          </h3>
          <WeeklyChart data={weeklyData} />
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide uppercase">Requests</h3>
            <Chip tone="volt">{requests.length} open</Chip>
          </div>
          {requests.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              Inbox zero. Upgrade & coach requests land here.
            </p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {requests.map((m) => (
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

      {/* Members + coach assignment */}
      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl tracking-wide uppercase">
            Members & Coach Assignments
          </h3>
          <Chip tone="zinc">{activeRows.length} active</Chip>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                <th className="py-2.5 pr-4">Member</th>
                <th className="py-2.5 pr-4">Plan</th>
                <th className="py-2.5 pr-4">Progress</th>
                <th className="py-2.5 pr-4">Adjusted end</th>
                <th className="py-2.5 pr-4">Coach</th>
                <th className="py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user.id} className="border-b border-line/60 align-middle">
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
                            className={`h-full rounded-full ${r.sub.active ? "bg-volt" : "bg-zinc-600"}`}
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
                        {prettyDate(r.sub.endDate)}
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
                        trainers={trainerOptions}
                        currentId={r.coachId}
                      />
                    ) : (
                      <span className="text-xs text-zinc-600">not eligible</span>
                    )}
                  </td>
                  <td className="py-3">
                    <RenewForm memberId={r.user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {/* Add member */}
        <Card>
          <h3 className="font-display mb-1 text-xl tracking-wide uppercase">Add member</h3>
          <p className="mb-4 text-xs text-zinc-500">
            Creates login (temp password <code className="text-volt">member123</code>),
            subscription and payment in one step.
          </p>
          <AddMemberForm />
        </Card>

        {/* Payments */}
        <Card className="xl:col-span-2">
          <h3 className="font-display mb-3 text-xl tracking-wide uppercase">Recent payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paymentsAll.slice(0, 8).map(({ payment, name }) => (
                  <tr key={payment.id} className="border-b border-line/60">
                    <td className="py-2.5 pr-4 font-medium text-zinc-200">{name}</td>
                    <td className="py-2.5 pr-4">
                      <Chip tone={payment.plan === "pt" ? "blue" : "volt"}>
                        {payment.plan === "pt" ? "PT" : "Normal"}
                      </Chip>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-zinc-500">{payment.method}</td>
                    <td className="py-2.5 pr-4 text-xs text-zinc-500">
                      {prettyDateTime(payment.createdAt)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-volt">
                      {inr(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
