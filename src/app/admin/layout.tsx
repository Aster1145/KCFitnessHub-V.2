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
        links={[{ href: "/admin", label: "Control Room", icon: "stats" }]}
      />
      <main className="px-4 pb-16 pt-28 md:pl-72 md:pr-8 md:pt-10 lg:px-10 lg:pl-[19rem]">
        {children}
      </main>
    </div>
  );
}
