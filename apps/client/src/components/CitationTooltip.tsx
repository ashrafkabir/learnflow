import React, { useState } from 'react';

export interface Source {
  id: number;
  title: string;
  url: string;

  author?: string;
  publication?: string;
  year?: number;

  // Iter92: credibility/provenance surface (best-effort; may be missing)
  accessedAt?: string;
  sourceType?: 'docs' | 'blog' | 'paper' | 'forum';
  domain?: string;
  credibilityScore?: number;
  credibilityLabel?: 'High' | 'Medium' | 'Low' | 'Unknown';
  whyCredible?: string;
}

interface CitationTooltipProps {
  num: number;
  source?: Source;
}

export function CitationTooltip({ num, source }: CitationTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block">
      <sup
        className="text-accent font-medium cursor-pointer hover:underline"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => source?.url && window.open(source.url, '_blank')}
      >
        [{num}]
      </sup>
      {show && source && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-elevated z-50 text-xs">
          <p className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {source.title}
          </p>
          <p className="text-gray-500">
            {[source.author || 'Unknown', source.publication || 'Unknown', source.year]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline mt-1 block truncate"
          >
            {source.url}
          </a>
        </div>
      )}
    </span>
  );
}
