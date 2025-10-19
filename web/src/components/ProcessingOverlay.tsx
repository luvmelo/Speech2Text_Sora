"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Mic, Brain } from "lucide-react";

interface ProcessingOverlayProps {
  show: boolean;
  stage: "transcribing" | "engineering" | "submitting" | null;
}

const STAGE_CONFIG = {
  transcribing: {
    icon: Mic,
    label: "Transcribing audio",
    description: "Converting your voice to text...",
    color: "from-blue-500 to-cyan-500"
  },
  engineering: {
    icon: Brain,
    label: "Engineering prompt",
    description: "Crafting cinematic dream prompt...",
    color: "from-purple-500 to-pink-500"
  },
  submitting: {
    icon: Sparkles,
    label: "Finalizing",
    description: "Preparing your dream visualization...",
    color: "from-amber-500 to-orange-500"
  }
};

export default function ProcessingOverlay({ show, stage }: ProcessingOverlayProps) {
  if (!show || !stage) return null;

  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center gap-6 rounded-3xl border border-[rgba(255,255,255,0.24)] bg-[linear-gradient(150deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] px-12 py-10 backdrop-blur-3xl shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-30">
            <motion.div
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className={`absolute inset-0 bg-gradient-to-r ${config.color} blur-3xl`}
              style={{ backgroundSize: "200% 200%" }}
            />
          </div>

          {/* Icon with pulse animation */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.15)]"
          >
            <Icon className="h-10 w-10 text-white" />
            
            {/* Orbiting particles */}
            {[0, 120, 240].map((rotation, i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.3,
                }}
                className="absolute inset-0"
                style={{ transformOrigin: "center" }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white"
                  style={{ transform: `rotate(${rotation}deg) translateY(-40px)` }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Spinning loader */}
          <Loader2 className="h-8 w-8 animate-spin text-white/80" />

          {/* Text content */}
          <div className="relative space-y-2 text-center">
            <h3 className="text-xl font-semibold text-white">{config.label}</h3>
            <p className="text-sm text-white/70">{config.description}</p>
          </div>

          {/* Progress bar */}
          <div className="relative h-1.5 w-64 overflow-hidden rounded-full bg-[rgba(255,255,255,0.15)]">
            <motion.div
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`h-full w-1/2 bg-gradient-to-r ${config.color}`}
            />
          </div>

          {/* Tip text */}
          <p className="relative text-xs text-white/50">
            This may take a few moments...
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

