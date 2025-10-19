"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { History, Info, Settings, Menu, X } from "lucide-react";
import SettingsDialog from "./SettingsDialog";
import HistoryDialog from "./HistoryDialog";
import GuideDialog from "./GuideDialog";

export default function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuAction = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="fixed inset-x-0 top-4 sm:top-8 z-50 flex justify-center px-4 sm:px-6"
      >
        <nav className="nav-shell w-full max-w-4xl justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-[rgba(255,255,255,0.24)] bg-[linear-gradient(150deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))] backdrop-blur-2xl">
              <Image src="/logo.svg" alt="DreamVisualizer logo" fill priority className="object-cover" />
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-[0.2rem] sm:tracking-[0.28rem] uppercase text-[rgba(232,244,255,0.88)]">
              DreamVisualizer
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            <HeaderButton icon={<History className="h-4 w-4" />} label="Sessions" onClick={() => setHistoryOpen(true)} />
            <HeaderButton icon={<Info className="h-4 w-4" />} label="Guide" onClick={() => setGuideOpen(true)} />
            <HeaderButton icon={<Settings className="h-4 w-4" />} label="Preferences" onClick={() => setSettingsOpen(true)} />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full border border-[rgba(255,255,255,0.22)] bg-[linear-gradient(145deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))] text-white/80 hover:text-white transition-all"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-20 sm:top-24 right-4 z-50 w-64 rounded-2xl border border-[rgba(255,255,255,0.24)] bg-[linear-gradient(150deg,rgba(255,255,255,0.95),rgba(255,255,255,0.85))] backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] md:hidden"
            >
              <div className="p-4 space-y-2">
                <MobileMenuItem
                  icon={<History className="h-5 w-5" />}
                  label="Sessions"
                  onClick={() => handleMenuAction(() => setHistoryOpen(true))}
                />
                <MobileMenuItem
                  icon={<Info className="h-5 w-5" />}
                  label="Guide"
                  onClick={() => handleMenuAction(() => setGuideOpen(true))}
                />
                <MobileMenuItem
                  icon={<Settings className="h-5 w-5" />}
                  label="Preferences"
                  onClick={() => handleMenuAction(() => setSettingsOpen(true))}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
      <GuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
}

function HeaderButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onClick}
      className="button-secondary"
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </motion.button>
  );
}

function MobileMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-white/50 active:bg-white/70 transition-all"
    >
      <span className="text-gray-700">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
