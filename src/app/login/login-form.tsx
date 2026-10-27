"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { loginAction, googleLoginAction, type LoginState } from "@/actions/auth";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  // Handle return from Supabase Google OAuth redirect
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const hasAuthToken =
      typeof window !== "undefined" &&
      (window.location.hash.includes("access_token") ||
        window.location.search.includes("code") ||
        sessionStorage.getItem("kc_login_google") === "true");

    if (!hasAuthToken) return;

    let mounted = true;
    setGoogleLoading(true);

    const checkGoogleSession = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();

        if (session?.user?.email && mounted) {
          sessionStorage.removeItem("kc_login_google");
          const res = await googleLoginAction(session.user.email);
          if (res.ok && res.redirectUrl) {
            window.location.href = res.redirectUrl;
            return;
          } else {
            setGoogleError(res.error || "Unable to sign in with this Google account.");
            setGoogleLoading(false);
            await client.auth.signOut();
          }
        } else if (mounted) {
          // Listen for auth state change in case session is still resolving
          const { data: authListener } = client.auth.onAuthStateChange(
            async (_event, currentSession) => {
              if (currentSession?.user?.email && mounted) {
                sessionStorage.removeItem("kc_login_google");
                const res = await googleLoginAction(currentSession.user.email);
                if (res.ok && res.redirectUrl) {
                  window.location.href = res.redirectUrl;
                } else {
                  setGoogleError(res.error || "Unable to sign in with this Google account.");
                  setGoogleLoading(false);
                  await client.auth.signOut();
                }
              }
            }
          );

          // Safety timeout
          const timeout = setTimeout(() => {
            if (mounted && googleLoading) {
              setGoogleLoading(false);
              sessionStorage.removeItem("kc_login_google");
            }
          }, 5000);

          return () => {
            clearTimeout(timeout);
            authListener?.subscription?.unsubscribe();
          };
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : "Failed to verify Google sign-in.";
          setGoogleError(msg);
          setGoogleLoading(false);
          sessionStorage.removeItem("kc_login_google");
        }
      }
    };

    checkGoogleSession();

    return () => {
      mounted = false;
    };
  }, [googleLoading]);

  const handleGoogleSignIn = async () => {
    setGoogleError("");
    setGoogleLoading(true);

    if (supabase) {
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("kc_login_google", "true");
        }
        const redirectUrl = `${window.location.origin}/login`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });
        if (error) {
          setGoogleError(error.message);
          setGoogleLoading(false);
          sessionStorage.removeItem("kc_login_google");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to start Google sign-in";
        setGoogleError(msg);
        setGoogleLoading(false);
        sessionStorage.removeItem("kc_login_google");
      }
    } else {
      setGoogleError("Google authentication is not configured yet.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google OAuth Button */}
      <div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || pending}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-steel/90 px-4 py-3.5 text-sm font-semibold text-zinc-100 transition-all hover:border-zinc-500 hover:bg-smoke active:scale-[0.99] disabled:opacity-60 shadow-sm"
        >
          {googleLoading ? (
            <>
              <LoaderCircle size={18} className="animate-spin text-volt" />
              <span>Verifying Google account…</span>
            </>
          ) : (
            <>
              <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {googleError && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <p>{googleError}</p>
            {googleError.includes("Join page") && (
              <Link
                href="/join"
                className="mt-2 inline-flex items-center gap-1 font-bold text-volt underline"
              >
                Go to Member Join page &rarr;
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line/80" />
        </div>
        <span className="relative bg-carbon px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          or sign in with user id / password
        </span>
      </div>

      {/* Credentials Form */}
      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase"
          >
            User ID or Email
          </label>
          <input
            id="email"
            name="email"
            type="text"
            required
            autoComplete="username"
            placeholder="e.g. KCM0001 or you@example.com"
            className="w-full rounded-xl border border-line bg-smoke/60 px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-line bg-smoke/60 px-4 py-3.5 pr-11 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {state.error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || googleLoading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-volt px-6 py-3.5 text-sm font-bold tracking-widest text-carbon uppercase transition-all hover:bg-volt-dim disabled:opacity-60 shadow-[0_0_20px_rgba(204,255,0,0.25)]"
        >
          {pending ? (
            <>
              <LoaderCircle size={16} className="animate-spin" /> Verifying…
            </>
          ) : (
            <>
              Enter Portal
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      {/* Join link */}
      <div className="pt-2 text-center text-xs text-zinc-400">
        New to KC Fitness Hub?{" "}
        <Link href="/join" className="font-bold text-volt hover:underline">
          Join Now &rarr;
        </Link>
      </div>
    </div>
  );
}
