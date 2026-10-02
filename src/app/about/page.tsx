'use client';

import React from 'react';
import { ShieldCheck, Lock, Database, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 light:border-slate-300">
        <h2 className="text-xl font-bold text-slate-100 light:text-slate-900 tracking-tight">
          About &amp; Privacy Architecture
        </h2>
        <p className="text-xs text-slate-400 light:text-slate-600">
          DevQA Copilot is designed with privacy and security guardrails from Day 1. Read below to understand
          exactly what happens with your data.
        </p>
      </div>

      {/* Accurate Data Flow Notice */}
      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-blue-300">
          <Info className="w-4 h-4" />
          <span>How Your Data Flows</span>
        </div>
        <p className="text-blue-200/90 leading-relaxed">
          <strong>Local history</strong> is stored only in this browser&apos;s{' '}
          <code className="font-mono bg-blue-900/40 px-1 py-0.5 rounded">localStorage</code>. It is never
          sent to any server by this app.
        </p>
        <p className="text-blue-200/90 leading-relaxed">
          <strong>When you generate an artifact</strong>, the submitted content (your raw input, selected mode,
          and context fields) is sent to the configured AI provider (OpenAI) for processing via the
          server-side{' '}
          <code className="font-mono bg-blue-900/40 px-1 py-0.5 rounded">/api/generate</code> route.
          This app does not persist prompts or outputs on its server, but the AI provider&apos;s own privacy
          policy applies to content you submit.
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
            Generated artifacts are saved to your browser&apos;s{' '}
            <code className="font-mono text-emerald-400">localStorage</code>. No server database is
            attached. Clear history from Settings at any time.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Server-Side Isolated AI Calls</span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            Your OpenAI API key is kept exclusively on the server. It is never bundled in client-side
            JavaScript, never stored in browser cookies or localStorage, and never transmitted to the browser.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <EyeOff className="w-4 h-4" />
            <span>Zero Third-Party Analytics</span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            No telemetry trackers, Google Analytics, cookies, or session-recording scripts are installed
            in this application.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 light:bg-white light:border-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Database className="w-4 h-4" />
            <span>Zero Autonomous Writes (Drafts Only)</span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            This MVP cannot create Jira tickets, post GitHub comments, or mutate any external database.
            It produces structured drafts for you to review, edit, and copy.
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
          DevQA Copilot includes an automated heuristic secret scanner to warn you about API keys, tokens,
          and passwords found in your input. This scanner is <strong>not 100% foolproof</strong> and may
          miss novel secret formats. Always replace real API keys, customer PII, and production passwords
          with dummy placeholders before pasting.
        </p>
        <p className="text-amber-200/90 leading-relaxed">
          When a potential secret is detected, the artifact is <strong>not saved to history</strong> by
          default to protect your data.
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
          aria-label="View source code on GitHub (opens in new tab)"
        >
          <span>GitHub Repository</span>
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
