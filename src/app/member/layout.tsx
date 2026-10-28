import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import Sidebar from "@/components/sidebar";

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("member");

  return (
    <div className="min-h-screen bg-carbon">
      <Sidebar
        name={user.name}
        roleLabel="Member"
        hue={user.avatarHue}
        links={[
          { href: "/member", label: "Dashboard", icon: "dashboard" },
          { href: "/member/workouts", label: "Workouts", icon: "workouts" },
          { href: "/member/workouts/pt-lite", label: "PT Lite Hub", icon: "ptLite" },
          { href: "/member/learn", label: "Learn", icon: "learn" },
          { href: "/member/diet", label: "Diet", icon: "diet" },
          { href: "/member/coach", label: "My Coach", icon: "coach" },
        ]}
      />
      <main className="px-4 pb-16 pt-28 md:pl-72 md:pr-8 md:pt-10 lg:px-10 lg:pl-[19rem]">
        {children}
      </main>
    </div>
  );
}
