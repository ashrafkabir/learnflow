import React from 'react';

interface Props {
  sources: number;
  deduplicated: number;
  themes?: string[];
}

export function OrganizingView({ sources, deduplicated, themes }: Props) {
  const safeThemes = themes ?? [];
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-300">Sources</span>
        <span className="font-semibold text-gray-900 dark:text-white">{sources}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-300">Deduplicated</span>
        <span className="font-semibold text-red-500">-{deduplicated}</span>
      </div>
      {safeThemes.length > 0 && (
        <div>
          <p className="text-gray-500 dark:text-gray-300 mb-1">Themes:</p>
          <div className="flex flex-wrap gap-1">
            {safeThemes.map((t, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full text-[10px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
