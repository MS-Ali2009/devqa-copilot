'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, ShieldCheck, Terminal, Menu, LogOut, User, Crown } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

interface CurrentUser {
  id: string;
  email: string;
  role: 'owner' | 'user';
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

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

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Security indicator badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Server-Side Isolated</span>
        </div>

        {/* User Context & Logout */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800 light:border-slate-300">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-200 light:text-slate-800 max-w-[160px] truncate">
                {user.email}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                {user.role === 'owner' ? (
                  <>
                    <Crown className="w-2.5 h-2.5 text-amber-400" />
                    <span className="text-amber-300 font-semibold uppercase">Owner</span>
                  </>
                ) : (
                  <span>Verified User</span>
                )}
              </span>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-800 hover:border-rose-800/50 text-xs font-medium text-slate-400 transition-colors light:bg-slate-100 light:border-slate-300 light:text-slate-700 light:hover:bg-rose-50 light:hover:text-rose-600"
              aria-label="Logout"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <User className="w-3.5 h-3.5" />
          </div>
        )}

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
