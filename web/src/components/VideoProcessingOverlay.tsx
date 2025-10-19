"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Film, Sparkles, Loader2, Wand2 } from "lucide-react";

interface VideoProcessingOverlayProps {
  show: boolean;
}

export default function VideoProcessingOverlay({ show }: VideoProcessingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center gap-8 rounded-3xl border border-[rgba(255,255,255,0.3)] bg-[linear-gradient(150deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))] px-12 py-12 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-md mx-4"
          >
            {/* Animated gradient orb background */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-40">
              <motion.div
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-3xl opacity-60"
                style={{ backgroundSize: "200% 200%" }}
              />
            </div>

            {/* Main animated icon container */}
            <div className="relative">
              {/* Pulsing outer ring */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 -m-8 rounded-full border-2 border-white/40"
              />

              {/* Middle rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 -m-6"
              >
                <div className="relative h-full w-full">
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.2,
                      }}
                      className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-40px)`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Center icon container */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-white/40 bg-gradient-to-br from-white/25 to-white/10 shadow-lg backdrop-blur-sm"
              >
                <Film className="h-12 w-12 text-white" />
                
                {/* Sparkle effects */}
                <motion.div
                  animate={{
                    scale: [0, 1.2, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute -right-2 -top-2"
                >
                  <Sparkles className="h-6 w-6 text-yellow-300" />
                </motion.div>

                <motion.div
                  animate={{
                    scale: [0, 1.2, 0],
                    rotate: [0, -180, -360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1,
                  }}
                  className="absolute -bottom-2 -left-2"
                >
                  <Wand2 className="h-5 w-5 text-cyan-300" />
                </motion.div>
              </motion.div>
            </div>

            {/* Spinning loader */}
            <Loader2 className="relative h-8 w-8 animate-spin text-white/90" />

            {/* Text content */}
            <div className="relative space-y-3 text-center">
              <motion.h3
                animate={{
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-2xl font-semibold text-white"
              >
                Generating Video
              </motion.h3>
              <p className="text-sm text-white/70">
                Sora is crafting your dream visualization...
              </p>
            </div>

            {/* Animated progress bar */}
            <div className="relative h-2 w-72 overflow-hidden rounded-full bg-white/15 shadow-inner">
              <motion.div
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent"
              />
            </div>

            {/* Tip text with pulse */}
            <motion.p
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative text-xs text-white/60"
            >
              This may take 1-2 minutes. Please wait...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

