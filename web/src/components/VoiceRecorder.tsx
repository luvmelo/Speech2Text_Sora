"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, StopCircle, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

export interface VoiceRecorderProps {
  onSubmit: (payload: { audio: Blob; duration: number; breatheImage?: string | null }) => Promise<void>;
  disabled?: boolean;
}

type MediaRecorderState = "inactive" | "recording" | "paused";

export default function VoiceRecorder({ onSubmit, disabled = false }: VoiceRecorderProps) {
  const [recorderState, setRecorderState] = useState<MediaRecorderState>("inactive");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [breatheImage, setBreatheImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopTimer();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedMs((prev) => prev + 100);
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionError(null);
      return stream;
    } catch (error) {
      console.error(error);
      setPermissionError("无法访问麦克风，请检查浏览器设置。");
      throw error;
    }
  };

  const handleStart = async () => {
    if (disabled || recorderState === "recording") return;
    try {
      const stream = await requestStream();
      const preferredMimeType = "audio/webm;codecs=opus";
      const fallbackMimeType = "audio/webm";
      const mimeType = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(preferredMimeType)
        ? preferredMimeType
        : fallbackMimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setElapsedMs(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopTimer();
        setRecorderState("inactive");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        setIsUploading(true);
        try {
          await onSubmit({ audio: blob, duration: elapsedMs / 1000, breatheImage });
        } finally {
          setIsUploading(false);
        }
      };

      recorder.start();
      setRecorderState("recording");
      startTimer();
    } catch {
      // already handled
    }
  };

  const handleStop = () => {
    if (recorderState !== "recording") return;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBreatheImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  const milliseconds = Math.floor((elapsedMs % 1000) / 100)
    .toString()
    .padStart(1, "0");

  return (
    <section className="panel relative w-full overflow-hidden">
      <div className="relative z-10 grid gap-10 p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="max-w-2xl space-y-6 text-white/80">
          <div className="space-y-3">
            <p className="chip">Step 01 · Capture</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.25rem]">
              Voice the fragments of your dream
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Speak in present tense. Mention light, motion, textures, and how it feels.
            </p>
          </div>

          <div className="metrics">
            <div className="metric-card">
              <h4>Session length</h4>
              <p className="font-mono text-2xl tracking-tight text-white">
                {minutes}:{seconds}.{milliseconds}
              </p>
              <span className="text-xs text-white/60">2 minutes recommended</span>
            </div>
            <div className="metric-card">
              <h4>Signal quality</h4>
              <p className="text-white">Live monitoring</p>
              <span className="text-xs text-white/60">Noise reduction active</span>
            </div>
            <div className="metric-card">
              <h4>BREATHE</h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !breatheImage && fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all overflow-hidden
                  ${isDragging ? 'border-white/60 bg-white/10' : 'border-white/30 hover:border-white/50'}
                  ${breatheImage ? 'h-24' : 'h-24 flex items-center justify-center'}`}
              >
                <AnimatePresence mode="wait">
                  {breatheImage ? (
                    <motion.div
                      key="image"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src={breatheImage}
                        alt="Breathe data"
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBreatheImage(null);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center gap-1 p-2 text-center"
                    >
                      <Upload className="w-5 h-5 text-white/60" />
                      <p className="text-xs text-white/60">Upload chart</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-xs text-white/60">
                Night breathing sensor data
              </span>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col items-center justify-center gap-6 rounded-3xl border border-[rgba(255,255,255,0.22)] bg-[linear-gradient(150deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] px-10 py-8 text-center backdrop-blur-2xl shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
          <motion.button
            type="button"
            onClick={recorderState === "recording" ? handleStop : handleStart}
            disabled={disabled || isUploading}
            whileHover={{ scale: recorderState === "recording" ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex h-28 w-28 items-center justify-center rounded-[32px] border border-[rgba(255,255,255,0.22)] transition-all duration-300 ${
              recorderState === "recording"
                ? "bg-gradient-to-br from-[rgba(255,255,255,0.26)] via-[rgba(255,255,255,0.18)] to-[rgba(255,255,255,0.1)] shadow-[0_3px_10px_rgba(0,0,0,0.16)]"
                : "bg-gradient-to-br from-[rgba(255,255,255,0.2)] via-[rgba(255,255,255,0.12)] to-[rgba(255,255,255,0.06)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.18)]"
            }`}
          >
            {recorderState === "recording" ? (
              <StopCircle className="h-16 w-16 text-white drop-shadow-lg" />
            ) : (
              <Circle className="h-16 w-16 text-white drop-shadow-lg" />
            )}
          </motion.button>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {recorderState === "recording" ? "Tap to finish capture" : "Tap to begin capture"}
            </p>
            <p className="text-xs text-white/60">Audio is only kept for transcription.</p>
          </div>

          <AnimatePresence>
            {recorderState === "recording" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="badge"
              >
                <span className="status-dot" aria-hidden />
                Listening
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-10 pb-8">
        <div className="divider" />
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/60">
          {permissionError ? (
            <span className="text-red-300">{permissionError}</span>
          ) : (
            <>
              <span className="badge">Studio-grade denoise active</span>
              <span className="badge">48 kHz capture</span>
              {isUploading && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="badge flex items-center gap-2"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[color:var(--accent-blue)]" />
                  Uploading narration...
                </motion.span>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
