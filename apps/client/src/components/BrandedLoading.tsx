import React from 'react';
import { IconBrainSpark } from './icons/index.js';

interface BrandedLoadingProps {
  message?: string;
}

export function BrandedLoading({
  message = 'Loading your learning journey...',
}: BrandedLoadingProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-bg dark:bg-bg-dark"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <IconBrainSpark size={30} className="text-accent animate-pulse" title="LearnFlow" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">LearnFlow</h1>
      <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
