import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import Sidebar from "@/components/sidebar";

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("trainer");

  return (
    <div className="min-h-screen bg-carbon">
      <Sidebar
        name={user.name}
        roleLabel="Coach"
        hue={user.avatarHue}
        links={[
          { href: "/trainer", label: "My Students", icon: "students" },
          { href: "/trainer/videos", label: "PT Video Vault", icon: "videos" },
        ]}
      />
      <main className="px-4 pb-16 pt-28 md:pl-72 md:pr-8 md:pt-10 lg:px-10 lg:pl-[19rem]">
        {children}
      </main>
    </div>
  );
}
