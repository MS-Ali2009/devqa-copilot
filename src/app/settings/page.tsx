'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/layout/ThemeProvider';
import { useToast } from '@/components/ui/Toast';
import { getLocalHistory, clearAllLocalHistory } from '@/lib/storage/local-history';
import {
  Settings,
  Languages,
  Palette,
  ShieldCheck,
  HardDrive,
  Cloud,
  Trash2,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OutputLanguage, OutputMode } from '@/types/copilot';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [defaultLanguage, setDefaultLanguage] = useState<OutputLanguage>('en');
  const [defaultOutputMode, setDefaultOutputMode] = useState<OutputMode>('full_analysis');
  const [historyCount, setHistoryCount] = useState(0);
  const [isConfirmLocalOpen, setIsConfirmLocalOpen] = useState(false);
  const [isConfirmCloudOpen, setIsConfirmCloudOpen] = useState(false);
  const [isClearingCloud, setIsClearingCloud] = useState(false);

  useEffect(() => {
    setHistoryCount(getLocalHistory().length);
    const savedLang = localStorage.getItem('devqa_default_language') as OutputLanguage | null;
    if (savedLang) setDefaultLanguage(savedLang);

    const savedMode = localStorage.getItem('devqa_default_mode') as OutputMode | null;
    if (savedMode) setDefaultOutputMode(savedMode);
  }, []);

  const handleSaveLanguage = (lang: OutputLanguage) => {
    setDefaultLanguage(lang);
    localStorage.setItem('devqa_default_language', lang);
    showToast(`Default language set to ${lang === 'en' ? 'English' : 'Roman Urdu'}`, 'success');
  };

  const handleSaveMode = (mode: OutputMode) => {
    setDefaultOutputMode(mode);
    localStorage.setItem('devqa_default_mode', mode);
    showToast(`Default mode updated to ${mode.replace(/_/g, ' ')}`, 'success');
  };

  const confirmClearLocalHistory = () => {
    clearAllLocalHistory();
    setHistoryCount(0);
    setIsConfirmLocalOpen(false);
    showToast('Local browser history cleared.', 'success');
  };

  const confirmClearCloudHistory = async () => {
    setIsClearingCloud(true);
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        showToast('Cloud database history cleared.', 'success');
      } else {
        showToast('Failed to clear cloud history.', 'error');
      }
    } catch {
      showToast('Network error while clearing cloud history.', 'error');
    } finally {
      setIsClearingCloud(false);
      setIsConfirmCloudOpen(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800 light:border-slate-300">
        <h2 className="text-xl font-bold text-slate-100 light:text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Application Settings</span>
        </h2>
        <p className="text-xs text-slate-400 light:text-slate-600">
          Configure default behaviors, appearance, and manage cloud &amp; local storage.
        </p>
      </div>

      {/* 100% Free Architecture Info Box */}
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Free Cloud &amp; AI Architecture</span>
        </div>
        <p className="text-emerald-200/90 leading-relaxed">
          DevQA Copilot is powered by <strong>Groq Cloud</strong> (Llama 3.3 70B &bull; 14,400 req/day free) and{' '}
          <strong>Supabase</strong> (500MB free tier database). All API keys (<code className="font-mono bg-emerald-900/40 px-1 py-0.5 rounded">GROQ_API_KEY</code>,{' '}
          <code className="font-mono bg-emerald-900/40 px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code>,{' '}
          <code className="font-mono bg-emerald-900/40 px-1 py-0.5 rounded">SESSION_SECRET</code>) execute strictly server-side and are never exposed to browser bundles.
        </p>
      </div>

      <div className="space-y-4">
        {/* Output Language Preference */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200 light:text-slate-900">
              Default Output Language
            </h3>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600">
            Choose whether AI explanations, commentary, and QA summaries are rendered in English or Roman Urdu.
            (Code snippets, tables, test case steps, and status codes always remain in English).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleSaveLanguage('en')}
              className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors ${
                defaultLanguage === 'en'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-800'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white light:bg-slate-100 light:border-slate-300 light:text-slate-700'
              }`}
            >
              <span>Standard English (Recommended)</span>
              {defaultLanguage === 'en' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => handleSaveLanguage('roman_urdu')}
              className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors ${
                defaultLanguage === 'roman_urdu'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-800'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white light:bg-slate-100 light:border-slate-300 light:text-slate-700'
              }`}
            >
              <span>Roman Urdu / Hinglish</span>
              {defaultLanguage === 'roman_urdu' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Theme Preference */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200 light:text-slate-900">
              Appearance &amp; Theme
            </h3>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400 light:text-slate-600">
              Current Theme: <strong className="text-slate-200 uppercase light:text-slate-800">{theme}</strong>
            </span>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors light:bg-slate-100 light:border-slate-300 light:text-slate-800"
            >
              Toggle to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        {/* Cloud & Local Data Management */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-4 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200 light:text-slate-900">
              Data &amp; History Storage
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Clear Cloud History */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 light:bg-slate-50 light:border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                <Cloud className="w-3.5 h-3.5" />
                <span>Supabase Cloud History</span>
              </div>
              <p className="text-[11px] text-slate-400 light:text-slate-600">
                Purge your synced tickets and test suites from the remote PostgreSQL database.
              </p>
              <button
                onClick={() => setIsConfirmCloudOpen(true)}
                disabled={isClearingCloud}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-medium text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cloud History</span>
              </button>
            </div>

            {/* Clear Local History */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 light:bg-slate-50 light:border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Local Browser Storage</span>
              </div>
              <p className="text-[11px] text-slate-400 light:text-slate-600">
                Purge cached items stored in this browser ({historyCount} items).
              </p>
              <button
                onClick={() => setIsConfirmLocalOpen(true)}
                disabled={historyCount === 0}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-700 text-xs font-medium text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Local Storage</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Local Storage */}
      <ConfirmDialog
        isOpen={isConfirmLocalOpen}
        title="Purge Local Storage History?"
        description="Are you sure you want to clear all browser localStorage history? This action is permanent and cannot be undone."
        confirmLabel="Purge Local"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmClearLocalHistory}
        onCancel={() => setIsConfirmLocalOpen(false)}
      />

      {/* Confirmation Dialog: Cloud Storage */}
      <ConfirmDialog
        isOpen={isConfirmCloudOpen}
        title="Clear Supabase Cloud History?"
        description="Are you sure you want to delete all your saved history records from your Supabase cloud database? This will remove synced history across all devices."
        confirmLabel="Clear Cloud History"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmClearCloudHistory}
        onCancel={() => setIsConfirmCloudOpen(false)}
      />
    </div>
  );
}
