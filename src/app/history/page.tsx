'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [items, setItems] = useState<HistoryItemV1[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItemV1 | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setItems(getLocalHistory());
  }, []);

  const filteredItems = searchLocalHistory(items, searchQuery);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setItems(updated);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    showToast('History item removed.', 'info');
  };

  const handleClearAll = () => {
    clearAllLocalHistory();
    setItems([]);
    setSelectedItem(null);
    setShowClearModal(false);
    showToast('All local history cleared.', 'success');
  };

  const handleReopenInWorkspace = (item: HistoryItemV1) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('devqa_reopen_item', JSON.stringify(item));
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

  const handleDownload = (item: HistoryItemV1, e: React.MouseEvent) => {
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
          <h2 className="text-xl font-bold text-slate-100 light:text-slate-900 tracking-tight">
            Local Browser History
          </h2>
          <p className="text-xs text-slate-400 light:text-slate-600">
            All prompts and generated artifacts stored privately in your browser&apos;s localStorage.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-medium text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
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
      {items.length === 0 ? (
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
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                      {item.outputMode.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
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
                        onClick={(e) => handleDelete(item.id, e)}
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
                    <div className="text-xs text-slate-400 mt-0.5">
                      Mode: <span className="text-emerald-400 uppercase font-mono">{selectedItem.outputMode}</span>
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
                <h4 className="text-sm font-bold text-slate-100">Clear All Local History?</h4>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              All stored tickets, test suites, and bug report history in this browser will be permanently deleted.
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
