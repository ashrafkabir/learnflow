import React, { type ReactNode } from 'react';
import { IconCheck } from '../icons/index.js';

interface Props {
  Icon: React.ComponentType<{ size?: number; className?: string; decorative?: boolean }>;
  label: string;
  status: 'pending' | 'active' | 'complete';
  children?: ReactNode;
}

export function StageColumn({ Icon, label, status, children }: Props) {
  const borderColor =
    status === 'complete'
      ? 'border-teal-400 dark:border-teal-500'
      : status === 'active'
        ? 'border-sky-400 dark:border-sky-500'
        : 'border-gray-200 dark:border-gray-700';

  const bgColor =
    status === 'complete'
      ? 'bg-teal-50 dark:bg-teal-900/20'
      : status === 'active'
        ? 'bg-sky-50 dark:bg-sky-900/20'
        : 'bg-gray-50 dark:bg-gray-800/50';

  const headerBg =
    status === 'complete'
      ? 'bg-teal-100 dark:bg-teal-900/40'
      : status === 'active'
        ? 'bg-sky-100 dark:bg-sky-900/40'
        : 'bg-gray-100 dark:bg-gray-800';

  return (
    <div
      className={`flex-shrink-0 w-56 rounded-xl border-2 ${borderColor} ${bgColor} overflow-hidden transition-all duration-300`}
    >
      {/* Header */}
      <div className={`${headerBg} px-3 py-2 flex items-center gap-2`}>
        <Icon size={18} className="text-gray-700 dark:text-gray-200" decorative />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
        {status === 'complete' && (
          <span className="ml-auto text-teal-500">
            <IconCheck size={16} className="text-teal-500" decorative />
          </span>
        )}
        {status === 'active' && (
          <span className="ml-auto">
            <span className="inline-block w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
          </span>
        )}
      </div>
      {/* Content */}
      <div className="p-3 max-h-64 overflow-y-auto text-xs">
        {status === 'pending' ? (
          <p className="text-gray-400 text-center py-4">Waiting...</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
