'use client';

import React from 'react';
import { Sun, Moon, ShieldCheck, Terminal, Menu } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md transition-colors dark:border-slate-800 light:border-slate-300 light:bg-white/80">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100 light:text-slate-900 tracking-tight flex items-center gap-2">
              DevQA Copilot
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 light:bg-slate-200 light:text-slate-700 light:border-slate-300">
                v1.0 MVP
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Security indicator badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Server-Side Isolated</span>
        </div>

        {/* Shortcut tip */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono light:bg-slate-100 light:border-slate-300 light:text-slate-600">
          <span>Run:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-200 light:bg-white light:border-slate-300 light:text-slate-800">
            Ctrl+Enter
          </kbd>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-200"
          aria-label="Toggle dark/light theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>
    </header>
  );
}
