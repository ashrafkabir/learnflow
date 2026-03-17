import React from 'react';
import { Source } from './CitationTooltip.js';

interface SourceDrawerProps {
  open: boolean;
  onClose: () => void;
  sources: Source[];
}

export function SourceDrawer({ open, onClose, sources }: SourceDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-full overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📚 Sources</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          {sources.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">
              No sources available for this response.
            </p>
          )}
          {sources.map((s, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <span className="bg-accent/10 text-accent font-bold text-xs px-2 py-1 rounded-full">
                  [{s.id}]
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {s.author} · {s.publication} · {s.year}
                  </p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline mt-1 block truncate"
                  >
                    {s.url}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
