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
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OutputLanguage, OutputMode } from '@/types/copilot';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [defaultLanguage, setDefaultLanguage] = useState<OutputLanguage>('en');
  const [defaultOutputMode, setDefaultOutputMode] = useState<OutputMode>('full_analysis');
  const [historyCount, setHistoryCount] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  const handleClearHistory = () => {
    setIsConfirmOpen(true);
  };

  const confirmClearHistory = () => {
    clearAllLocalHistory();
    setHistoryCount(0);
    setIsConfirmOpen(false);
    showToast('Local history cleared.', 'success');
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
          Configure default behaviors, appearance, and manage local browser storage.
        </p>
      </div>

      {/* Security Architecture Box */}
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Server-Side Secret Architecture</span>
        </div>
        <p className="text-emerald-200/90 leading-relaxed">
          DevQA Copilot does NOT allow entering OpenAI API keys into browser settings. All AI provider
          calls are processed exclusively on the server side via <code className="font-mono bg-emerald-900/40 px-1 py-0.5 rounded">/api/generate</code>.
          Configure your <code className="font-mono">OPENAI_API_KEY</code> securely in <code className="font-mono">.env.local</code> (for local use)
          or inside Vercel Project Settings &rarr; Environment Variables (for deployment).
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
              Appearance & Theme
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

        {/* Local Storage Management */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200 light:text-slate-900">
              Browser Storage (localStorage)
            </h3>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600">
            Schema version: <code className="font-mono text-emerald-400">v1</code> &bull; Total stored items: {historyCount}
          </p>

          <div className="pt-2">
            <button
              onClick={handleClearHistory}
              disabled={historyCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-medium text-rose-300 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Local Storage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Purge Local Storage History?"
        description="Are you sure you want to clear all browser localStorage history? This action is permanent and cannot be undone."
        confirmLabel="Purge History"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmClearHistory}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
