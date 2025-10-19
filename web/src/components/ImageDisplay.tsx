"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageDisplayProps {
  image: string | null;
  images?: string[];
  isLoading: boolean;
  inputImage?: string | null;
  quantity?: number;
}

export default function ImageDisplay({ image, images, isLoading, inputImage, quantity = 1 }: ImageDisplayProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <Loader2 className="w-12 h-12 text-glass-accent animate-spin" />
              <div className="absolute inset-0 bg-glass-accent/20 rounded-full blur-xl animate-pulse" />
            </div>
            <p className="text-glass-muted text-sm">Generating your image...</p>
          </motion.div>
        ) : image ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full h-full"
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-glass-border">
              <Image
                src={image}
                alt="Generated result"
                fill
                className="object-contain"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-4 text-center p-8"
          >
            <div className="relative">
              <ImageIcon className="w-16 h-16 text-glass-muted/40" />
              <div className="absolute inset-0 bg-glass-accent/10 rounded-full blur-2xl" />
            </div>
            <div>
              <p className="text-glass-muted text-lg font-medium">Your creation will appear here</p>
              <p className="text-glass-muted/60 text-sm mt-1">Upload an image and enter a prompt to begin</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

