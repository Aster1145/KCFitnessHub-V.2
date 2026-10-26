import { requireRole } from "@/lib/auth";
import { getAllPendingMembers, getAllTrainers } from "@/lib/data";
import { prettyDateTime } from "@/lib/dates";
import { PageHead } from "@/components/ui";
import { PendingMembersManager, type PendingMemberRow } from "../admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPendingPage() {
  await requireRole("admin");

  const [pendingRaw, trainersRaw] = await Promise.all([
    getAllPendingMembers(),
    getAllTrainers(),
  ]);

  const trainers = trainersRaw.map((t) => ({
    id: t.id,
    name: t.name,
    specialty: t.specialty || "Gym Floor Trainer",
  }));

  const applications: PendingMemberRow[] = pendingRaw.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    plan: p.plan,
    durationDays: p.durationDays,
    goal: p.goal,
    level: p.level,
    authProvider: p.authProvider,
    status: p.status,
    notes: p.notes,
    createdAt: prettyDateTime(p.createdAt),
    approvedAt: p.approvedAt ? prettyDateTime(p.approvedAt) : null,
  }));

  return (
    <div className="space-y-6">
      <PageHead
        eyebrow="Onboarding & Payment Gate"
        title="Pending Registrations"
        sub="Review new member join requests from Google Auth and website registrations. Confirm payment method (UPI / Cash / Card) to activate their membership and auto-email their credentials."
      />

      <PendingMembersManager
        initialApplications={applications}
        trainers={trainers}
      />
    </div>
  );
}
