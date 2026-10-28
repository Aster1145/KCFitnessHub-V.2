"use client";

import { useState, useTransition } from "react";
import {
  Video,
  UploadCloud,
  Play,
  Trash2,
  Search,
  Clock,
  Target,
  BarChart,
  ExternalLink,
  Film,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
} from "lucide-react";
import {
  uploadWorkoutVideo,
  deleteWorkoutVideo,
  type VideoWithCoach,
  type DifficultyLevel,
  type BodyGoal,
} from "@/actions/videos";
import { Card, Chip, Empty } from "@/components/ui";

const DIFFICULTY_OPTIONS: DifficultyLevel[] = ["Beginner", "Intermediate", "Advanced"];
const BODY_GOAL_OPTIONS: BodyGoal[] = [
  "Cut",
  "Bulk",
  "Fat Loss",
  "Body Recomposition",
];

export default function CoachVideoStudio({
  initialVideos,
  coachId,
}: {
  initialVideos: VideoWithCoach[];
  coachId: number;
}) {
  const [videos, setVideos] = useState<VideoWithCoach[]>(initialVideos);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<"url" | "file">("url");
  const [videoUrl, setVideoUrl] = useState("");
  const [localFileName, setLocalFileName] = useState("");
  const [difficultyLevel, setDifficultyLevel] =
    useState<DifficultyLevel>("Beginner");
  const [bodyGoal, setBodyGoal] = useState<BodyGoal>("Body Recomposition");
  const [duration, setDuration] = useState("10:00");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search states
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");
  const [filterGoal, setFilterGoal] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Active Video Modal
  const [playingVideo, setPlayingVideo] = useState<VideoWithCoach | null>(null);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFileName(file.name);
      // Create local object URL for preview / playback
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    }
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

  // Submit new video
  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg("Please provide a title for the tutorial video.");
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMsg("Please provide a video link or choose a video file.");
      return;
    }

    startTransition(async () => {
      const res = await uploadWorkoutVideo({
        title,
        videoUrl,
        difficultyLevel,
        bodyGoal,
        description,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        duration,
      });

      if (res.ok) {
        setSuccessMsg("Tutorial video uploaded and published to PT Lite members!");
        // Add optimistically to state
        const newVideo: VideoWithCoach = {
          id: res.videoId || crypto.randomUUID(),
          coachId,
          title: title.trim(),
          videoUrl: videoUrl.trim(),
          difficultyLevel,
          bodyGoal,
          description: description.trim() || null,
          thumbnailUrl:
            thumbnailUrl.trim() ||
            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
          duration: duration.trim() || "10:00",
          createdAt: new Date(),
          coachName: "You (Coach)",
          coachCode: "KCC",
          coachAvatarHue: 80,
        };
        setVideos((prev) => [newVideo, ...prev]);

        // Reset form
        setTitle("");
        setVideoUrl("");
        setLocalFileName("");
        setDescription("");
        setThumbnailUrl("");
      } else {
        setErrorMsg(res.error || "Failed to upload video.");
      }
    });
  };

  // Delete video
  const handleDelete = (videoId: string, videoTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${videoTitle}"?`)) return;

    startTransition(async () => {
      const res = await deleteWorkoutVideo(videoId);
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== videoId));
        if (playingVideo?.id === videoId) setPlayingVideo(null);
      } else {
        alert(res.error || "Failed to delete video.");
      }
    });
  };

  // Filtered video list
  const filteredVideos = videos.filter((v) => {
    if (filterDifficulty !== "ALL" && v.difficultyLevel !== filterDifficulty) {
      return false;
    }
    if (filterGoal !== "ALL" && v.bodyGoal !== filterGoal) {
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

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-line bg-steel p-4">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            Total Videos
          </p>
          <p className="font-display mt-1 text-3xl text-zinc-100">{videos.length}</p>
          <p className="mt-1 text-xs text-zinc-400">Available to PT members</p>
        </div>
        <div className="rounded-2xl border border-line bg-steel p-4">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            Difficulty Tiers
          </p>
          <p className="font-display mt-1 text-3xl text-volt">3 Levels</p>
          <p className="mt-1 text-xs text-zinc-400">Beginner · Inter · Adv</p>
        </div>
        <div className="rounded-2xl border border-line bg-steel p-4">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            Target Goals
          </p>
          <p className="font-display mt-1 text-3xl text-sky-400">4 Goals</p>
          <p className="mt-1 text-xs text-zinc-400">Cut · Bulk · Fat Loss · Recomp</p>
        </div>
        <div className="rounded-2xl border border-line bg-steel p-4">
          <p className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
            Audience Tier
          </p>
          <p className="font-display mt-1 text-3xl text-emerald-400">PT Lite & PT</p>
          <p className="mt-1 text-xs text-zinc-400">Automated RBAC active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Upload Form (5 columns on large screens) */}
        <div className="lg:col-span-5">
          <Card className="sticky top-28 border-line/80 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-volt/10 text-volt">
                  <Film size={18} />
                </span>
                <div>
                  <h2 className="font-display text-xl tracking-wide uppercase text-zinc-100">
                    Upload Tutorial
                  </h2>
                  <p className="text-xs text-zinc-400">Publish video to PT Lite library</p>
                </div>
              </div>
              <span className="rounded-full bg-volt/10 px-2 py-0.5 text-[10px] font-bold text-volt">
                COACH ONLY
              </span>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-volt/20 bg-volt/10 p-3 text-xs text-volt">
                <CheckCircle2 size={15} className="shrink-0 text-volt" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Incline Dumbbell Bench Press: Scapular Retraction"
                  className="w-full rounded-xl border border-line bg-smoke px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
                  required
                />
              </div>

              {/* Source Type Toggle */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Video Source *
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-carbon p-1">
                  <button
                    type="button"
                    onClick={() => setSourceType("url")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                      sourceType === "url"
                        ? "bg-steel text-volt shadow"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <ExternalLink size={13} />
                    Video URL (YouTube/Vimeo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("file")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                      sourceType === "file"
                        ? "bg-steel text-volt shadow"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <UploadCloud size={13} />
                    Upload Video File
                  </button>
                </div>
              </div>

              {/* URL input or File picker */}
              {sourceType === "url" ? (
                <div>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or Vimeo"
                    className="w-full rounded-xl border border-line bg-smoke px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Supports YouTube, Vimeo, and direct .mp4/.webm video links.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-smoke/60 p-4 transition-colors hover:border-volt hover:bg-smoke">
                    <UploadCloud size={24} className="mb-1 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-300">
                      {localFileName ? localFileName : "Choose video file (MP4, WebM)"}
                    </span>
                    <span className="text-[10px] text-zinc-500">Max size 250MB</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {videoUrl && (
                    <p className="mt-1 truncate text-[11px] text-volt">
                      File loaded: {localFileName}
                    </p>
                  )}
                </div>
              )}

              {/* Dropdowns: Difficulty & Body Goal */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Difficulty Level *
                  </label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) =>
                      setDifficultyLevel(e.target.value as DifficultyLevel)
                    }
                    className="w-full rounded-xl border border-line bg-smoke px-3 py-2.5 text-sm text-zinc-100 focus:border-volt focus:outline-none"
                  >
                    {DIFFICULTY_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl} className="bg-carbon text-zinc-100">
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Body Goal *
                  </label>
                  <select
                    value={bodyGoal}
                    onChange={(e) => setBodyGoal(e.target.value as BodyGoal)}
                    className="w-full rounded-xl border border-line bg-smoke px-3 py-2.5 text-sm text-zinc-100 focus:border-volt focus:outline-none"
                  >
                    {BODY_GOAL_OPTIONS.map((goal) => (
                      <option
                        key={goal}
                        value={goal}
                        className="bg-carbon text-zinc-100"
                      >
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration and Thumbnail (optional) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Duration (MM:SS)
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="10:00"
                    className="w-full rounded-xl border border-line bg-smoke px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Custom Thumbnail (Optional)
                  </label>
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Auto-detected if empty"
                    className="w-full rounded-xl border border-line bg-smoke px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Coaching Cues & Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detail proper form, elbow path, breathing, and common errors to avoid..."
                  className="w-full rounded-xl border border-line bg-smoke px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-volt focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-volt py-3 font-semibold text-carbon transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-carbon border-t-transparent" />
                    Publishing...
                  </span>
                ) : (
                  <>
                    <Plus size={16} />
                    Publish to PT Lite Library
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* Existing Video Library (7 columns on large screens) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Filter Bar */}
          <Card className="p-4">
            <div className="flex flex-col gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="text"
                  placeholder="Search tutorials by exercise or cue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-line bg-smoke py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-volt focus:outline-none"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Difficulty Filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Difficulty:
                  </span>
                  {["ALL", ...DIFFICULTY_OPTIONS].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFilterDifficulty(lvl)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        filterDifficulty === lvl
                          ? "bg-volt text-carbon shadow font-semibold"
                          : "bg-smoke text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                {/* Body Goal Filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Goal:
                  </span>
                  {["ALL", ...BODY_GOAL_OPTIONS].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setFilterGoal(goal)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        filterGoal === goal
                          ? "bg-sky-400 text-carbon shadow font-semibold"
                          : "bg-smoke text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Video List */}
          {filteredVideos.length === 0 ? (
            <Empty
              title="No tutorials match your filters"
              hint="Try clearing the search query or selecting a different goal/difficulty filter."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-steel transition-all duration-300 hover:border-volt/40 hover:shadow-xl"
                  >
                    {/* Thumbnail Preview with Duration badge */}
                    <div
                      className="relative aspect-video w-full cursor-pointer overflow-hidden bg-carbon"
                      onClick={() => setPlayingVideo(video)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={video.thumbnailUrl || "/images/gym/gym-photo-1.jpg"}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                      {/* Play Icon Overlay */}
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="grid size-12 place-items-center rounded-full bg-volt/90 text-carbon shadow-lg transition-transform duration-300 group-hover:scale-110">
                          <Play size={20} className="ml-0.5 fill-carbon" />
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-carbon/90 px-2 py-0.5 text-[11px] font-semibold text-zinc-200 backdrop-blur">
                        <Clock size={11} className="text-volt" />
                        {video.duration || "10:00"}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4">
                      {/* Badges */}
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Chip tone={diffTone}>{video.difficultyLevel}</Chip>
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                          <Target size={10} />
                          {video.bodyGoal}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        className="line-clamp-2 cursor-pointer font-display text-lg tracking-wide text-zinc-100 hover:text-volt transition-colors"
                        onClick={() => setPlayingVideo(video)}
                      >
                        {video.title}
                      </h3>

                      {/* Description */}
                      {video.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                          {video.description}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-carbon"
                            style={{
                              background: `linear-gradient(135deg, hsl(${video.coachAvatarHue} 85% 62%), hsl(${(video.coachAvatarHue + 40) % 360} 85% 48%))`,
                            }}
                          >
                            {video.coachName.charAt(0)}
                          </div>
                          <span className="text-xs text-zinc-400">{video.coachName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPlayingVideo(video)}
                            className="text-xs font-semibold text-volt hover:underline"
                          >
                            Play
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(video.id, video.title)}
                            disabled={isPending}
                            title="Delete Tutorial"
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-smoke hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Video Playback Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-steel shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-volt/10 text-volt">
                  <Play size={16} className="fill-volt" />
                </span>
                <div>
                  <h3 className="font-display text-lg tracking-wide uppercase text-zinc-100">
                    {playingVideo.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>Coach {playingVideo.coachName}</span>
                    <span>·</span>
                    <span className="text-volt">{playingVideo.difficultyLevel}</span>
                    <span>·</span>
                    <span className="text-sky-400">{playingVideo.bodyGoal}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-smoke hover:text-zinc-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative aspect-video w-full bg-carbon">
              {playingVideo.videoUrl.includes("youtube") ||
              playingVideo.videoUrl.includes("youtu.be") ||
              playingVideo.videoUrl.includes("vimeo") ? (
                <iframe
                  src={getEmbedUrl(playingVideo.videoUrl)}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : (
                <video
                  src={playingVideo.videoUrl}
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            {/* Modal Body / Description */}
            {playingVideo.description && (
              <div className="border-t border-line bg-carbon/40 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Technique Coaching Cues & Notes:
                </p>
                <p className="mt-1 text-sm text-zinc-300 whitespace-pre-line">
                  {playingVideo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
