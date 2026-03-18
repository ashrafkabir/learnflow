import React from 'react';
import { SHORTCUTS } from '../hooks/useKeyboardShortcuts.js';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-modal" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">⌨️ Keyboard Shortcuts</h2>
        <div className="space-y-3">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">{s.description}</span>
              <kbd className="bg-gray-100 dark:bg-gray-800 text-xs font-mono px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full text-center text-sm text-accent hover:underline">Close</button>
      </div>
    </div>
  );
}
