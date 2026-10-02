'use client';

import React from 'react';
import {
  InputType,
  OutputMode,
  PlatformType,
  EnvironmentType,
  OutputLanguage,
} from '@/types/copilot';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface InputControlsProps {
  inputType: InputType;
  setInputType: (val: InputType) => void;
  outputMode: OutputMode;
  setOutputMode: (val: OutputMode) => void;
  platform: PlatformType;
  setPlatform: (val: PlatformType) => void;
  environment: EnvironmentType;
  setEnvironment: (val: EnvironmentType) => void;
  techStack: string;
  setTechStack: (val: string) => void;
  projectContext: string;
  setProjectContext: (val: string) => void;
  language: OutputLanguage;
  setLanguage: (val: OutputLanguage) => void;
  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
}

export function InputControls({
  inputType,
  setInputType,
  outputMode,
  setOutputMode,
  platform,
  setPlatform,
  environment,
  setEnvironment,
  techStack,
  setTechStack,
  projectContext,
  setProjectContext,
  language,
  setLanguage,
  showAdvanced,
  setShowAdvanced,
}: InputControlsProps) {
  const inputTypes: { value: InputType; label: string }[] = [
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'user_story', label: 'User Story' },
    { value: 'bug_report', label: 'Bug Report / Raw Error' },
    { value: 'test_case_request', label: 'Test Case Request' },
    { value: 'regression_planning', label: 'Regression Planning' },
    { value: 'release_notes', label: 'Release Notes' },
    { value: 'api_specification', label: 'API Specification / Endpoint' },
    { value: 'code_pr_summary', label: 'Code / PR Summary' },
    { value: 'general_engineering_note', label: 'General Engineering Note' },
  ];

  const outputModes: { value: OutputMode; label: string; badge?: string }[] = [
    { value: 'full_analysis', label: 'Full DevQA Analysis', badge: 'Popular' },
    { value: 'qa_test_cases', label: 'QA Test Cases (Table format)', badge: 'P0' },
    { value: 'acceptance_criteria', label: 'Acceptance Criteria (Gherkin AC)' },
    { value: 'developer_checklist', label: 'Developer Implementation Checklist' },
    { value: 'bug_report', label: 'Structured Bug Report' },
    { value: 'regression_plan', label: 'Regression Test Plan' },
    { value: 'api_test_matrix', label: 'API Test Matrix' },
    { value: 'gherkin_scenarios', label: 'Gherkin / BDD Feature Scenarios' },
    { value: 'jira_ready', label: 'Jira Ticket / Comment Draft' },
    { value: 'pr_review_checklist', label: 'PR Review Checklist' },
    { value: 'release_risk', label: 'Release Risk Assessment' },
    { value: 'qa_test_summary', label: 'QA Test Summary & Sign-off' },
    { value: 'code_review_security', label: 'Security & Code Review Audit' },
    { value: 'daily_work_summary', label: 'Daily Work & Standup Summary' },
    { value: 'edge_case_analyzer', label: 'Edge-Case & Negative Analyzer' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Input Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-600">
            Source Input Type
          </label>
          <select
            value={inputType}
            onChange={(e) => setInputType(e.target.value as InputType)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 light:bg-white light:border-slate-300 light:text-slate-900"
          >
            {inputTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Output Mode */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-600">
            Target Output Mode
          </label>
          <select
            value={outputMode}
            onChange={(e) => setOutputMode(e.target.value as OutputMode)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-sm text-emerald-400 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 light:bg-white light:border-slate-300 light:text-emerald-700"
          >
            {outputModes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} {m.badge ? `(${m.badge})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Project Context Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none light:text-slate-600 light:hover:text-emerald-600"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>{showAdvanced ? 'Hide Project Context & Environment' : 'Add Project Context, Platform & Language (Optional)'}</span>
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Collapsible Context Controls */}
      {showAdvanced && (
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3.5 animate-fade-in light:bg-slate-100 light:border-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Platform */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 light:text-slate-600">Target Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-200 light:bg-white light:border-slate-300 light:text-slate-800"
              >
                <option value="web">Web Application</option>
                <option value="mobile">Mobile (iOS / Android)</option>
                <option value="api">Backend API / Microservice</option>
                <option value="desktop">Desktop App</option>
                <option value="other">Other / Multi-platform</option>
              </select>
            </div>

            {/* Environment */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 light:text-slate-600">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-200 light:bg-white light:border-slate-300 light:text-slate-800"
              >
                <option value="qa">QA / Test</option>
                <option value="dev">Development</option>
                <option value="staging">Staging / UAT</option>
                <option value="production">Production</option>
                <option value="local">Local</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 light:text-slate-600">Output Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as OutputLanguage)}
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-200 light:bg-white light:border-slate-300 light:text-slate-800"
              >
                <option value="en">English (Default)</option>
                <option value="roman_urdu">Roman Urdu / Hinglish</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tech Stack */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 light:text-slate-600">Tech Stack (Optional)</label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. Next.js, Node.js, Postgres, Jest"
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800"
              />
            </div>

            {/* Project Context */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 light:text-slate-600">Project Context (Optional)</label>
              <input
                type="text"
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                placeholder="e.g. FinTech checkout, HIPAA medical app"
                className="w-full px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 light:bg-white light:border-slate-300 light:text-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
