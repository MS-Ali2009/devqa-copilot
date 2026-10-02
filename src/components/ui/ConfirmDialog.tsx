'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!isOpen) return;

    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 light:bg-white light:border-slate-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
              }`}
            >
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold text-slate-100 light:text-slate-900"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p
          id="confirm-dialog-description"
          className="text-xs text-slate-300 light:text-slate-600 leading-relaxed"
        >
          {description}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors light:bg-slate-100 light:text-slate-700 light:border-slate-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
