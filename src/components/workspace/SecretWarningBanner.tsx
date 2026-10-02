'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SecretWarningBannerProps {
  detectedTypes: string[];
}

export function SecretWarningBanner({ detectedTypes }: SecretWarningBannerProps) {
  if (detectedTypes.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-950/60 border border-amber-600/50 text-amber-200 text-xs sm:text-sm animate-fade-in"
    >
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <div className="font-semibold text-amber-300">
          Potential Sensitive Credentials Detected: {detectedTypes.join(', ')}
        </div>
        <p className="text-amber-200/90 text-xs leading-relaxed">
          Please avoid pasting real API keys, production tokens, or passwords into prompts.
          Remove or replace them with mock placeholders (e.g. <code className="px-1 py-0.5 bg-amber-900/50 rounded font-mono">sk-fake-key-123</code>).
        </p>
      </div>
    </div>
  );
}
