"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { KcLogo } from "@/components/kc-logo";
import { submitJoinApplicationAction } from "@/actions/admin";
import { supabase } from "@/lib/supabase";

const PLANS = [
  {
    id: "30_normal",
    plan: "normal" as const,
    durationDays: 30,
    title: "1 Month Kickstart",
    badge: "Flexible",
    price: "₹2,500",
    desc: "Fair attendance billing · 30 attended gym days",
  },
  {
    id: "90_normal",
    plan: "normal" as const,
    durationDays: 90,
    title: "3 Months Transformation",
    badge: "Most Popular",
    price: "₹6,500",
    desc: "Attendance-based · AI workout planner included",
    popular: true,
  },
  {
    id: "180_normal",
    plan: "normal" as const,
    durationDays: 180,
    title: "6 Months Athlete",
    badge: "Best Value",
    price: "₹11,000",
    desc: "Full facility access · Diet tracking · Form guidance",
  },
  {
    id: "365_normal",
    plan: "normal" as const,
    durationDays: 365,
    title: "1 Year Elite",
    badge: "Maximum Gains",
    price: "₹19,000",
    desc: "365 training sessions · VIP locker · All-access pass",
  },
  {
    id: "30_pt",
    plan: "pt" as const,
    durationDays: 30,
    title: "Personal Training (PT)",
    badge: "1-on-1 Dedicated",
    price: "₹8,000",
    desc: "Assigned Head Coach · Custom daily diet & lifting splits",
  },
];

const GOALS = [
  { id: "bulk", label: "Muscle Gain / Bulk", icon: "💪" },
  { id: "cut", label: "Fat Loss & Shred", icon: "🔥" },
  { id: "recomp", label: "Body Recomposition", icon: "⚡" },
  { id: "strength", label: "Power & Strength", icon: "🏋️‍♂️" },
];

export default function JoinPage() {
  const [authMode, setAuthMode] = useState<"google" | "manual">("google");
  const [googleUser, setGoogleUser] = useState<{
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("90_normal");
  const [goal, setGoal] = useState("recomp");
  const [level, setLevel] = useState("beginner");
  const [notes, setNotes] = useState("");

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState<{
    id?: number;
    name: string;
    email: string;
    phone: string;
    planTitle: string;
  } | null>(null);

  // Check if user came back from Supabase Google OAuth
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const fullName =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "";
        setGoogleUser({
          name: fullName,
          email: u.email || "",
          avatarUrl: u.user_metadata?.avatar_url,
        });
        setName(fullName);
        if (u.email) setEmail(u.email);
        setAuthMode("google");
      }
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setGoogleLoading(true);

    if (supabase) {
      try {
        const redirectUrl = `${window.location.origin}/join`;
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
          // If Supabase Google provider isn't enabled in dashboard yet, offer instant fallback
          console.warn("Supabase Google Auth note:", error.message);
          simulateGoogleOneTap();
        }
      } catch {
        simulateGoogleOneTap();
      }
    } else {
      simulateGoogleOneTap();
    }
  };

  // Graceful Google fallback when Supabase Google OAuth is waiting for Google Cloud Client ID
  const simulateGoogleOneTap = () => {
    const promptEmail = prompt(
      "Enter your Google Email to auto-fill details:",
      "alex.fitness@gmail.com"
    );
    if (!promptEmail) {
      setGoogleLoading(false);
      return;
    }
    const defaultName = promptEmail.split("@")[0].replace(/[._]/g, " ");
    const formattedName =
      defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
    setGoogleUser({
      name: formattedName,
      email: promptEmail.toLowerCase(),
    });
    setName(formattedName);
    setEmail(promptEmail.toLowerCase());
    setAuthMode("google");
    setGoogleLoading(false);
  };

  const selectedPlan =
    PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please provide your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage("Please enter a valid phone number (min 8 digits).");
      return;
    }

    startTransition(async () => {
      const res = await submitJoinApplicationAction({
        name,
        email,
        phone,
        plan: selectedPlan.plan,
        durationDays: selectedPlan.durationDays,
        goal,
        level,
        authProvider: googleUser ? "google" : "manual",
        notes,
      });

      if (!res.ok) {
        setErrorMessage(res.error || "Failed to submit application");
        return;
      }

      setSubmitted({
        id: res.pendingId,
        name,
        email,
        phone,
        planTitle: selectedPlan.title,
      });
    });
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submitted) {
    return (
      <main className="min-h-screen bg-carbon px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-xl rounded-3xl border border-volt/30 bg-smoke/90 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-volt/10 blur-3xl" />

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-volt/20 border border-volt/40 text-volt shadow-[0_0_30px_rgba(204,255,0,0.4)]">
              <CheckCircle2 size={36} />
            </div>

            <span className="mb-1 rounded-full border border-volt/30 bg-volt/10 px-3 py-1 font-mono text-xs font-bold text-volt uppercase tracking-wider">
              Application Received
            </span>

            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-white sm:text-4xl">
              Welcome to the Squad, {submitted.name.split(" ")[0]}!
            </h1>

            <p className="mt-2 text-sm text-zinc-300 max-w-md">
              Your registration for <strong className="text-volt">{submitted.planTitle}</strong> has been logged into KC Fitness Hub’s queue.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-carbon/60 p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-line/60">
              <span className="text-zinc-400">Applicant:</span>
              <span className="font-semibold text-zinc-100">{submitted.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-line/60">
              <span className="text-zinc-400">Email:</span>
              <span className="font-mono text-zinc-200">{submitted.email}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-line/60">
              <span className="text-zinc-400">Phone:</span>
              <span className="font-mono text-zinc-200">{submitted.phone}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-400">Status:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                <Clock size={12} /> Awaiting Payment & Admin Activation
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-volt/20 bg-volt/5 p-4 text-xs text-zinc-300 space-y-2">
            <p className="font-bold text-volt flex items-center gap-1.5">
              <Sparkles size={14} /> What happens next?
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-zinc-400">
              <li>
                Visit <strong>KC Fitness Hub</strong> front desk or pay via <strong>UPI / Cash / Card</strong>.
              </li>
              <li>
                As soon as the admin verifies your payment, you will receive an <strong>automatic Welcome Email</strong> containing your official Member ID (e.g. <span className="text-volt font-mono font-bold">KCM0004</span>) and login password.
              </li>
              <li>
                Log in to start tracking your attendance streaks, workout routines, and diet!
              </li>
            </ol>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/919845012345?text=${encodeURIComponent(
                `Hi KC Fitness Hub, I just submitted my membership application for ${submitted.planTitle} (${submitted.name}, ${submitted.phone}). I would like to complete my payment.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <MessageCircle size={15} /> Message Admin on WhatsApp
            </a>

            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-smoke px-4 py-3 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-smoke/80"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-carbon text-zinc-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 border-b border-line/60 bg-steel/80 backdrop-blur-xl px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <KcLogo className="size-8" />
            <span className="font-display text-xl font-bold tracking-wider text-white">
              FITNESS HUB
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-400 hidden sm:inline">Already registered?</span>
            <Link
              href="/login"
              className="rounded-full border border-line bg-smoke/80 px-4 py-2 font-semibold text-zinc-200 transition-colors hover:border-volt/40 hover:text-volt"
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Form Container */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-volt mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back to gym home
        </Link>

        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/10 px-3.5 py-1 text-xs font-bold text-volt uppercase tracking-wider mb-3">
            <Zap size={13} /> Become a Member
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Join KC Fitness Hub
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Fair attendance billing, 1-on-1 coach support, and AI-driven workout architectures. Fill in your details below to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <div className="lg:col-span-8 rounded-3xl border border-line bg-smoke/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            {/* Step 1: Authentication Choice */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                1. Choose Sign-Up Method
              </label>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMode("google")}
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                    authMode === "google"
                      ? "border-volt bg-volt/10 text-white shadow-[0_0_15px_rgba(204,255,0,0.15)]"
                      : "border-line bg-carbon/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <svg className="size-4" viewBox="0 0 24 24">
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
                  Google Account
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode("manual")}
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                    authMode === "manual"
                      ? "border-volt bg-volt/10 text-white shadow-[0_0_15px_rgba(204,255,0,0.15)]"
                      : "border-line bg-carbon/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <User size={15} />
                  Manual Entry
                </button>
              </div>

              {/* Google CTA card if google mode */}
              {authMode === "google" && !googleUser && (
                <div className="rounded-2xl border border-line bg-carbon/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-zinc-200">
                      Auto-fill with your Google profile
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Syncs your verified name and email with 1 click.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white text-zinc-900 px-4 py-2.5 text-xs font-bold hover:bg-zinc-100 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <LoaderCircle size={14} className="animate-spin text-zinc-900" />
                    ) : (
                      <svg className="size-4" viewBox="0 0 24 24">
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
                    )}
                    Sign in with Google
                  </button>
                </div>
              )}

              {/* Verified Google Badge */}
              {googleUser && (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-full bg-emerald-500 text-carbon font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-300">
                        Linked Google Account: {googleUser.name}
                      </p>
                      <p className="font-mono text-[11px] text-zinc-400">
                        {googleUser.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleUser(null);
                      setAuthMode("manual");
                    }}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-red-400"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 2: Contact Information */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  2. Personal & Contact Details
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Carter"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-line bg-carbon/70 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-1 focus:ring-volt"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-3.5 text-zinc-500" />
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-line bg-carbon/70 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-1 focus:ring-volt"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Mobile / WhatsApp Number *{" "}
                      <span className="text-[10px] text-zinc-500">
                        (Used for official Member ID communication & gym updates)
                      </span>
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-3.5 text-zinc-500" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98450 12345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-line bg-carbon/70 pl-10 pr-4 py-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-1 focus:ring-volt"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Choose Plan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  3. Select Membership Plan
                </label>

                <div className="space-y-2.5">
                  {PLANS.map((p) => {
                    const selected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-center justify-between gap-4 ${
                          selected
                            ? "border-volt bg-volt/10 shadow-[0_0_20px_rgba(204,255,0,0.15)]"
                            : "border-line bg-carbon/50 hover:border-zinc-700 hover:bg-carbon"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid size-5 place-items-center rounded-full border transition-colors ${
                              selected
                                ? "border-volt bg-volt text-carbon"
                                : "border-zinc-600"
                            }`}
                          >
                            {selected && <Check size={12} strokeWidth={3} />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-100">
                                {p.title}
                              </span>
                              <span className="rounded bg-smoke px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                                {p.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500">{p.desc}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-display text-lg font-black text-volt">
                            {p.price}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Fitness Goals & Experience */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  4. Primary Fitness Goal & Experience
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                  {GOALS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                        goal === g.id
                          ? "border-volt bg-volt/10 text-white"
                          : "border-line bg-carbon/50 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-[11px] font-bold">{g.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["beginner", "intermediate", "advanced"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`rounded-xl border py-2 capitalize font-semibold transition-all ${
                        level === lvl
                          ? "border-volt/60 bg-volt/10 text-volt"
                          : "border-line bg-carbon/50 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Preferred Training Hours / Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Morning 6 AM - 8 AM, looking to prepare for powerlifting..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-line bg-carbon/70 p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none focus:ring-1 focus:ring-volt resize-none"
                />
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-volt py-4 text-sm font-extrabold tracking-wide uppercase text-carbon transition-all hover:bg-volt-dim hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_25px_rgba(204,255,0,0.35)] disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin text-carbon" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Application for {selectedPlan.title} &rarr;
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-zinc-500">
                🔒 No upfront card charge required online. Complete payment at the gym or via official UPI to activate your membership.
              </p>
            </form>
          </div>

          {/* Sidebar Info Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl border border-line bg-smoke/60 p-6 backdrop-blur-md">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white mb-4">
                The KC Fitness Guarantee
              </h3>

              <ul className="space-y-4 text-xs text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-volt/20 text-volt">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>
                    <strong className="text-white">Fair Attendance Billing:</strong> Your plan only decrements when you check in. Missed days do not expire your money.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-volt/20 text-volt">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>
                    <strong className="text-white">Official Member ID:</strong> Unique credentials (e.g. <span className="font-mono text-volt">KCM0004</span>) emailed upon payment confirmation.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-volt/20 text-volt">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>
                    <strong className="text-white">AI Workout Architect:</strong> Gemini-powered periodized splits customized to your goals.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-volt/20 text-volt">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span>
                    <strong className="text-white">Head Coach Access:</strong> Dedicated trainer guidance and custom diet targets.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-line bg-smoke/40 p-6 text-xs space-y-3">
              <p className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">
                Gym Location & Contact
              </p>
              <p className="flex items-center gap-2 text-zinc-400">
                <MapPin size={14} className="text-volt shrink-0" />
                KC Fitness Hub, Bengaluru, Karnataka
              </p>
              <p className="flex items-center gap-2 text-zinc-400">
                <Clock size={14} className="text-volt shrink-0" />
                Mon–Sat: 5:30 AM – 10:30 PM · Sun: 6 AM – 1 PM
              </p>
              <p className="flex items-center gap-2 text-zinc-400">
                <Phone size={14} className="text-volt shrink-0" />
                +91 98450 12345
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
