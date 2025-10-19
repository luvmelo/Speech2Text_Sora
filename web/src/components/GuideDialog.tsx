"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Info, Mic, Sparkles, Film } from "lucide-react";

interface GuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GuideDialog({ open, onOpenChange }: GuideDialogProps) {
  if (!open) return null;

  const steps = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Step 1: Record Your Dream",
      description: "Click the microphone button and speak your dream description. Be detailed about emotions, colors, and atmosphere."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Step 2: AI Processing",
      description: "Our AI will transcribe your speech and engineer a cinematic prompt optimized for visual generation."
    },
    {
      icon: <Film className="w-6 h-6" />,
      title: "Step 3: View Results",
      description: "Review the generated narrative beats, visual keywords, and color palette. Your dream prompt is ready!"
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-2xl mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-surface overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl glass-panel border border-glass-border">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Quick Guide</h2>
                  <p className="text-sm text-glass-muted">How to use Dream Generator</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-all"
              >
                <X className="w-5 h-5 text-glass-muted hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl glass-panel border border-glass-border flex items-center justify-center text-glass-accent">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-glass-muted leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}

              {/* Tips Section */}
              <div className="mt-8 p-4 rounded-xl glass-panel border border-glass-accent/30">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-glass-accent" />
                  Pro Tips
                </h4>
                <ul className="space-y-2 text-sm text-glass-muted">
                  <li className="flex gap-2">
                    <span className="text-glass-accent">•</span>
                    <span>Speak for 30-120 seconds for best results</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-glass-accent">•</span>
                    <span>Include emotions, colors, and atmospheric details</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-glass-accent">•</span>
                    <span>Describe camera movements and visual transitions</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-glass-border glass-panel">
              <button
                onClick={() => onOpenChange(false)}
                className="btn-glass-primary w-full"
              >
                Got it, let's start!
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
