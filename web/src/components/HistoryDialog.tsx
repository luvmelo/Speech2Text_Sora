"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, History, Clock, Trash2 } from "lucide-react";

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  // Placeholder data
  const generations = [
    { id: 1, prompt: "A mystical forest with glowing mushrooms", timestamp: new Date().toISOString(), thumbnail: null },
    { id: 2, prompt: "Cyberpunk cityscape at night", timestamp: new Date().toISOString(), thumbnail: null },
    { id: 3, prompt: "Ancient temple in the clouds", timestamp: new Date().toISOString(), thumbnail: null },
  ];

  if (!open) return null;

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
          className="relative z-10 w-full max-w-3xl max-h-[80vh] mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-surface flex flex-col h-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl glass-panel border border-glass-border">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Generation History</h2>
                  <p className="text-sm text-glass-muted">View your past generations</p>
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
            <div className="flex-1 overflow-y-auto p-6">
              {generations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Clock className="w-16 h-16 text-glass-muted/40 mb-4" />
                  <p className="text-glass-muted text-lg">No generations yet</p>
                  <p className="text-glass-muted/60 text-sm mt-2">Your generation history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generations.map((gen) => (
                    <motion.div
                      key={gen.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-panel p-4 rounded-xl border border-glass-border hover:border-glass-accent/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-white font-medium mb-1">{gen.prompt}</p>
                          <p className="text-xs text-glass-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(gen.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-glass-muted transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-glass-border glass-panel">
              <button
                onClick={() => onOpenChange(false)}
                className="btn-glass w-full"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
