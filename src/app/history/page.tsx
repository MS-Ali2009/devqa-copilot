'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getLocalHistory,
  deleteHistoryItem,
  clearAllLocalHistory,
  searchLocalHistory,
} from '@/lib/storage/local-history';
import { HistoryItemV1 } from '@/types/history';
import { useToast } from '@/components/ui/Toast';
import { downloadMarkdown } from '@/lib/utils/markdown-exporter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search,
  Trash2,
  ExternalLink,
  Copy,
  Download,
  Clock,
  AlertTriangle,
  FolderOpen,
  Cloud,
  HardDrive,
  RefreshCw,
} from 'lucide-react';

interface DisplayHistoryItem {
  id: string;
  source: 'cloud' | 'local';
  createdAt: string;
  title: string;
  rawInput: string;
  inputType: string;
  outputMode: string;
  platform?: string;
  environment?: string;
  language?: string;
  markdownOutput: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [items, setItems] = useState<DisplayHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<DisplayHistoryItem | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSource, setActiveSource] = useState<'cloud' | 'local'>('cloud');

  // Load history from Supabase cloud first, falling back to localStorage
  const loadHistory = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          const cloudItems: DisplayHistoryItem[] = data.items.map((r: {
            id: string;
            created_at: string;
            input_text: string;
            output_text: string;
            input_type?: string;
            output_mode?: string;
            platform?: string;
            environment?: string;
            language?: string;
          }) => ({
            id: r.id,
            source: 'cloud',
            createdAt: r.created_at,
            title: r.input_text.trim().slice(0, 60) + (r.input_text.length > 60 ? '...' : ''),
            rawInput: r.input_text,
            inputType: r.input_type || 'user_story',
            outputMode: r.output_mode || 'full_analysis',
            platform: r.platform,
            environment: r.environment,
            language: r.language,
            markdownOutput: r.output_text,
          }));

          setItems(cloudItems);
          setActiveSource('cloud');
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Ignore network / server error and fallback to localStorage
    }

    // Fallback: localStorage
    const local = getLocalHistory();
    const localItems: DisplayHistoryItem[] = local.map((i) => ({
      id: i.id,
      source: 'local',
      createdAt: i.createdAt,
      title: i.title,
      rawInput: i.rawInput,
      inputType: i.inputType,
      outputMode: i.outputMode,
      platform: i.platform,
      environment: i.targetEnvironment,
      language: i.outputLanguage,
      markdownOutput: i.markdownOutput,
    }));

    setItems(localItems);
    setActiveSource('local');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Client-side search filtering
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.rawInput.toLowerCase().includes(q) ||
      item.outputMode.toLowerCase().includes(q) ||
      item.inputType.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (item: DisplayHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (item.source === 'cloud') {
      try {
        await fetch(`/api/history/${item.id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete from cloud:', err);
      }
    } else {
      deleteHistoryItem(item.id);
    }

    const updated = items.filter((i) => i.id !== item.id);
    setItems(updated);
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    }
    showToast('History item removed.', 'info');
  };

  const handleClearAll = async () => {
    if (activeSource === 'cloud') {
      try {
        await fetch('/api/history', { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to clear cloud history:', err);
      }
    }
    clearAllLocalHistory();
    setItems([]);
    setSelectedItem(null);
    setShowClearModal(false);
    showToast(`All ${activeSource === 'cloud' ? 'cloud & local' : 'local'} history cleared.`, 'success');
  };

  const handleReopenInWorkspace = (item: DisplayHistoryItem) => {
    if (typeof window !== 'undefined') {
      const historyItem: HistoryItemV1 = {
        id: item.id,
        version: 1,
        createdAt: item.createdAt,
        title: item.title,
        rawInput: item.rawInput,
        inputType: item.inputType as HistoryItemV1['inputType'],
        outputMode: item.outputMode as HistoryItemV1['outputMode'],
        platform: item.platform as HistoryItemV1['platform'],
        targetEnvironment: item.environment as HistoryItemV1['targetEnvironment'],
        outputLanguage: item.language as HistoryItemV1['outputLanguage'],
        markdownOutput: item.markdownOutput,
      };
      sessionStorage.setItem('devqa_reopen_item', JSON.stringify(historyItem));
    }
    router.push('/');
  };

  const handleCopy = async (markdown: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(markdown);
      showToast('Output copied to clipboard!', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleDownload = (item: DisplayHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const filename = `devqa-${item.outputMode}-${item.id.slice(0, 8)}.md`;
    downloadMarkdown(item.markdownOutput, filename);
    showToast(`Downloaded as ${filename}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 light:border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 light:text-slate-900 tracking-tight">
              Engineering &amp; QA History
            </h2>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                activeSource === 'cloud'
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {activeSource === 'cloud' ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              <span>{activeSource === 'cloud' ? 'Supabase Cloud' : 'Browser Local'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
            {activeSource === 'cloud'
              ? 'Synced securely to your private Supabase database. Accessible across your devices.'
              : 'Stored offline in your browser localStorage. Reconnect or login to sync with cloud.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {items.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-medium text-rose-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search history by keyword, title, mode, or platform..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 light:bg-white light:border-slate-300 light:text-slate-900"
        />
      </div>

      {/* Main Content: List + Detail Split View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-slate-950/40 border border-slate-800 text-center space-y-3">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <span className="text-xs text-slate-400">Loading history items…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-3 light:bg-white light:border-slate-300">
          <FolderOpen className="w-10 h-10 text-slate-600" />
          <div className="text-sm font-semibold text-slate-300 light:text-slate-800">No History Items Found</div>
          <p className="text-xs text-slate-500 max-w-sm">
            Generate your first test cases, bug report, or acceptance criteria in the workspace to see it recorded here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* History Item Cards List */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                      : 'bg-slate-950/50 hover:bg-slate-900 border-slate-800/80 light:bg-white light:border-slate-300 light:hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                        {item.outputMode.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                          item.source === 'cloud'
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.source === 'cloud' ? <Cloud className="w-2.5 h-2.5" /> : <HardDrive className="w-2.5 h-2.5" />}
                        <span>{item.source === 'cloud' ? 'Cloud' : 'Local'}</span>
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono shrink-0">
                      <Clock className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </div>

                  <h3 className="text-xs font-medium text-slate-200 line-clamp-2 mt-2 leading-relaxed light:text-slate-800">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 light:border-slate-200">
                    <span className="capitalize">{item.inputType.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleCopy(item.markdownOutput, e)}
                        className="p-1 rounded hover:text-white hover:bg-slate-800 text-slate-400"
                        title="Copy Markdown"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDownload(item, e)}
                        className="p-1 rounded hover:text-white hover:bg-slate-800 text-slate-400"
                        title="Download Markdown"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item, e)}
                        className="p-1 rounded hover:text-rose-400 hover:bg-slate-800 text-slate-400"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Preview Panel */}
          <div className="lg:col-span-7 rounded-xl bg-slate-950/60 border border-slate-800 p-5 min-h-[500px] flex flex-col justify-between light:bg-white light:border-slate-300">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 light:text-slate-900">
                      {selectedItem.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-emerald-400 uppercase font-mono">
                        {selectedItem.outputMode}
                      </span>
                      <span className="text-slate-600">&bull;</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Source: {selectedItem.source === 'cloud' ? 'Supabase Database' : 'Browser LocalStorage'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReopenInWorkspace(selectedItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Reopen in Workspace</span>
                  </button>
                </div>

                {/* Markdown Render */}
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 max-h-[500px] overflow-y-auto text-xs text-slate-200 space-y-3 prose-table light:bg-slate-50 light:border-slate-200 light:text-slate-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedItem.markdownOutput}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                <FolderOpen className="w-8 h-8 opacity-40" />
                <p className="text-xs">Select any history item on the left to preview its full generated markdown artifact.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Clear All History?</h4>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              All stored tickets, test suites, and bug report history in your{' '}
              <strong>{activeSource === 'cloud' ? 'Supabase cloud database and local browser' : 'browser localStorage'}</strong>{' '}
              will be permanently deleted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
