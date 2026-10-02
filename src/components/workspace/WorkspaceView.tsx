'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { saveHistoryItem } from '@/lib/storage/local-history';
import { useToast } from '@/components/ui/Toast';
import { Sparkles, Trash2, ShieldCheck } from 'lucide-react';

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

  // Reopen item passed from History Page via query string or sessionStorage
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

  // Generate Handler
  const handleGenerate = useCallback(async () => {
    if (rawInput.trim().length < 5) {
      showToast('Please enter at least 5 characters of context.', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      // Auto save to local browser history
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown generation failure';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
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

  // Keyboard shortcut listener: Ctrl + Enter / Cmd + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate]);

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
            Engineering & QA Workspace
          </h2>
          <p className="text-xs text-slate-400 light:text-slate-600">
            Paste tickets, bug notes, user stories, or PR summaries to generate verified artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Local-First &bull; In-Browser History</span>
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
              className="w-full p-3.5 rounded-lg bg-slate-900 border border-slate-700/80 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-y light:bg-slate-50 light:border-slate-300 light:text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading || (!rawInput && !response)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors disabled:opacity-30 disabled:pointer-events-none light:text-slate-600 light:hover:text-rose-600 light:hover:bg-slate-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || rawInput.trim().length < 5}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Generating...' : 'Generate Artifact'}</span>
              <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-600/60 text-slate-900 font-bold">
                Ctrl+Enter
              </kbd>
            </button>
          </div>
        </div>

        {/* Right Column: Output Panel */}
        <div className="h-full min-h-[520px]">
          <OutputPanel
            response={response}
            isLoading={isLoading}
            error={error}
            onRegenerate={handleGenerate}
            onSelectSamplePrompt={(sampleText) => setRawInput(sampleText)}
          />
        </div>
      </div>
    </div>
  );
}
