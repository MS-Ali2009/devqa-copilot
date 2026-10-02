'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Download, RotateCw, Sparkles, AlertCircle, Clock, Cpu, X, Info } from 'lucide-react';
import { DevQAGenerateResponse } from '@/types/copilot';
import { useToast } from '@/components/ui/Toast';
import { downloadMarkdown } from '@/lib/utils/markdown-exporter';

interface OutputPanelProps {
  response: DevQAGenerateResponse | null;
  isLoading: boolean;
  elapsedSeconds: number;
  error: string | null;
  onRegenerate: () => void;
  onCancel: () => void;
  onSelectSamplePrompt: (sampleText: string) => void;
}

export function OutputPanel({
  response,
  isLoading,
  elapsedSeconds,
  error,
  onRegenerate,
  onCancel,
  onSelectSamplePrompt,
}: OutputPanelProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!response?.markdownOutput) return;
    try {
      await navigator.clipboard.writeText(response.markdownOutput);
      setCopied(true);
      showToast('Markdown output copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const handleDownload = () => {
    if (!response?.markdownOutput) return;
    const mode = response.outputMode || 'output';
    const filename = `devqa-${mode}-${new Date().toISOString().slice(0, 10)}.md`;
    downloadMarkdown(response.markdownOutput, filename);
    showToast(`Downloaded as ${filename}`, 'success');
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div
        className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4 text-center light:bg-white light:border-slate-300"
        aria-busy="true"
        aria-label="Generating artifact, please wait"
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <Sparkles className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto animate-pulse" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-200 light:text-slate-800">
            Analyzing Input &amp; Generating Artifact…
          </div>
          <p className="text-xs text-slate-400 max-w-xs light:text-slate-500">
            Applying security boundaries, testability rules, and requirement schemas.
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-emerald-400 pt-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span aria-label={`Elapsed time: ${elapsedSeconds} seconds`}>{elapsedSeconds}s elapsed</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel generation"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-700 text-xs font-medium text-slate-300 hover:text-rose-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Cancel</span>
        </button>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 rounded-xl bg-rose-950/20 border border-rose-800/40 text-center space-y-4"
      >
        <div className="w-12 h-12 rounded-full bg-rose-900/40 border border-rose-700/60 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-rose-300">Generation Failed</div>
          <p className="text-xs text-rose-200/80 max-w-sm">{error}</p>
        </div>
        <button
          onClick={onRegenerate}
          aria-label="Retry generation"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-xs font-medium text-rose-200 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (!response) {
    return (
      <div className="h-full min-h-[460px] flex flex-col items-center justify-center p-8 rounded-xl bg-slate-900/20 border border-dashed border-slate-800 text-center space-y-5 light:bg-slate-50 light:border-slate-300">
        <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-400 light:bg-slate-200 light:border-slate-300 light:text-slate-600">
          <Sparkles className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-sm font-semibold text-slate-200 light:text-slate-800">
            DevQA Copilot Output Panel
          </h3>
          <p className="text-xs text-slate-400 light:text-slate-600 leading-relaxed">
            Paste a Jira story, API endpoint, bug notes, or PR summary on the left and click
            &ldquo;Generate Artifact&rdquo; or use quick sample presets below.
          </p>
        </div>

        {/* Quick Sample Prompts */}
        <div className="space-y-2 w-full max-w-md text-left">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center light:text-slate-600">
            Quick Sample Inputs:
          </div>
          <button
            onClick={() =>
              onSelectSamplePrompt(
                'Story: As a customer, I want to reset my account password using a secure 6-digit OTP code sent via SMS, so that I can recover my account if I forget my password. OTP must expire in 5 minutes. After 3 wrong attempts, lockout for 15 mins.'
              )
            }
            className="w-full text-xs p-2.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors text-left light:bg-white light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100"
          >
            <span className="font-semibold text-emerald-400">User Story:</span> Password Reset via SMS OTP
          </button>
          <button
            onClick={() =>
              onSelectSamplePrompt(
                'Bug Note: On Checkout page, when applying promo code "SUMMER2026!@#$", backend throws 500 internal server error with SQL syntax exception. User cart gets stuck. Reproducible on Chrome staging.'
              )
            }
            className="w-full text-xs p-2.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors text-left light:bg-white light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100"
          >
            <span className="font-semibold text-rose-400">Bug Note:</span> Promo Code 500 Crash on Special Chars
          </button>
        </div>
      </div>
    );
  }

  // 4. Generated Markdown Output View
  return (
    <div className="flex flex-col h-full rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden light:bg-white light:border-slate-300">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/60 light:bg-slate-100 light:border-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            {response.outputMode.replace(/_/g, ' ').toUpperCase()}
          </span>
          {response.meta?.isMock && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Mock Provider
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            aria-label="Copy markdown output to clipboard"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors light:bg-white light:border light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            aria-label="Download output as markdown file"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors light:bg-white light:border light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>.md</span>
          </button>

          <button
            onClick={onRegenerate}
            aria-label="Regenerate artifact (note: AI outputs may vary)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors light:bg-white light:border light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100"
          >
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>
      </div>

      {/* AI Output Disclaimer — permanent, non-dismissible */}
      <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-950/30 border-b border-amber-800/30 text-xs text-amber-200/90">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" aria-hidden="true" />
        <p>
          <strong>Draft only:</strong> AI-generated content is a draft. Review assumptions, security
          guidance, test coverage, and project-specific details before use.
        </p>
      </div>

      {/* Markdown Content Area — with overflow-x-auto for wide tables on mobile */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[700px] overflow-x-hidden light:text-slate-800">
        <div className="overflow-x-auto">
          <div className="prose prose-sm prose-invert max-w-none light:prose-not-invert text-sm text-slate-200 light:text-slate-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Safe link rendering: no javascript: URLs, external links get noopener
                a: ({ href, children, ...props }) => {
                  const safeHref =
                    href && /^(https?:|mailto:|#)/.test(href) ? href : '#';
                  const isExternal = safeHref.startsWith('http');
                  return (
                    <a
                      href={safeHref}
                      {...(isExternal
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                // Tables wrapped in horizontal scroll container
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-4 rounded-lg border border-slate-700 light:border-slate-300">
                    <table className="min-w-full text-xs" {...props}>
                      {children}
                    </table>
                  </div>
                ),
              }}
            >
              {response.markdownOutput}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Bottom Metadata Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] border-t border-slate-800 bg-slate-950/40 text-slate-400 light:bg-slate-100 light:border-slate-300 light:text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono">
            <Cpu className="w-3 h-3 text-slate-500" aria-hidden="true" />
            {response.meta?.modelUsed || 'gpt-4o-mini'}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-slate-500" aria-hidden="true" />
            {response.meta?.processingTimeMs}ms
          </span>
          {response.meta?.tokensUsed ? (
            <span className="font-mono">~{response.meta.tokensUsed} tokens</span>
          ) : null}
        </div>
        <span className="text-[10px] text-slate-500">
          Saved in browser localStorage
        </span>
      </div>
    </div>
  );
}
