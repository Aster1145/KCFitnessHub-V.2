import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  CalendarCheck2,
  Sparkles,
  MessagesSquare,
  GraduationCap,
  ArrowRight,
  ArrowUpRight,
  Check,
  Dumbbell,
  TrendingDown,
  Scale,
  Medal,
  Clock,
  MapPin,
  Phone,
  HelpCircle,
  Moon,
} from "lucide-react";
import { HeroStagger, HeroItem, Reveal } from "@/components/motion";
import { KcLogo, InstagramIcon } from "@/components/kc-logo";
import { AppleHeader } from "@/components/apple-header";

const MARQUEE = [
  "STRENGTH",
  "HYPERTROPHY",
  "CONDITIONING",
  "MOBILITY",
  "NUTRITION",
  "COACHING",
  "ATTENDANCE-BILLED",
  "AI PROGRAMMING",
];

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: "Attendance-Billed Memberships",
    body: "Your plan only burns on days you actually train. Every missed day auto-extends your end date — no money wasted, ever.",
    tag: "Fair billing",
  },
  {
    icon: Sparkles,
    title: "AI Workout Architect",
    body: "Tell the engine your goal, level and schedule. Get a complete periodized split in seconds — powered by Gemini, tuned by FORGE.",
    tag: "Gemini API",
  },
  {
    icon: MessagesSquare,
    title: "Coach Connect",
    body: "Personal-training members get a dedicated coach inside the app. Plans, diet targets and check-ins without a single phone call.",
    tag: "1-on-1",
  },
  {
    icon: GraduationCap,
    title: "Learning Library",
    body: "Beginner to Extreme video guides for every movement pattern, mapped to the physique you're chasing — bulk, cut or recomp.",
    tag: "Video guides",
  },
];

const PROGRAMS = [
  {
    icon: Dumbbell,
    name: "BULK",
    desc: "Controlled surplus, heavy compounds, progressive overload blocks.",
    color: "from-amber-400/20",
  },
  {
    icon: TrendingDown,
    name: "CUT",
    desc: "Deficit-friendly splits, strength retention, conditioning finishers.",
    color: "from-sky-400/20",
  },
  {
    icon: Scale,
    name: "RECOMP",
    desc: "Build and burn simultaneously. High-protein targets, smart splits.",
    color: "from-volt/20",
  },
  {
    icon: Medal,
    name: "STRENGTH",
    desc: "Low-rep power blocks for lifters chasing a bigger total.",
    color: "from-rose-400/20",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-carbon">
      {/* ---------------- FLOATING APPLE-STYLE GLASS TABLET NAV ---------------- */}
      <AppleHeader />


      {/* ---------------- HERO ---------------- */}
      <section id="home" className="grain relative flex min-h-[100svh] items-end overflow-hidden scroll-mt-28">
        <Image
          src="/images/hero.jpg"
          alt="Athlete training in a dark gym"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/40 to-carbon/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-carbon/80 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 pt-36 sm:pb-24 sm:pt-40">
          <HeroStagger>
            <HeroItem>
              <p className="mb-4 flex items-center gap-3 text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
                <span className="h-px w-10 bg-volt" />
                Est. 2025 — Bengaluru
              </p>
            </HeroItem>
            <HeroItem>
              <h1 className="font-display text-[clamp(2.9rem,11vw,9.5rem)] leading-[0.9] tracking-wide text-zinc-100 uppercase">
                Stronger
                <br />
                <span className="text-outline">Every</span> <span className="text-volt">Rep</span>
              </h1>
            </HeroItem>
            <HeroItem>
              <p className="mt-5 max-w-xl text-base text-zinc-300 md:text-lg">
                The membership that only counts the days you train. AI-built
                programs, dedicated coaches and nutrition tracking — one club,
                zero wasted days.
              </p>
            </HeroItem>
            <HeroItem className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <Link
                href="/login"
                className="rounded-full bg-volt px-8 py-3.5 text-center text-sm font-bold text-carbon uppercase tracking-widest transition-all hover:scale-[1.02] hover:bg-volt-dim shadow-[0_0_24px_rgba(216,255,62,0.35)]"
              >
                Start Training
              </Link>
              <a
                href="#system"
                className="rounded-full border border-zinc-600 px-8 py-3.5 text-center text-sm font-bold tracking-widest text-zinc-200 uppercase transition-colors hover:border-volt hover:text-volt"
              >
                Explore the system
              </a>
            </HeroItem>
            <HeroItem className="mt-12 grid grid-cols-2 gap-y-6 gap-x-4 border-t border-white/10 pt-8 sm:grid-cols-4 sm:gap-8">
              {[
                ["6,200+", "Sessions logged"],
                ["40+", "Coaches"],
                ["98%", "Renewal rate"],
                ["0", "Wasted days"],
              ].map(([v, l]) => (
                <div key={l} className="flex flex-col">
                  <p className="font-display text-3xl text-zinc-100 sm:text-4xl">{v}</p>
                  <p className="mt-1 text-[10px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
                    {l}
                  </p>
                </div>
              ))}
            </HeroItem>
          </HeroStagger>
        </div>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <div className="border-y border-line bg-steel py-4">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span
              key={i}
              className="flex items-center gap-10 font-display text-2xl tracking-widest text-zinc-600"
            >
              {m}
              <Flame size={16} className="text-volt" />
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- SYSTEM ---------------- */}
      <section id="system" className="mx-auto max-w-7xl px-5 py-20 sm:py-28 scroll-mt-28">
        <Reveal>
          <p className="text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
            01 — The System
          </p>
          <h2 className="font-display mt-3 max-w-3xl text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-wide text-zinc-100 uppercase">
            One platform. <span className="text-outline">Every tool.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-steel p-8 transition-colors hover:border-volt/40">
                <div className="absolute -right-6 -top-6 size-32 rounded-full bg-volt/5 blur-2xl transition-all group-hover:bg-volt/10" />
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-smoke text-volt">
                    <f.icon size={22} />
                  </span>
                  <span className="rounded-full border border-line px-3 py-1 text-[9px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-display mt-6 text-2xl tracking-wide text-zinc-100 uppercase">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- PROGRAMS ---------------- */}
      <section id="programs" className="border-y border-line bg-steel/40 py-20 sm:py-28 scroll-mt-28">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal>
            <p className="text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
              02 — Programs
            </p>
            <h2 className="font-display mt-3 max-w-3xl text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-wide uppercase">
              Pick your <span className="text-volt">physique</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm text-zinc-400">
              Every track scales from Beginner to Extreme. Start with the guided
              library — or let the AI Architect build your exact split.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08}>
                <div
                  className={`group relative h-full overflow-hidden rounded-2xl border border-line bg-gradient-to-b ${p.color} to-steel p-6 transition-transform hover:-translate-y-1`}
                >
                  <p.icon size={26} className="text-volt" />
                  <h3 className="font-display mt-6 text-3xl tracking-widest">{p.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">{p.desc}</p>
                  <div className="mt-6 flex items-center gap-1.5">
                    {["Beginner", "Intermediate", "Advanced", "Extreme"].map((lv, j) => (
                      <div key={lv} className="flex-1">
                        <div
                          className={`h-1 rounded-full ${j <= i ? "bg-volt" : "bg-smoke"}`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[9px] tracking-[0.25em] text-zinc-500 uppercase">
                    Scales to extreme
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- COACH BAND ---------------- */}
      <section className="relative overflow-hidden py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line">
              <Image
                src="/images/coach.jpg"
                alt="FORGE personal training session"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-carbon/70 to-transparent" />
              <div className="absolute bottom-5 left-5 rounded-full bg-carbon/70 px-4 py-2 text-[10px] font-semibold tracking-[0.3em] uppercase backdrop-blur">
                Coach Connect — inside the app
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
              03 — Personal Training
            </p>
            <h2 className="font-display mt-3 text-5xl leading-[0.95] tracking-wide uppercase md:text-6xl">
              Your coach. <span className="text-outline">In your pocket.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-zinc-400">
              No calls. No scheduling chaos. Your coach builds your split,
              assigns your meals and reads your check-ins from the trainer
              portal — while you just train and tap a button.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Dedicated coach matched to your goal",
                "Custom workout plan, updated as you progress",
                "Diet assignments with macro targets",
                "In-app messaging — replies from the trainer portal",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-volt/15 text-volt">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------------- PRICING ---------------- */}
      <section id="pricing" className="border-t border-line bg-steel/40 py-20 sm:py-28 scroll-mt-28">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
              04 — Memberships
            </p>
            <h2 className="font-display mt-3 text-4xl sm:text-5xl md:text-6xl tracking-wide uppercase">
              Gym <span className="text-volt">Memberships</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-zinc-300">
              Limited time special offers to celebrate our opening
            </p>
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-4 py-2 text-xs font-semibold tracking-wider text-volt uppercase">
              <span>One time registration fees of ₹666/-</span>
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-xs text-zinc-400">
              ⚡ All memberships are attendance-billed: miss a day and your end date auto-extends. Only days you actually train consume your plan.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Monthly */}
            <Reveal delay={0}>
              <div className="flex h-full flex-col justify-between rounded-3xl border border-line bg-steel/90 p-7 transition-all duration-300 hover:border-volt/40 hover:shadow-xl hover:shadow-volt/5">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl tracking-widest text-zinc-100 uppercase">
                      Monthly
                    </h3>
                    <span className="rounded-full border border-line bg-smoke px-2.5 py-0.5 text-[9px] font-semibold tracking-widest text-zinc-400 uppercase">
                      Flexible
                    </span>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl text-zinc-100">₹1,399</span>
                      <span className="text-xs text-zinc-400">/month</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      30 attended sessions guaranteed
                    </p>
                  </div>
                  <ul className="mt-7 space-y-3 text-xs text-zinc-300">
                    {[
                      "Full gym floor & equipment access",
                      "Attendance-billed auto extension",
                      "AI Workout Architect (Gemini)",
                      "Diet & macro logging tools",
                      "Full locker & shower access",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check size={14} className="shrink-0 text-volt" strokeWidth={3} />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 pt-4">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-3.5 text-xs font-bold tracking-widest text-zinc-100 uppercase transition-all hover:bg-volt hover:text-carbon hover:border-volt"
                  >
                    Get Started <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* 2. Quarterly */}
            <Reveal delay={0.1}>
              <div className="flex h-full flex-col justify-between rounded-3xl border border-line bg-steel/90 p-7 transition-all duration-300 hover:border-volt/40 hover:shadow-xl hover:shadow-volt/5">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl tracking-widest text-zinc-100 uppercase">
                      Quarterly
                    </h3>
                    <span className="rounded-full border border-line bg-smoke px-2.5 py-0.5 text-[9px] font-semibold tracking-widest text-zinc-400 uppercase">
                      Save 5%
                    </span>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl text-zinc-100">₹3,999</span>
                      <span className="text-xs text-zinc-400">/3 months</span>
                    </div>
                    <p className="mt-1 text-[11px] text-volt">
                      Effective ₹1,333 / month
                    </p>
                  </div>
                  <ul className="mt-7 space-y-3 text-xs text-zinc-300">
                    {[
                      "Everything in Monthly",
                      "90 attended sessions guaranteed",
                      "Fitness assessment & body composition",
                      "Goal-oriented program recommendation",
                      "Locker & shower facilities",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check size={14} className="shrink-0 text-volt" strokeWidth={3} />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 pt-4">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-3.5 text-xs font-bold tracking-widest text-zinc-100 uppercase transition-all hover:bg-volt hover:text-carbon hover:border-volt"
                  >
                    Get Started <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* 3. Half Yearly */}
            <Reveal delay={0.2}>
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border-2 border-volt bg-gradient-to-b from-volt/10 via-steel to-steel p-7 shadow-2xl shadow-volt/10">
                <span className="absolute right-4 top-4 rounded-full bg-volt px-3 py-1 text-[9px] font-bold tracking-widest text-carbon uppercase">
                  Most Popular
                </span>
                <div>
                  <h3 className="font-display text-2xl tracking-widest text-volt uppercase">
                    Half Yearly
                  </h3>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl text-zinc-100">₹6,999</span>
                      <span className="text-xs text-zinc-400">/6 months</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-volt">
                      Effective ₹1,166 / month · Save ₹1,400
                    </p>
                  </div>
                  <ul className="mt-7 space-y-3 text-xs text-zinc-200">
                    {[
                      "Everything in Quarterly",
                      "180 attended sessions guaranteed",
                      "1 Free 1-on-1 PT Consultation",
                      "Bi-weekly physique check-in",
                      "Custom nutrition & macro blueprint",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check size={14} className="shrink-0 text-volt" strokeWidth={3} />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 pt-4">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-volt py-3.5 text-xs font-bold tracking-widest text-carbon uppercase transition-all hover:bg-volt-dim hover:scale-[1.02]"
                  >
                    Get Started <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* 4. Annual */}
            <Reveal delay={0.3}>
              <div className="flex h-full flex-col justify-between rounded-3xl border border-line bg-steel/90 p-7 transition-all duration-300 hover:border-volt/40 hover:shadow-xl hover:shadow-volt/5">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl tracking-widest text-zinc-100 uppercase">
                      Annual
                    </h3>
                    <span className="rounded-full border border-volt/30 bg-volt/10 px-2.5 py-0.5 text-[9px] font-semibold tracking-widest text-volt uppercase">
                      Best Value
                    </span>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl text-zinc-100">₹11,999</span>
                      <span className="text-xs text-zinc-400">/year</span>
                    </div>
                    <p className="mt-1 text-[11px] text-volt">
                      Effective ₹999 / month · Save ₹4,800
                    </p>
                  </div>
                  <ul className="mt-7 space-y-3 text-xs text-zinc-300">
                    {[
                      "365 attended sessions guaranteed",
                      "Full VIP Club year-round access",
                      "2 Free 1-on-1 Personal Training sessions",
                      "Unlimited AI Workout Architect plans",
                      "FORGE VIP welcome kit & merchandise",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check size={14} className="shrink-0 text-volt" strokeWidth={3} />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 pt-4">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-3.5 text-xs font-bold tracking-widest text-zinc-100 uppercase transition-all hover:bg-volt hover:text-carbon hover:border-volt"
                  >
                    Get Started <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Personal Training Upsell Banner */}
          <Reveal delay={0.2} className="mt-10">
            <div className="relative overflow-hidden rounded-2xl border border-line bg-smoke/80 p-6 md:p-8">
              <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[10px] font-semibold tracking-widest text-sky-300 uppercase">
                    1-on-1 Dedicated Coaching
                  </div>
                  <h4 className="font-display mt-2 text-2xl tracking-wide uppercase text-zinc-100 md:text-3xl">
                    Need Personal Training?
                  </h4>
                  <p className="mt-2 text-sm text-zinc-400">
                    Upgrade any membership with an assigned elite coach for <strong className="text-zinc-200">₹4,999 / 30 coached days</strong>. Includes coach-built workout splits, assigned nutrition & macro targets, and direct in-app messaging.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 shrink-0 rounded-xl border border-sky-400/40 bg-sky-400/10 px-6 py-3.5 text-xs font-bold tracking-widest text-sky-300 uppercase transition-colors hover:bg-sky-400 hover:text-carbon"
                >
                  Explore Coaching <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- GALLERY ---------------- */}
      <section id="gallery" className="border-t border-line bg-steel/30 py-20 sm:py-24 scroll-mt-28">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
              05 — Inside the Club
            </p>
            <h2 className="font-display mt-3 text-4xl sm:text-5xl md:text-6xl tracking-wide uppercase">
              Club <span className="text-volt">Gallery</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400">
              Take a tour of our training floor, heavy compound stations, and performance atmosphere.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay={0}>
              <div className="group relative aspect-video overflow-hidden rounded-2xl border border-line bg-steel">
                <Image
                  src="/images/hero.jpg"
                  alt="KC Olympic Barbell Zone"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-carbon/90 via-carbon/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="rounded-full bg-volt/20 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-volt uppercase">
                    Free Weights
                  </span>
                  <h4 className="font-display mt-1 text-lg uppercase text-zinc-100">
                    Olympic Lifting Zone
                  </h4>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="group relative aspect-video overflow-hidden rounded-2xl border border-line bg-steel">
                <Image
                  src="/images/coach.jpg"
                  alt="KC Dedicated Coaching"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-carbon/90 via-carbon/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="rounded-full bg-sky-400/20 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-sky-300 uppercase">
                    Coaching
                  </span>
                  <h4 className="font-display mt-1 text-lg uppercase text-zinc-100">
                    1-on-1 Performance Bay
                  </h4>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="group relative aspect-video overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-smoke to-steel p-6">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <span className="rounded-full bg-volt/15 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-volt uppercase">
                      Equipment
                    </span>
                    <h4 className="font-display mt-2 text-2xl uppercase text-zinc-100">
                      Biomechanical Strength
                    </h4>
                    <p className="mt-2 text-xs text-zinc-400">
                      Engineered resistance machines, plate-loaded presses, and functional cables designed for maximum hypertrophic stimulus.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-volt uppercase">
                    Tour Facilities <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section id="about" className="border-t border-line py-20 sm:py-28 scroll-mt-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
                06 — Who We Are
              </p>
              <h2 className="font-display mt-3 text-4xl sm:text-5xl md:text-6xl tracking-wide uppercase">
                About <span className="text-volt">KC Fitness Hub</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-zinc-300">
                Transform your life with our world-class facilities and expert trainers. Located near Brigade Meadows, Kaggalipura, Bengaluru, KC Fitness Hub was founded with a singular purpose: to deliver an uncompromising training space where lifters of every background achieve measurable progress.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                We believe in fair, transparent fitness. With our proprietary attendance-billed memberships, you only pay for the sessions you actually complete. Backed by cutting-edge Gemini AI workout architecture, individualized diet planning, and seasoned personal trainers, we ensure your sweat yields real results.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-line bg-steel p-4">
                  <p className="font-display text-3xl text-volt">5:30 AM</p>
                  <p className="mt-1 text-xs text-zinc-400">Early morning floor opening</p>
                </div>
                <div className="rounded-2xl border border-line bg-steel p-4">
                  <p className="font-display text-3xl text-zinc-100">100%</p>
                  <p className="mt-1 text-xs text-zinc-400">Attendance-billed guarantee</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-line bg-steel/80 p-8 shadow-2xl">
                <h3 className="font-display text-2xl tracking-wide uppercase text-zinc-100">
                  Why Athletes Choose KC
                </h3>
                <ul className="mt-6 space-y-4 text-sm text-zinc-300">
                  {[
                    {
                      title: "World-Class Heavy Equipment",
                      desc: "Heavy-gauge steel power racks, competition barbells, and calibrated bumper plates.",
                    },
                    {
                      title: "Attendance-Only Billing",
                      desc: "Life happens. Miss a day and your plan end date pushes forward automatically.",
                    },
                    {
                      title: "Certified Conditioning Coaches",
                      desc: "Experienced trainers who build customized progression splits and nutritional targets.",
                    },
                    {
                      title: "AI-Powered Training Architect",
                      desc: "On-demand periodized splits tuned specifically to your goals and equipment.",
                    },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-volt/15 text-volt mt-0.5">
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <div>
                        <strong className="block text-zinc-100">{item.title}</strong>
                        <span className="text-xs text-zinc-400">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="border-t border-line bg-steel/30 py-20 sm:py-24 scroll-mt-28">
        <div className="mx-auto max-w-4xl px-5">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
              07 — Common Inquiries
            </p>
            <h2 className="font-display mt-3 text-4xl sm:text-5xl md:text-6xl tracking-wide uppercase">
              Frequently Asked <span className="text-volt">Questions</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400">
              Everything you need to know about memberships, billing, and training at KC.
            </p>
          </Reveal>

          <div className="mt-12 space-y-4">
            {[
              {
                q: "How does attendance-based billing work?",
                a: "Unlike traditional gyms where missed days are lost, KC memberships only consume sessions when you actually check in. If you miss days due to travel, work, or recovery, your membership end date automatically extends so you get every single session you paid for.",
              },
              {
                q: "What is the one-time registration fee of ₹666/-?",
                a: "Our special opening offer includes a one-time registration fee of ₹666/-, which covers your member onboarding, initial physical assessment, and in-app dashboard setup.",
              },
              {
                q: "What are your operating working hours?",
                a: "KC Fitness Hub is open Monday to Saturday from 5:30 AM to 10:00 PM, and on Sundays from 7:00 AM to 2:00 PM.",
              },
              {
                q: "Where is KC Fitness Hub located?",
                a: "We are located near Brigade Meadows, Kaggalipura, off Kanakapura Main Road, Bengaluru, Karnataka.",
              },
              {
                q: "Can I get a dedicated personal coach?",
                a: "Yes! You can choose our Personal Training package for ₹4,999 / 30 coached days. You will be matched with a dedicated coach who creates your progressive workout program, assigns your daily macros, and communicates with you directly inside the member portal.",
              },
            ].map((item, idx) => (
              <Reveal key={idx} delay={idx * 0.05}>
                <details className="group rounded-2xl border border-line bg-steel/90 p-5 transition-all open:border-volt/40 open:bg-steel">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-zinc-100">
                    <span>{item.q}</span>
                    <span className="text-volt transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400 border-t border-line/60 pt-3">
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CONTACT ---------------- */}
      <section id="contact" className="border-t border-line py-20 sm:py-24 scroll-mt-28">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.35em] text-volt uppercase">
              08 — Get in Touch
            </p>
            <h2 className="font-display mt-3 text-4xl sm:text-5xl md:text-6xl tracking-wide uppercase">
              Visit <span className="text-volt">KC Fitness Hub</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400">
              Come experience our premier facility in Kaggalipura, Bengaluru.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <Reveal delay={0}>
              <div className="flex h-full flex-col justify-between rounded-2xl border border-line bg-steel p-6">
                <div>
                  <div className="grid size-10 place-items-center rounded-xl bg-volt/10 text-volt">
                    <MapPin size={20} />
                  </div>
                  <h4 className="font-display mt-4 text-xl uppercase text-zinc-100">
                    Location
                  </h4>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                    Near Brigade Meadows, Kaggalipura,
                    <br />
                    Kanakapura Main Road, Bengaluru, Karnataka
                  </p>
                </div>
                <a
                  href="https://maps.app.goo.gl/VGuwWfWVLtorK6FY7"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-volt uppercase hover:underline"
                >
                  View on Google Maps <ArrowUpRight size={13} />
                </a>
              </div>
            </Reveal>


            <Reveal delay={0.1}>
              <div className="flex h-full flex-col justify-between rounded-2xl border border-line bg-steel p-6">
                <div>
                  <div className="grid size-10 place-items-center rounded-xl bg-volt/10 text-volt">
                    <Clock size={20} />
                  </div>
                  <h4 className="font-display mt-4 text-xl uppercase text-zinc-100">
                    Working Hours
                  </h4>
                  <div className="mt-3 space-y-1.5 text-sm text-zinc-300">
                    <p className="flex justify-between">
                      <span className="text-zinc-500">Mon - Sat:</span>
                      <span className="font-mono text-zinc-200">5:30 AM – 10:00 PM</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-500">Sunday:</span>
                      <span className="font-mono text-zinc-200">7:00 AM – 2:00 PM</span>
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-xs text-zinc-500">
                  Open 7 days a week for uninterrupted progress.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="flex h-full flex-col justify-between rounded-2xl border border-line bg-steel p-6">
                <div>
                  <div className="grid size-10 place-items-center rounded-xl bg-volt/10 text-volt">
                    <InstagramIcon className="size-5" />
                  </div>
                  <h4 className="font-display mt-4 text-xl uppercase text-zinc-100">
                    Instagram & Socials
                  </h4>
                  <p className="mt-2 text-sm text-zinc-400">
                    Follow us on Instagram for daily workout drops, member PRs, and club announcements.
                  </p>
                </div>
                <a
                  href="https://www.instagram.com/kcfitnesshub?utm_source=ig_web_button_share_sheet&psln=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-volt/10 border border-volt/30 px-4 py-2.5 text-xs font-bold text-volt uppercase hover:bg-volt hover:text-carbon transition-colors"
                >
                  <InstagramIcon className="size-4" /> @kcfitnesshub
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden py-24 border-t border-line">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <Reveal>
            <h2 className="font-display text-[clamp(2.6rem,8vw,7rem)] leading-[0.9] tracking-wide uppercase">
              Show up. <span className="text-outline">We count.</span>
              <br />
              <span className="text-volt">You grow.</span>
            </h2>
            <Link
              href="/login"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-volt px-10 py-4 text-sm font-bold tracking-widest text-carbon uppercase transition-transform hover:scale-105"
            >
              Access the portal <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-line bg-steel/60 pt-16 pb-20 sm:pb-12">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <h3 className="font-display text-xl tracking-wider uppercase text-zinc-100">
                KC FITNESS HUB
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Transform your life with our world-class facilities and expert trainers.
              </p>
              <div className="pt-2">
                <a
                  href="https://maps.app.goo.gl/VGuwWfWVLtorK6FY7"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-[10px] font-semibold tracking-widest text-volt uppercase transition-colors hover:bg-volt hover:text-carbon"
                >
                  <MapPin size={11} /> Bengaluru · Kaggalipura
                </a>
              </div>

            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-display text-base tracking-wider uppercase text-zinc-200">
                Quick Links
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
                <li>
                  <a href="#home" className="transition-colors hover:text-volt">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#about" className="transition-colors hover:text-volt">
                    About
                  </a>
                </li>
                <li>
                  <a href="#faq" className="transition-colors hover:text-volt">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#contact" className="transition-colors hover:text-volt">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Working Hours */}
            <div>
              <h4 className="flex items-center gap-2 font-display text-base tracking-wider uppercase text-zinc-200">
                <Clock size={16} className="text-volt" /> Working Hours
              </h4>
              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                <div className="flex justify-between gap-4">
                  <span>Mon - Sat:</span>
                  <span className="font-mono text-zinc-200">5:30 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Sunday:</span>
                  <span className="font-mono text-zinc-200">7:00 AM - 2:00 PM</span>
                </div>
              </div>
            </div>

            {/* Column 4: Connect With Us */}
            <div>
              <h4 className="font-display text-base tracking-wider uppercase text-zinc-200">
                Connect With Us
              </h4>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://www.instagram.com/kcfitnesshub?utm_source=ig_web_button_share_sheet&psln=ZDNlZDc0MzIxNw=="
                  target="_blank"
                  rel="noreferrer"
                  aria-label="KC Fitness Hub Instagram"
                  className="grid size-11 place-items-center rounded-xl border border-sky-400/40 bg-sky-400/10 text-sky-300 transition-all hover:bg-sky-400 hover:text-carbon hover:scale-105"
                >
                  <InstagramIcon className="size-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Dark Mode Indicator */}
          <div className="mt-14 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-line/80 pt-8 text-xs text-zinc-500 text-center sm:text-left">
            <p>© 2026 KC Fitness Hub. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-600">
                Attendance-Billed Club
              </span>
              <button
                type="button"
                aria-label="Dark theme active"
                className="grid size-7 place-items-center rounded-full border border-line bg-smoke text-zinc-400 shadow"
                title="Dark theme active"
              >
                <Moon size={13} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

