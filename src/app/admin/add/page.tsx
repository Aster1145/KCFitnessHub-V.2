import { requireRole } from "@/lib/auth";
import { PageHead, Card } from "@/components/ui";
import { AddMemberForm, AddCoachForm } from "../admin-client";
import { UserPlus, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AddRegistrationPage() {
  await requireRole("admin");

  return (
    <div>
      <PageHead
        eyebrow="Admin"
        title="Registration Portal"
        sub="Activate new member memberships with automatic KCM ID generation and payment recording, or onboard certified coaches."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Registration */}
        <Card className="flex flex-col">
          <div className="mb-4 flex items-center gap-2.5 border-b border-line pb-3">
            <div className="grid size-9 place-items-center rounded-xl bg-volt/10 text-volt">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-display text-xl tracking-wide uppercase text-white">Activate Member</h3>
              <p className="text-xs text-zinc-500">Auto-generates sequential Member ID (e.g. KCM0012) & records payment.</p>
            </div>
          </div>
          <div className="flex-1">
            <AddMemberForm />
          </div>
        </Card>

        {/* Coach Registration */}
        <Card className="flex flex-col">
          <div className="mb-4 flex items-center gap-2.5 border-b border-line pb-3">
            <div className="grid size-9 place-items-center rounded-xl bg-sky-400/10 text-sky-400">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="font-display text-xl tracking-wide uppercase text-white">Register Coach</h3>
              <p className="text-xs text-zinc-500">Auto-generates sequential Coach ID (e.g. KCC0004) & provisions portal access.</p>
            </div>
          </div>
          <div className="flex-1">
            <AddCoachForm />
          </div>
        </Card>
      </div>
    </div>
  );
}
