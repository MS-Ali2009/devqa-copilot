'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  InputType,
  OutputMode,
  PlatformType,
  EnvironmentType,
  OutputLanguage,
  DevQAGenerateResponse,
} from '@/types/copilot';
import { InputControls } from './InputControls';
import { SecretWarningBanner } from './SecretWarningBanner';
import { OutputPanel } from './OutputPanel';
import { scanForSecrets } from '@/lib/security/secret-scanner';
import { saveHistoryItem, hasHighConfidenceSecret } from '@/lib/storage/local-history';
import { useToast } from '@/components/ui/Toast';
import { Sparkles, Trash2, X } from 'lucide-react';

export function WorkspaceView() {
  const { showToast } = useToast();

  // State
  const [rawInput, setRawInput] = useState('');
  const [inputType, setInputType] = useState<InputType>('user_story');
  const [outputMode, setOutputMode] = useState<OutputMode>('full_analysis');
  const [platform, setPlatform] = useState<PlatformType>('web');
  const [environment, setEnvironment] = useState<EnvironmentType>('qa');
  const [techStack, setTechStack] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [language, setLanguage] = useState<OutputLanguage>('en');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Security & Response State
  const [detectedSecrets, setDetectedSecrets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<DevQAGenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // AbortController ref for cancel support
  const abortControllerRef = useRef<AbortController | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reopen item passed from History Page via sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeRaw = sessionStorage.getItem('devqa_reopen_item');
      if (activeRaw) {
        try {
          const item = JSON.parse(activeRaw);
          setRawInput(item.rawInput || '');
          setInputType(item.inputType || 'user_story');
          setOutputMode(item.outputMode || 'full_analysis');
          setProjectContext(item.projectContext || '');
          setPlatform(item.platform || 'web');
          setEnvironment(item.targetEnvironment || 'qa');
          setTechStack(item.techStack || '');
          setLanguage(item.outputLanguage || 'en');
          if (item.markdownOutput) {
            setResponse({
              id: item.id,
              requestId: 'reopened',
              timestamp: item.createdAt,
              outputMode: item.outputMode,
              markdownOutput: item.markdownOutput,
              meta: { modelUsed: 'saved-history', processingTimeMs: 0 },
            });
          }
          sessionStorage.removeItem('devqa_reopen_item');
          showToast('Loaded item from local history', 'info');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [showToast]);

  // Real-time secret scanning
  useEffect(() => {
    const scan = scanForSecrets(rawInput);
    setDetectedSecrets(scan.detectedTypes);
  }, [rawInput]);

  // Elapsed time ticker — starts when loading, clears when done
  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [isLoading]);

  // Cancel Handler
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setError(null);
    showToast('Generation cancelled. Your input is preserved.', 'info');
  }, [showToast]);

  // Generate Handler
  const handleGenerate = useCallback(async () => {
    // Guard: do not allow duplicate generation while loading
    if (isLoading) return;

    if (rawInput.trim().length < 5) {
      showToast('Please enter at least 5 characters of context.', 'error');
      return;
    }

    // Create fresh AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal, // Client-side cancel support
        body: JSON.stringify({
          rawInput,
          inputType,
          outputMode,
          projectContext: projectContext.trim() || undefined,
          platform,
          techStack: techStack.trim() || undefined,
          targetEnvironment: environment,
          outputLanguage: language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to generate response.');
      }

      setResponse(data);

      // Secret-aware history save: skip if high-confidence secret detected
      const secretDetected = hasHighConfidenceSecret(rawInput);
      if (secretDetected) {
        showToast(
          '⚠️ Potential secret detected in input — artifact was NOT saved to history to protect your data.',
          'error'
        );
      } else {
        saveHistoryItem({
          id: data.id,
          createdAt: data.timestamp,
          title: rawInput.trim().slice(0, 60) + (rawInput.length > 60 ? '...' : ''),
          rawInput,
          inputType,
          outputMode,
          projectContext: projectContext || undefined,
          platform,
          techStack: techStack || undefined,
          targetEnvironment: environment,
          outputLanguage: language,
          markdownOutput: data.markdownOutput,
        });
        showToast('Artifact generated and saved to local history!', 'success');
      }
    } catch (err: unknown) {
      // Distinguish abort/cancel from real errors
      if (err instanceof Error && err.name === 'AbortError') {
        // Cancelled — already handled in handleCancel
        return;
      }
      const msg = err instanceof Error ? err.message : 'Unknown generation failure';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    isLoading,
    rawInput,
    inputType,
    outputMode,
    projectContext,
    platform,
    techStack,
    environment,
    language,
    showToast,
  ]);

  // Keyboard shortcut: Ctrl/Cmd + Enter — only fires when NOT loading
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading) {
          handleGenerate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate, isLoading]);

  const handleClear = () => {
    setRawInput('');
    setResponse(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800 light:border-slate-300">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 light:text-slate-900">
            Engineering &amp; QA Workspace
          </h2>
          <p className="text-xs text-slate-400 light:text-slate-600">
            Paste tickets, bug notes, user stories, or PR summaries to generate structured,
            review-ready engineering and QA artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
          <span aria-hidden="true">🛡</span>
          <span>Local History &bull; Server-Side AI</span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Input Form & Controls */}
        <div className="space-y-4 rounded-xl bg-slate-950/40 border border-slate-800 p-5 light:bg-white light:border-slate-300">
          <InputControls
            inputType={inputType}
            setInputType={setInputType}
            outputMode={outputMode}
            setOutputMode={setOutputMode}
            platform={platform}
            setPlatform={setPlatform}
            environment={environment}
            setEnvironment={setEnvironment}
            techStack={techStack}
            setTechStack={setTechStack}
            projectContext={projectContext}
            setProjectContext={setProjectContext}
            language={language}
            setLanguage={setLanguage}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
          />

          {/* Secret Warning Banner */}
          <SecretWarningBanner detectedTypes={detectedSecrets} />

          {/* Editor Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="raw-input-editor"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-600"
              >
                Raw Input Editor
              </label>
              <div className="text-[11px] text-slate-500 font-mono">
                {rawInput.length.toLocaleString()} / 15,000 chars
              </div>
            </div>

            <textarea
              id="raw-input-editor"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste raw Jira ticket, acceptance criteria draft, error logs, API endpoint details, or QA notes here..."
              rows={14}
              maxLength={15000}
              aria-label="Raw input editor — paste your engineering or QA content here"
              className="w-full p-3.5 rounded-lg bg-slate-900 border border-slate-700/80 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-y light:bg-slate-50 light:border-slate-300 light:text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading || (!rawInput && !response)}
              aria-label="Clear input and output"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors disabled:opacity-30 disabled:pointer-events-none light:text-slate-600 light:hover:text-rose-600 light:hover:bg-slate-100"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Cancel button — only visible while loading */}
              {isLoading && (
                <button
                  type="button"
                  onClick={handleCancel}
                  aria-label="Cancel generation"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 border border-slate-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading || rawInput.trim().length < 5}
                aria-label={isLoading ? 'Generating artifact, please wait…' : 'Generate artifact'}
                aria-busy={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isLoading ? `Generating… (${elapsedSeconds}s)` : 'Generate Artifact'}
                </span>
                {!isLoading && (
                  <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-600/60 text-slate-900 font-bold">
                    Ctrl+Enter
                  </kbd>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output Panel */}
        <div
          className="h-full min-h-[520px]"
          aria-live="polite"
          aria-label="Generated artifact output area"
        >
          <OutputPanel
            response={response}
            isLoading={isLoading}
            elapsedSeconds={elapsedSeconds}
            error={error}
            onRegenerate={handleGenerate}
            onCancel={handleCancel}
            onSelectSamplePrompt={(sampleText) => setRawInput(sampleText)}
          />
        </div>
      </div>
    </div>
  );
}
