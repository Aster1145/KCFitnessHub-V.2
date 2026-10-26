import { requireRole } from "@/lib/auth";
import { getAllPayments, revenueByMonth } from "@/lib/data";
import { inr, monthLabel } from "@/lib/dates";
import { PageHead, Card } from "@/components/ui";
import { RevenueChart } from "@/components/charts";
import { RevenueManager } from "../admin-client";
import { db } from "@/db";
import { users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  await requireRole("admin");

  const [paymentsRaw, revenueRaw, usersList] = await Promise.all([
    getAllPayments(),
    revenueByMonth(6),
    db.select({ id: users.id, code: users.code }).from(users),
  ]);

  const userCodeMap = new Map(usersList.map((u) => [u.id, u.code]));

  const payments = paymentsRaw.map((p) => ({
    payment: p.payment,
    name: p.name,
    code: userCodeMap.get(p.payment.userId) ?? null,
  }));

  const revenueData = revenueRaw.map((b) => ({
    label: monthLabel(b.key),
    normal: b.normal,
    pt: b.pt,
  }));

  return (
    <div>
      <PageHead
        eyebrow="Admin"
        title="Revenue & Payments"
        sub="Financial performance, 6-month growth trends, and transaction history breakdown by Cash, UPI, and Card."
      />

      {/* Chart Section */}
      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl tracking-wide uppercase">Revenue Trend — 6 Months</h3>
            <p className="text-xs text-zinc-500">Comparison of Normal Memberships vs Personal Training (PT)</p>
          </div>
          <div className="flex gap-3 text-[10px] font-semibold tracking-widest uppercase">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="size-2 rounded-full bg-volt" /> Memberships
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="size-2 rounded-full bg-sky-400" /> Personal Training
            </span>
          </div>
        </div>
        <RevenueChart data={revenueData} />
      </Card>

      {/* Transactions and Breakdown */}
      <Card>
        <div className="mb-4">
          <h3 className="font-display text-xl tracking-wide uppercase">Transactions & Payment Methods</h3>
          <p className="text-xs text-zinc-500">
            View transaction history filtered by payment method (UPI, Cash, Card) or search by member.
          </p>
        </div>
        <RevenueManager payments={payments} />
      </Card>
    </div>
  );
}
