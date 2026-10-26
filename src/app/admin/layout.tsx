import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import Sidebar from "@/components/sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("admin");

  return (
    <div className="min-h-screen bg-carbon">
      <Sidebar
        name={user.name}
        roleLabel="Club Manager"
        hue={user.avatarHue}
        links={[
          { href: "/admin", label: "Control Room", icon: "stats" },
          { href: "/admin/members", label: "Members", icon: "members" },
          { href: "/admin/coaches", label: "Coaches", icon: "coaches" },
          { href: "/admin/add", label: "Add Member / Coach", icon: "add" },
          { href: "/admin/renewals", label: "Renewals", icon: "renewals" },
          { href: "/admin/revenue", label: "Revenue", icon: "revenue" },
        ]}
      />
      <main className="px-4 pb-16 pt-28 md:pl-72 md:pr-8 md:pt-10 lg:px-10 lg:pl-[19rem]">
        {children}
      </main>
    </div>
  );
}
