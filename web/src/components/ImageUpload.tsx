"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

export default function ImageUpload({ value, onChange, placeholder = "Upload image" }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !value && fileInputRef.current?.click()}
      className={`glass-panel relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
        ${isDragging ? 'border-glass-accent bg-glass-accent/10' : 'border-glass-border hover:border-glass-accent/50'} 
        ${value ? 'aspect-video' : 'aspect-video flex items-center justify-center'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full"
          >
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-2 p-8 text-center"
          >
            <Upload className="w-8 h-8 text-glass-accent" />
            <p className="text-sm text-glass-muted">{placeholder}</p>
            <p className="text-xs text-glass-muted/60">Drag & drop or click to browse</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

