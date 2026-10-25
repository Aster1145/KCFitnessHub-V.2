"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { KcLogo } from "@/components/kc-logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-carbon px-6 text-center text-zinc-100">
      <div className="mb-6 flex items-center justify-center">
        <KcLogo className="size-12" />
      </div>

      <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
        <AlertTriangle size={28} />
      </div>

      <h1 className="font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
        Temporary Service Disruption
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
        The server encountered a temporary delay connecting to the database.
        Please reload or return to the main portal.
      </p>

      {error.digest ? (
        <p className="mt-2 font-mono text-[11px] text-zinc-600">
          Ref ID: {error.digest}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-volt px-5 py-3 text-xs font-bold tracking-widest text-carbon uppercase transition hover:bg-volt-dim"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-line bg-smoke px-5 py-3 text-xs font-bold tracking-widest text-zinc-300 uppercase transition hover:text-white"
        >
          <Home size={14} />
          Return Home
        </Link>
      </div>
    </div>
  );
}
