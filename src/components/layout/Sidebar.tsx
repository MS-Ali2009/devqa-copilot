'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, Settings, ShieldAlert, Github, Sparkles } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Workspace', href: '/', icon: LayoutDashboard },
    { label: 'Local History', href: '/history', icon: History },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'About & Privacy', href: '/about', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-0 w-64 h-screen shrink-0 flex flex-col justify-between border-r border-slate-800 bg-slate-950 transition-transform duration-200 ease-in-out light:bg-slate-50 light:border-slate-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 light:border-slate-300">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 light:text-slate-900 tracking-wide">
                DEVQA COPILOT
              </div>
              <div className="text-[11px] text-slate-400 light:text-slate-500">
                Personal Engineering AI
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Git & Privacy Notice */}
        <div className="p-4 border-t border-slate-800 space-y-3 light:border-slate-300">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-400 space-y-1 light:bg-slate-200 light:border-slate-300 light:text-slate-700">
            <div className="font-semibold text-slate-200 light:text-slate-900 flex items-center justify-between">
              <span>Local-First MVP</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[11px] leading-relaxed">
              No server database. Prompts and outputs reside strictly in your browser.
            </p>
          </div>

          <a
            href="https://github.com/MS-Ali2009/devqa-copilot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors light:bg-white light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100"
          >
            <Github className="w-3.5 h-3.5" />
            <span>MS-Ali2009 / devqa-copilot</span>
          </a>
        </div>
      </aside>
    </>
  );
}
