import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import LoginForm from "./login-form";
import { KcLogo } from "@/components/kc-logo";

export const metadata = { title: "Sign in — KC" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-carbon lg:grid-cols-2">
      {/* Brand panel */}
      <div className="grain relative hidden overflow-hidden lg:block">
        <Image
          src="/images/hero.jpg"
          alt="KC Fitness Hub atmosphere"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon/40 via-carbon/60 to-carbon" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-transparent to-carbon/40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center">
            <KcLogo className="size-10" />
          </Link>
          <div>
            <h1 className="font-display max-w-md text-6xl leading-[0.95] tracking-wide uppercase">
              The iron <span className="text-volt">never lies.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-300">
              One secure portal for the whole club. Sign in and we&apos;ll take
              you straight to your floor, your students, or the control room.
            </p>
          </div>
          <p className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase">
            Attendance-billed · AI-programmed · Coach-connected
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center lg:hidden">
            <KcLogo className="size-8" />
          </Link>

          <p className="text-[11px] font-semibold tracking-[0.3em] text-volt uppercase">
            Portal
          </p>

          <h2 className="font-display mt-2 text-4xl tracking-wide uppercase">
            Enter the club
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            One account, one portal — your dashboard loads based on your
            membership.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck size={14} className="text-volt" />
            Sessions are encrypted and expire after 7 days.
          </div>

          <details className="group mt-8 rounded-xl border border-line bg-steel/60 text-xs text-zinc-500">
            <summary className="cursor-pointer list-none px-4 py-3 font-semibold tracking-widest uppercase transition-colors group-open:text-zinc-300">
              Demo credentials
            </summary>
            <div className="space-y-2 border-t border-line px-4 py-3 font-mono">
              <p>
                <span className="text-zinc-300">member@forge.com</span> / member123
                <span className="ml-2 text-zinc-600">(member portal)</span>
              </p>
              <p>
                <span className="text-zinc-300">coach@forge.com</span> / coach123
                <span className="ml-2 text-zinc-600">(trainer portal)</span>
              </p>
              <p>
                <span className="text-zinc-300">admin@forge.com</span> / admin123
                <span className="ml-2 text-zinc-600">(control room)</span>
              </p>
            </div>
          </details>

          <p className="mt-8 text-xs text-zinc-600">
            New here? Memberships are activated at the front desk or by club
            management — your credentials arrive instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
