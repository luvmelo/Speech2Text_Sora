"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import VoiceRecorder from "@/components/VoiceRecorder";
import DreamInsightsPanel from "@/components/DreamInsightsPanel";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import VideoProcessingOverlay from "@/components/VideoProcessingOverlay";
import type { DreamInsights } from "@/components/DreamInsightsPanel";

type PipelineStatus = "idle" | "transcribing" | "engineering" | "submitting" | "ready" | "error";

interface DreamPipelineResponse {
  transcript: {
    text: string;
  };
  prompt: {
    sora_prompt: string;
    narrative_beats: string[];
    visual_keywords: string[];
    emotional_tone: string;
    color_palette: string;
    camera_style: string;
    motion_style: string;
    negative_prompts?: string[];
  };
  video: {
    job_id: string;
    status: string;
    download_url?: string;
  };
}

export default function Home() {
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [insights, setInsights] = useState<DreamInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Auto-fetch latest video on mount and when video generation completes
  useEffect(() => {
    const fetchLatestVideo = async () => {
      try {
        const response = await fetch("/api/videos/latest", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            setVideoUrl(data.url);
          }
        }
      } catch (err) {
        console.log("No latest video available yet");
      }
    };

    // Fetch on mount
    fetchLatestVideo();

    // Set up polling interval to check for new videos every 5 seconds when generating
    let intervalId: NodeJS.Timeout | null = null;
    if (videoStatus === "generating") {
      intervalId = setInterval(fetchLatestVideo, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [videoStatus]);

  const handleSubmission = async ({ audio, duration, breatheImage }: { audio: Blob; duration: number; breatheImage?: string | null }) => {
    setError(null);
    setInsights(null); // Clear previous results
    setStatus("transcribing");

    const formData = new FormData();
    formData.append("audio", audio, `dream-${Date.now()}.webm`);
    formData.append("duration", String(duration));

    if (breatheImage) {
      // Convert data URL to Blob
      const toBlob = async (dataUrl: string): Promise<Blob> => {
        const res = await fetch(dataUrl);
        return await res.blob();
      };
      try {
        const imgBlob = await toBlob(breatheImage);
        formData.append("breathe_image", imgBlob, `breathe-${Date.now()}.png`);
      } catch {}
    }

    try {
      // Stage 1: Transcribing
      await new Promise(resolve => setTimeout(resolve, 800));
      setStatus("engineering");

      // Stage 2: Engineering prompt
      const request = fetch("/api/dreams", {
        method: "POST",
        body: formData,
      });
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      setStatus("submitting");

      // Stage 3: Submitting
      const response = await request;
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Pipeline request failed" }));
        throw new Error(errorData.message || "Pipeline request failed");
      }

      const payload: DreamPipelineResponse = await response.json();
      
      // Small delay before showing results
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatus("ready");
      setInsights({
        transcript: payload.transcript.text,
        soraPrompt: payload.prompt.sora_prompt,
        narrativeBeats: payload.prompt.narrative_beats,
        visualKeywords: payload.prompt.visual_keywords,
        emotionalTone: payload.prompt.emotional_tone,
        colorPalette: payload.prompt.color_palette,
        cameraStyle: payload.prompt.camera_style,
        motionStyle: payload.prompt.motion_style,
        negativePrompts: payload.prompt.negative_prompts ?? [],
        videoJob: {
          jobId: payload.video.job_id,
          status: payload.video.status,
          downloadUrl: payload.video.download_url,
        },
      });
      setVideoStatus("idle");
      setVideoUrl(null);
      setVideoJobId(null);
      setVideoError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  const handleGenerateVideo = async () => {
    if (!insights) return;
    setVideoStatus("generating");
    setVideoError(null);
    setVideoUrl(null);
    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            sora_prompt: insights.soraPrompt,
            narrative_beats: insights.narrativeBeats,
            visual_keywords: insights.visualKeywords,
            emotional_tone: insights.emotionalTone,
            color_palette: insights.colorPalette,
            negative_prompts: insights.negativePrompts ?? [],
            camera_style: insights.cameraStyle,
            motion_style: insights.motionStyle,
          },
          options: {
            duration_seconds: 5,
            aspect_ratio: "16:9",
            format: "mp4",
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ message: "Video generation failed" }));
        throw new Error(errorPayload.message || "Video generation failed");
      }

      const payload = await response.json();
      setVideoJobId(payload.job_id ?? null);
      
      // Poll for the latest video after a short delay
      setTimeout(async () => {
        try {
          const latestResponse = await fetch("/api/videos/latest", { cache: "no-store" });
          if (latestResponse.ok) {
            const latestData = await latestResponse.json();
            if (latestData.url) {
              setVideoUrl(latestData.url);
              setVideoStatus("ready");
            }
          }
        } catch (err) {
          console.error("Failed to fetch latest video:", err);
          // Still mark as ready even if we can't fetch the latest
          setVideoStatus("ready");
          setVideoUrl(payload.download_url ?? null);
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setVideoStatus("error");
      setVideoError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const isProcessing = status === "transcribing" || status === "engineering" || status === "submitting";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Header />
      <div className="ambient-backdrop" />

      {/* Processing Overlay for dream pipeline */}
      <ProcessingOverlay 
        show={isProcessing} 
        stage={isProcessing ? status as "transcribing" | "engineering" | "submitting" : null} 
      />

      {/* Video Processing Overlay */}
      <VideoProcessingOverlay show={videoStatus === "generating"} />

      <section className="shell-container relative z-10">
        <div className="flex flex-col gap-6 lg:gap-10 lg:flex-row lg:items-center lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="max-w-3xl space-y-4 sm:space-y-6"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
              Whisper your dream.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-white/70">
              Hold record and describe the scene, mood, and motion for 30–120 seconds. We transcribe, sculpt the prompt, and hand it to Sora.
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/70">
              <span className="badge">Mention symbols &amp; feelings</span>
              <span className="badge">Stay in present tense</span>
              <span className="badge">We handle the Sora prompt</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <VoiceRecorder onSubmit={handleSubmission} disabled={status === "transcribing"} />
        </motion.div>

        <AnimatePresence>
          {(insights || status !== "idle") && (
            <motion.div
              key={`insights-${status}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            >
              <DreamInsightsPanel
                data={insights}
                status={status}
                error={error}
                onGenerateVideo={handleGenerateVideo}
                videoState={{
                  status: videoStatus,
                  url: videoUrl,
                  error: videoError,
                  jobId: videoJobId,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
