"use client";

import { useState, useTransition } from "react";
import {
  Play,
  Lock,
  Sparkles,
  Check,
  Target,
  Clock,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  X,
  Dumbbell,
  Crown,
  Flame,
  Award,
} from "lucide-react";
import {
  upgradeSubscriptionTierAction,
  type VideoWithCoach,
  type DifficultyLevel,
  type BodyGoal,
} from "@/actions/videos";
import { Card, Chip } from "@/components/ui";

const DIFFICULTY_OPTIONS: DifficultyLevel[] = ["Beginner", "Intermediate", "Advanced"];
const BODY_GOAL_OPTIONS: BodyGoal[] = [
  "Cut",
  "Bulk",
  "Fat Loss",
  "Body Recomposition",
];

interface PtLiteHubProps {
  subscriptionTier: string; // 'STANDARD' | 'PT_LITE' | 'PT'
  memberName: string;
  memberGoal?: string | null;
  memberLevel?: string | null;
  videos: VideoWithCoach[];
}

export default function PtLiteHub({
  subscriptionTier: initialTier,
  memberName,
  memberGoal,
  memberLevel,
  videos,
}: PtLiteHubProps) {
  const [currentTier, setCurrentTier] = useState<string>(initialTier);
  const [isPending, startTransition] = useTransition();

  // Active filters
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedGoal, setSelectedGoal] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Video playback modal
  const [activeVideo, setActiveVideo] = useState<VideoWithCoach | null>(null);

  const isUnlocked = currentTier === "PT_LITE" || currentTier === "PT";

  // Handle Upgrade to PT Lite
  const handleUpgrade = (tier: "PT_LITE" | "PT" = "PT_LITE") => {
    startTransition(async () => {
      const res = await upgradeSubscriptionTierAction(tier);
      if (res.ok) {
        setCurrentTier(tier);
      } else {
        alert(res.error || "Failed to upgrade subscription.");
      }
    });
  };

  // Video embed helper
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regExp);
      if (match && match[1]) {
        return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1`;
      }
    }
    if (url.includes("vimeo.com")) {
      const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
      }
    }
    return url;
  };

  // Filtered videos
  const filteredVideos = videos.filter((v) => {
    if (selectedDifficulty !== "ALL" && v.difficultyLevel !== selectedDifficulty) {
      return false;
    }
    if (selectedGoal !== "ALL" && v.bodyGoal !== selectedGoal) {
      return false;
    }
    if (
      searchQuery.trim() &&
      !v.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !v.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  /* ------------------------------------------------------------- */
  /* UPSELL UI (RENDERED FOR STANDARD TIER MEMBERS)               */
  /* ------------------------------------------------------------- */
  if (!isUnlocked) {
    return (
      <div className="space-y-10">
        {/* Hero Upsell Card */}
        <div className="relative overflow-hidden rounded-3xl border border-volt/30 bg-gradient-to-br from-steel via-carbon to-steel p-6 sm:p-10 shadow-2xl">
          {/* Background Ambient Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-volt/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-volt">
              <Sparkles size={14} />
              PT Lite · Premium Video Coaching
            </div>

            <h1 className="font-display mt-4 text-3xl font-extrabold tracking-wide uppercase text-zinc-100 sm:text-5xl">
              Bridge the Gap to <span className="text-volt">Elite Coaching</span>
            </h1>

            <p className="mt-3 text-base text-zinc-300 sm:text-lg">
              Can’t afford expensive 1-on-1 Personal Training? Get unlimited on-demand
              access to our master coach tutorial vault with exercise form breakdowns,
              rep cues, and goal-specific split variations.
            </p>

            {/* Pricing Comparison & CTAs */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => handleUpgrade("PT_LITE")}
                disabled={isPending}
                className="group flex items-center justify-center gap-2.5 rounded-2xl bg-volt px-6 py-4 font-display text-base font-bold uppercase tracking-wider text-carbon shadow-lg shadow-volt/20 transition-all hover:bg-volt/90 hover:scale-[1.02] disabled:opacity-50"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-carbon border-t-transparent" />
                    Activating PT Lite...
                  </span>
                ) : (
                  <>
                    <Zap size={18} className="fill-carbon" />
                    Upgrade to PT Lite · ₹999/mo
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleUpgrade("PT")}
                disabled={isPending}
                className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-smoke/80 px-5 py-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-smoke hover:text-zinc-100"
              >
                <Crown size={16} className="text-amber-400" />
                Or Full 1-on-1 PT (₹4,999/mo)
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              * Instant activation · Cancel anytime from member settings.
            </p>
          </div>
        </div>

        {/* Feature Comparison Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card className="relative border-line/80 p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-volt/10 text-volt">
              <Dumbbell size={20} />
            </span>
            <h3 className="font-display mt-4 text-xl tracking-wide uppercase text-zinc-100">
              Form Mastery & Injury Prevention
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              HD step-by-step video tutorials on compound barbell lifts, dumbbell
              isolations, and cable angles recorded directly on KC Fitness Hub equipment.
            </p>
          </Card>

          <Card className="relative border-line/80 p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-sky-400/10 text-sky-400">
              <Target size={20} />
            </span>
            <h3 className="font-display mt-4 text-xl tracking-wide uppercase text-zinc-100">
              Targeted by Goal & Level
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Filter immediately by Cut (metabolic intensity), Bulk (hypertrophy volume),
              Fat Loss, or Body Recomposition. Tailored for Beginner to Advanced lifters.
            </p>
          </Card>

          <Card className="relative border-line/80 p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-400">
              <ShieldCheck size={20} />
            </span>
            <h3 className="font-display mt-4 text-xl tracking-wide uppercase text-zinc-100">
              Huge Savings vs Full PT
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Save over ₹4,000 every single month while lifting with the exact same
              coaching cues and program structure used in private 1-on-1 sessions.
            </p>
          </Card>
        </div>

        {/* Locked Preview Gallery (Teaser to incentivize upgrade) */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                LOCKED PREVIEW
              </p>
              <h2 className="font-display text-2xl tracking-wide uppercase text-zinc-200">
                Inside the PT Lite Vault ({videos.length} Tutorials)
              </h2>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-smoke px-3 py-1 text-xs text-zinc-400">
              <Lock size={13} className="text-volt" />
              Locked for Standard Members
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.slice(0, 3).map((v) => (
              <div
                key={v.id}
                className="group relative overflow-hidden rounded-2xl border border-line bg-steel"
              >
                {/* Blurred Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-carbon">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.thumbnailUrl || "/images/gym/gym-photo-1.jpg"}
                    alt={v.title}
                    className="h-full w-full object-cover blur-sm opacity-60"
                  />
                  <div className="absolute inset-0 bg-carbon/60 grid place-items-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="grid size-12 place-items-center rounded-full bg-steel border border-volt/40 text-volt shadow-lg">
                        <Lock size={20} />
                      </span>
                      <span className="rounded-full bg-carbon/90 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-volt">
                        PT Lite Required
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {v.difficultyLevel}
                    </span>
                    <span>·</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                      {v.bodyGoal}
                    </span>
                  </div>
                  <h3 className="font-display text-base text-zinc-200">{v.title}</h3>
                  <button
                    type="button"
                    onClick={() => handleUpgrade("PT_LITE")}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-volt/30 bg-volt/10 py-2 text-xs font-semibold text-volt hover:bg-volt hover:text-carbon transition-colors"
                  >
                    Unlock with PT Lite
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* UNLOCKED PT LITE VIDEO HUB (FOR PT_LITE & PT MEMBERS)        */
  /* ------------------------------------------------------------- */
  return (
    <div className="space-y-8">
      {/* Active Member Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-volt/30 bg-gradient-to-r from-volt/15 via-steel to-steel p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-volt text-carbon shadow">
            {currentTier === "PT" ? <Crown size={22} /> : <Zap size={22} />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg tracking-wide uppercase text-zinc-100 sm:text-xl">
                {currentTier === "PT" ? "Full 1-on-1 PT VIP" : "PT Lite Subscription Active"}
              </h2>
              <span className="rounded-full bg-volt/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-volt">
                UNLOCKED
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Welcome {memberName}. You have full unrestricted access to all coach workout tutorials.
            </p>
          </div>
        </div>

        {/* Quick info badges */}
        <div className="flex items-center gap-3">
          {memberGoal && (
            <div className="hidden rounded-xl border border-line bg-smoke/80 px-3 py-1.5 text-right sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                Your Goal
              </p>
              <p className="text-xs font-bold uppercase text-sky-400">{memberGoal}</p>
            </div>
          )}
          {memberLevel && (
            <div className="hidden rounded-xl border border-line bg-smoke/80 px-3 py-1.5 text-right sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
                Your Level
              </p>
              <p className="text-xs font-bold uppercase text-volt">{memberLevel}</p>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search tutorials by muscle group, lift, or coaching cue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-line bg-smoke py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-volt focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Difficulty Level Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Difficulty:
              </span>
              {["ALL", ...DIFFICULTY_OPTIONS].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedDifficulty(lvl)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedDifficulty === lvl
                      ? "bg-volt text-carbon shadow font-bold"
                      : "bg-smoke text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {lvl === "ALL" ? "All Levels" : lvl}
                </button>
              ))}
            </div>

            {/* Body Structure Goal Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Body Goal:
              </span>
              {["ALL", ...BODY_GOAL_OPTIONS].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setSelectedGoal(goal)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedGoal === goal
                      ? "bg-sky-400 text-carbon shadow font-bold"
                      : "bg-smoke text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {goal === "ALL" ? "All Goals" : goal}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Video Counter & Result Info */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <p>
          Showing <span className="font-semibold text-zinc-100">{filteredVideos.length}</span>{" "}
          of {videos.length} tutorials
        </p>
        {(selectedDifficulty !== "ALL" || selectedGoal !== "ALL" || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedDifficulty("ALL");
              setSelectedGoal("ALL");
              setSearchQuery("");
            }}
            className="text-volt hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Responsive CSS Grid of Video Cards */}
      {filteredVideos.length === 0 ? (
        <Card className="py-16 text-center">
          <Dumbbell size={36} className="mx-auto mb-3 text-zinc-600" />
          <h3 className="font-display text-xl text-zinc-300">
            No video tutorials match these filters
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Try adjusting your search keywords or reset the difficulty/goal filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => {
            const diffTone =
              video.difficultyLevel === "Beginner"
                ? "volt"
                : video.difficultyLevel === "Intermediate"
                ? "blue"
                : "red";

            return (
              <div
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-steel transition-all duration-300 hover:border-volt hover:-translate-y-1 hover:shadow-2xl"
              >
                {/* Thumbnail with overlay & duration */}
                <div className="relative aspect-video w-full overflow-hidden bg-carbon">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnailUrl || "/images/gym/gym-photo-1.jpg"}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/20 to-transparent opacity-80 group-hover:opacity-50 transition-opacity" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="grid size-12 place-items-center rounded-full bg-volt/95 text-carbon shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play size={20} className="ml-0.5 fill-carbon" />
                    </span>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-carbon/90 px-2 py-0.5 text-[11px] font-semibold text-zinc-200 backdrop-blur">
                    <Clock size={11} className="text-volt" />
                    {video.duration || "10:00"}
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-5">
                  {/* Badges: Difficulty & Body Goal */}
                  <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                    <Chip tone={diffTone}>{video.difficultyLevel}</Chip>
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                      <Target size={10} />
                      {video.bodyGoal}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="line-clamp-2 font-display text-lg tracking-wide text-zinc-100 group-hover:text-volt transition-colors">
                    {video.title}
                  </h3>

                  {/* Description preview */}
                  {video.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {video.description}
                    </p>
                  )}

                  {/* Coach attribution footer */}
                  <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="grid size-7 place-items-center rounded-full text-xs font-bold text-carbon"
                        style={{
                          background: `linear-gradient(135deg, hsl(${video.coachAvatarHue} 85% 62%), hsl(${(video.coachAvatarHue + 40) % 360} 85% 48%))`,
                        }}
                      >
                        {video.coachName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">{video.coachName}</p>
                        <p className="text-[10px] text-zinc-500">Certified KC Coach</p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-volt group-hover:underline">
                      Watch &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-steel shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-volt/10 text-volt">
                  <Play size={16} className="fill-volt" />
                </span>
                <div>
                  <h3 className="font-display text-lg tracking-wide uppercase text-zinc-100">
                    {activeVideo.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>Coach {activeVideo.coachName}</span>
                    <span>·</span>
                    <span className="text-volt">{activeVideo.difficultyLevel}</span>
                    <span>·</span>
                    <span className="text-sky-400">{activeVideo.bodyGoal}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-smoke hover:text-zinc-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-carbon">
              {activeVideo.videoUrl.includes("youtube") ||
              activeVideo.videoUrl.includes("youtu.be") ||
              activeVideo.videoUrl.includes("vimeo") ? (
                <iframe
                  src={getEmbedUrl(activeVideo.videoUrl)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : (
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            {/* Description & Coaching Tips */}
            {activeVideo.description && (
              <div className="border-t border-line bg-carbon/40 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Form Cues & Execution Notes:
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
                  {activeVideo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
