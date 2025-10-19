"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Settings, Monitor, Moon, Sun, Palette, Zap,
  Save, RotateCcw, Bell, Globe
} from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SettingsState {
  theme: 'light' | 'dark' | 'auto';
  highQuality: boolean;
  saveHistory: boolean;
  notifications: boolean;
  language: string;
  quality: number;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'dark',
    highQuality: true,
    saveHistory: true,
    notifications: true,
    language: 'en',
    quality: 85
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetSettings = () => {
    setSettings({
      theme: 'dark',
      highQuality: true,
      saveHistory: true,
      notifications: true,
      language: 'en',
      quality: 85
    });
    setHasChanges(false);
  };

  const saveSettings = () => {
    setHasChanges(false);
    onOpenChange(false);
  };

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
          className="relative z-10 w-full max-w-2xl max-h-[80vh] mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-surface flex flex-col h-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl glass-panel border border-glass-border">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Settings</h2>
                  <p className="text-sm text-glass-muted">Customize your experience</p>
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
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8">
              {/* Appearance Section */}
              <SettingsSection
                icon={<Palette className="w-5 h-5" />}
                title="Appearance"
                description="Customize the visual theme"
              >
                <div className="grid grid-cols-3 gap-3">
                  <ThemeOption
                    icon={<Sun />}
                    label="Light"
                    active={settings.theme === 'light'}
                    onClick={() => updateSetting('theme', 'light')}
                  />
                  <ThemeOption
                    icon={<Moon />}
                    label="Dark"
                    active={settings.theme === 'dark'}
                    onClick={() => updateSetting('theme', 'dark')}
                  />
                  <ThemeOption
                    icon={<Monitor />}
                    label="Auto"
                    active={settings.theme === 'auto'}
                    onClick={() => updateSetting('theme', 'auto')}
                  />
                </div>
              </SettingsSection>

              {/* Generation Settings */}
              <SettingsSection
                icon={<Zap className="w-5 h-5" />}
                title="Generation"
                description="Configure AI generation preferences"
              >
                <div className="space-y-4">
                  <SettingsToggle
                    label="High Quality Mode"
                    description="Use maximum quality for generation"
                    checked={settings.highQuality}
                    onChange={(checked) => updateSetting('highQuality', checked)}
                  />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">Output Quality</label>
                      <span className="text-sm text-glass-muted">{settings.quality}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.quality}
                      onChange={(e) => updateSetting('quality', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg bg-[rgba(255,255,255,0.12)] appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </SettingsSection>

              {/* Notifications */}
              <SettingsSection
                icon={<Bell className="w-5 h-5" />}
                title="Notifications"
                description="Manage notification preferences"
              >
                <SettingsToggle
                  label="Enable Notifications"
                  description="Receive notifications about completion"
                  checked={settings.notifications}
                  onChange={(checked) => updateSetting('notifications', checked)}
                />
              </SettingsSection>

              {/* Language & Region */}
              <SettingsSection
                icon={<Globe className="w-5 h-5" />}
                title="Language"
                description="Set your preferred language"
              >
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="glass-input w-full text-white"
                >
                  <option value="en" className="bg-gray-800">English</option>
                  <option value="zh" className="bg-gray-800">中文</option>
                  <option value="es" className="bg-gray-800">Español</option>
                  <option value="ja" className="bg-gray-800">日本語</option>
                </select>
              </SettingsSection>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-glass-border glass-panel">
              <div className="flex items-center justify-between">
                <button
                  onClick={resetSettings}
                  className="btn-glass flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => onOpenChange(false)}
                    className="btn-glass"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSettings}
                    disabled={!hasChanges}
                    className={`btn-glass-primary flex items-center gap-2 ${
                      !hasChanges && 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SettingsSection({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg glass-panel border border-glass-border text-glass-accent">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-glass-muted">{description}</p>
        </div>
      </div>
      <div className="ml-11">
        {children}
      </div>
    </div>
  );
}

function ThemeOption({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 ${
        active
          ? "glass-panel border-glass-accent text-white"
          : "glass-panel border-glass-border hover:border-glass-accent/50 text-glass-muted hover:text-white"
      }`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}

function SettingsToggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl glass-panel border border-glass-border hover:border-glass-accent/30 transition-all">
      <div className="flex-1">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        <p className="text-xs text-glass-muted">{description}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full border transition-all duration-200 relative flex-shrink-0 ${
          checked
            ? "bg-glass-accent/30 border-glass-accent/40"
            : "bg-[rgba(52,52,60,0.45)] border-glass-border"
        }`}
      >
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className={`w-4 h-4 rounded-full absolute top-0.5 transition-colors duration-200 ${
            checked ? "bg-glass-accent" : "bg-[rgba(240,240,248,0.75)]"
          }`}
        />
      </motion.button>
    </div>
  );
}
