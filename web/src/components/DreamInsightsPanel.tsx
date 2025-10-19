"use client";

import { motion } from "framer-motion";
import { BookOpen, Film, Sparkles, Workflow } from "lucide-react";

export interface DreamInsights {
  transcript: string;
  soraPrompt: string;
  narrativeBeats: string[];
  visualKeywords: string[];
  emotionalTone: string;
  colorPalette: string;
  cameraStyle: string;
  motionStyle: string;
  negativePrompts?: string[];
  videoJob: {
    jobId: string;
    status: string;
    downloadUrl?: string;
  };
}

interface DreamInsightsPanelProps {
  data: DreamInsights | null;
  status: "idle" | "transcribing" | "engineering" | "submitting" | "ready" | "error";
  error?: string | null;
  onGenerateVideo?: () => void;
  videoState?: {
    status: "idle" | "generating" | "ready" | "error";
    url?: string | null;
    error?: string | null;
    jobId?: string | null;
  };
}

const STATUS_CONFIG: Record<
  DreamInsightsPanelProps["status"],
  { label: string; tone: string; accent: string }
> = {
  idle: {
    label: "Idle",
    tone: "bg-[rgba(255,255,255,0.16)] text-[rgba(244,248,255,0.92)]",
    accent: "bg-[rgba(255,255,255,0.82)]",
  },
  transcribing: {
    label: "Transcribing audio",
    tone: "bg-[rgba(255,255,255,0.16)] text-[rgba(244,248,255,0.92)]",
    accent: "bg-[rgba(255,255,255,0.82)]",
  },
  engineering: {
    label: "Engineering prompt",
    tone: "bg-[rgba(255,255,255,0.16)] text-[rgba(244,248,255,0.92)]",
    accent: "bg-[rgba(255,255,255,0.82)]",
  },
  submitting: {
    label: "Submitting to Sora",
    tone: "bg-[rgba(255,255,255,0.16)] text-[rgba(244,248,255,0.92)]",
    accent: "bg-[rgba(255,255,255,0.82)]",
  },
  ready: {
    label: "Dream prompt ready",
    tone: "bg-[rgba(255,255,255,0.16)] text-[rgba(244,248,255,0.92)]",
    accent: "bg-[rgba(255,255,255,0.82)]",
  },
  error: {
    label: "Pipeline error",
    tone: "bg-[rgba(255,255,255,0.16)] text-[rgba(244,248,255,0.92)]",
    accent: "bg-[rgba(255,255,255,0.82)]",
  },
};

export default function DreamInsightsPanel({ data, status, error, onGenerateVideo, videoState }: DreamInsightsPanelProps) {
  const { label, tone, accent } = STATUS_CONFIG[status];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      className="panel overflow-hidden p-6 sm:p-10"
    >
      <div className="flex flex-col gap-6 text-white/80 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="chip">Step 02 · Structure</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            We sculpt the Sora brief
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-white/70">
            Transcript → key beats, anchors, and motion cues tuned for a dreamy, diffused render.
          </p>
        </div>
        <span className={`inline-flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.24)] px-4 sm:px-5 py-2 text-xs font-medium ${tone}`}>
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${accent} opacity-45`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${accent}`} />
          </span>
          {label}
        </span>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-[rgba(255,255,255,0.24)] bg-[rgba(255,255,255,0.12)] px-6 py-5 text-sm text-[rgba(244,248,255,0.92)] backdrop-blur-2xl">
          {error}
        </div>
      ) : null}

      <div className="mt-8 sm:mt-10 grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {/* Left Column - Main Content */}
        <div className="space-y-6 sm:space-y-8">
          {data ? (
            <>
              <InsightCard
                title="Transcript"
                icon={<BookOpen className="h-4 w-4" />}
                body={data.transcript}
              />
              <InsightCard
                title="Engineered Sora Prompt"
                icon={<Film className="h-4 w-4" />}
                body={data.soraPrompt}
                emphasis
              />
              {/* Video Generation Panel - Moved to left column bottom */}
              <VideoGenerationPanel
                status={videoState?.status ?? "idle"}
                videoUrl={videoState?.url ?? null}
                errorMessage={videoState?.error ?? null}
                jobId={videoState?.jobId ?? data.videoJob.jobId}
                previousJobStatus={data.videoJob.status}
                onGenerate={onGenerateVideo}
              />
            </>
          ) : (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {data ? (
            <>
              <GlossaryGrid items={data.narrativeBeats} title="Narrative beats" icon={<Workflow className="h-4 w-4" />} />
              <GlossaryGrid items={data.visualKeywords} title="Visual anchors" icon={<Sparkles className="h-4 w-4" />} />
              <InsightTiles
                notes={[
                  { label: "Mood", value: data.emotionalTone },
                  { label: "Palette", value: data.colorPalette },
                  { label: "Camera", value: data.cameraStyle },
                  { label: "Motion", value: data.motionStyle },
                ]}
              />
            </>
          ) : (
            <>
              <SkeletonGrid />
              <SkeletonCard />
            </>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function InsightCard({ title, icon, body, emphasis }: { title: string; icon: React.ReactNode; body: string; emphasis?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-6 backdrop-blur-2xl ${
        emphasis
          ? "border-[rgba(255,255,255,0.28)] bg-[linear-gradient(150deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))] shadow-[0_3px_10px_rgba(0,0,0,0.16)]"
          : "border-[rgba(255,255,255,0.22)] bg-[linear-gradient(150deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
      }`}
    >
      <div className="flex items-center gap-3 text-white/80">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.12)] text-white">
          {icon}
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-[0.24rem] text-white">{title}</h3>
      </div>
      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/75">{body}</p>
    </div>
  );
}

function GlossaryGrid({ items, title, icon }: { items: string[]; title: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.22)] bg-[linear-gradient(150deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-6 backdrop-blur-2xl shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex items-center gap-3 text-white/80">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.12)] text-white">
          {icon}
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-[0.22rem] text-white">{title}</h3>
      </div>
      <ul className="space-y-3 text-sm leading-relaxed text-white/75">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgba(232,240,255,0.8)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InsightTiles({ notes }: { notes: { label: string; value: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {notes.map((note) => (
        <div
          key={note.label}
          className="rounded-2xl border border-[rgba(255,255,255,0.22)] bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] px-4 py-3 text-sm text-white/80 backdrop-blur-xl shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2rem] text-white/60">{note.label}</p>
          <p className="mt-1 text-sm font-medium text-white">{note.value}</p>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-[152px] rounded-3xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.12)] backdrop-blur-xl">
      <div className="h-full w-full animate-pulse rounded-3xl bg-[rgba(255,255,255,0.18)]" />
    </div>
  );
}

function VideoGenerationPanel({
  status,
  videoUrl,
  errorMessage,
  jobId,
  previousJobStatus,
  onGenerate,
}: {
  status: "idle" | "generating" | "ready" | "error";
  videoUrl: string | null;
  errorMessage: string | null;
  jobId: string | null;
  previousJobStatus: string;
  onGenerate?: () => void;
}) {
  const disabled = status === "generating" || !onGenerate;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[rgba(255,255,255,0.22)] bg-[linear-gradient(150deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-4 sm:p-6 backdrop-blur-2xl shadow-[0_2px_8px_rgba(0,0,0,0.14)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22rem] text-white/70">Step 03 · Generate</p>
          <h3 className="mt-2 text-base sm:text-lg font-semibold text-white">Sora 5s Render</h3>
          <p className="mt-1 text-xs sm:text-sm text-white/70">
            Review the engineered prompt, then render a dreamy 5s clip. Output saves to the studio vault.
          </p>
          <p className="mt-2 text-xs text-white/60">
            Last pipeline status: {previousJobStatus}
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled}
          className="button-primary w-full sm:w-auto whitespace-nowrap px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "generating" ? "Generating…" : "Generate Video"}
        </button>
      </div>

      {status === "error" && errorMessage ? (
        <p className="mt-4 text-sm text-red-300">{errorMessage}</p>
      ) : null}

      {status === "generating" ? (
        <p className="mt-4 text-xs sm:text-sm text-white/70">Sora is synthesising footage. This can take up to a few minutes…</p>
      ) : null}

      <div className="mt-4 sm:mt-5 rounded-xl sm:rounded-2xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] p-2 sm:p-3">
        {status === "ready" && videoUrl ? (
          <>
            <video
              key={videoUrl}
              className="aspect-video w-full rounded-lg sm:rounded-[18px] border border-[rgba(255,255,255,0.2)] bg-black/60"
              controls
              preload="metadata"
              playsInline
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="mt-3 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3 text-xs text-white/70">
              {jobId ? <span className="break-all">Job ID: {jobId}</span> : null}
              <a
                className="underline decoration-dotted underline-offset-4 hover:text-white"
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Download video
              </a>
            </div>
          </>
        ) : (
          <div className="aspect-video w-full rounded-lg sm:rounded-[18px] border border-dashed border-[rgba(255,255,255,0.2)] bg-[rgba(10,14,24,0.6)] p-4 sm:p-6 text-center text-xs sm:text-sm text-white/50">
            <p className="mt-6 sm:mt-10">{status === "generating" ? "Waiting for Sora to finish rendering…" : "Video output will appear here."}</p>
            {jobId && status !== "ready" ? (
              <p className="mt-2 text-xs text-white/40 break-all">Job ID: {jobId}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
