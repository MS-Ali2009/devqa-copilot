'use client';

import React from 'react';
import { ShieldCheck, Lock, Database, EyeOff, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 light:border-slate-300">
        <h2 className="text-xl font-bold text-slate-100 light:text-slate-900 tracking-tight">
          About & Privacy Architecture
        </h2>
        <p className="text-xs text-slate-400 light:text-slate-600">
          DevQA Copilot is engineered with privacy, testability, and strict security guardrails from Day 1.
        </p>
      </div>

      {/* Core Privacy Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Lock className="w-4 h-4" />
            <span>Local-First History</span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            All prompts and generated artifacts are stored strictly inside your browser&apos;s <code className="font-mono text-emerald-400">localStorage</code>.
            No server database is attached, and no user input is persisted server-side.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Server-Side Isolated Calls</span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            API keys are kept exclusively on the server. Your OpenAI API key is never bundled in client JavaScript,
            never stored in browser cookies or localStorage, and never transmitted to the browser.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <EyeOff className="w-4 h-4" />
            <span>Zero Third-Party Analytics</span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            No telemetry trackers, Google Analytics, cookies, or session-recording scripts are installed in this application.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Database className="w-4 h-4" />
            <span>Zero Autonomous Writes (Drafts Only)</span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            The MVP cannot create Jira tickets, post GitHub comments, or mutate any database. It produces structured drafts for you to review and copy.
          </p>
        </div>
      </div>

      {/* Security Guidance Banner */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          <span>Security Best Practice: Keep Sensitive Credentials Out</span>
        </div>
        <p className="text-amber-200/90 leading-relaxed">
          While DevQA Copilot includes an automated heuristic secret scanner to warn you about API keys, tokens, and passwords,
          no heuristic filter is 100% foolproof. Always replace real API keys, customer PII, and production passwords with dummy
          placeholders before pasting.
        </p>
      </div>

      {/* Future Roadmap & Approval Architecture */}
      <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-4 light:bg-white light:border-slate-300">
        <h3 className="text-sm font-bold text-slate-200 light:text-slate-900">
          Human-in-the-Loop Integration Architecture (Future Phases)
        </h3>
        <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
          When future phases introduce external integrations (Jira, GitHub PRs, Playwright execution),
          every single write operation will require explicit human approval via an interactive dialog displaying:
        </p>

        <ul className="text-xs text-slate-300 space-y-2 light:text-slate-700">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Exact Target System (e.g., Jira Cloud, GitHub Enterprise)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Exact Target Resource (e.g., PROJ-102, PR #42)</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Full Action Payload Draft with clear Approve / Reject buttons</span>
          </li>
        </ul>
      </div>

      {/* Author & Repository Link */}
      <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
        <span>DevQA Copilot &bull; Maintained by MS-Ali2009</span>
        <a
          href="https://github.com/MS-Ali2009/devqa-copilot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>GitHub Repository</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
