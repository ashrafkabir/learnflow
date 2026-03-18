import React from 'react';

function shimmer() {
  return 'skeleton rounded';
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`${shimmer()} h-4`} style={{ width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`${shimmer()} h-5 w-3/4`} />
        <div className={`${shimmer()} w-11 h-11 rounded-full`} />
      </div>
      <SkeletonText lines={2} />
      <div className="flex items-center justify-between mt-4">
        <div className={`${shimmer()} h-3 w-20`} />
        <div className={`${shimmer()} h-6 w-16 rounded-full`} />
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3, className = '' }: { items?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`${shimmer()} w-10 h-10 rounded-full flex-shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className={`${shimmer()} h-4 w-3/4`} />
            <div className={`${shimmer()} h-3 w-1/2`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonLessonContent({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className={`${shimmer()} h-8 w-2/3 mb-4`} />
        <div className={`${shimmer()} h-4 w-32`} />
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <SkeletonText lines={8} />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className={`${shimmer()} h-36 rounded-2xl`} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${shimmer()} h-24 rounded-2xl`} />
        ))}
      </div>
      <div className={`${shimmer()} h-20 rounded-2xl`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonCourseView() {
  return (
    <div className="space-y-6">
      <div className={`${shimmer()} h-48 rounded-2xl`} />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-3">
              <div className={`${shimmer()} w-8 h-8 rounded-lg`} />
              <div className="flex-1 space-y-2">
                <div className={`${shimmer()} h-5 w-3/4`} />
                <div className={`${shimmer()} h-3 w-1/2`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonMarketplace() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${shimmer()} h-8 w-20 rounded-full`} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
