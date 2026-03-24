import React from 'react';

export type ActionChip = {
  key: string;
  label: string;
  onClick: () => void;
  // Optional styling intent
  tone?: 'neutral' | 'accent' | 'success' | 'info';
  icon?: React.ReactNode;
};

export function ActionChips({ chips }: { chips: ActionChip[] }) {
  if (!chips || chips.length === 0) return null;

  const toneClass = (tone?: ActionChip['tone']) => {
    switch (tone) {
      case 'accent':
        return 'bg-accent/10 text-accent hover:bg-accent/20 border-accent/30';
      case 'success':
        return 'bg-success/10 text-success hover:bg-success/20 border-success/30';
      case 'info':
        return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="flex flex-wrap gap-2" data-component="action-chips">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.onClick}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border inline-flex items-center gap-2 transition-colors ${toneClass(
            c.tone,
          )}`}
        >
          {c.icon ? <span className="shrink-0">{c.icon}</span> : null}
          <span>{c.label}</span>
        </button>
      ))}
    </div>
  );
}
