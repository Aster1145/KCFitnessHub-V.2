"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase"
        >
          Email or member ID
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-xl border border-line bg-smoke/60 px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-xl border border-line bg-smoke/60 px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-volt px-6 py-3.5 text-sm font-bold tracking-widest text-carbon uppercase transition-all hover:bg-volt-dim disabled:opacity-60"
      >
        {pending ? (
          <>
            <LoaderCircle size={16} className="animate-spin" /> Checking in…
          </>
        ) : (
          <>
            Enter Forge
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </button>
    </form>
  );
}
