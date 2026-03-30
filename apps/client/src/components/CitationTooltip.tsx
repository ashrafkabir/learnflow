import React, { useId, useState } from 'react';

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
  const popoverId = useId();

  const toggle = () => setShow((s) => !s);

  return (
    <span className="relative inline-block align-super">
      <button
        type="button"
        className="text-accent font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-accent/40 rounded"
        aria-label={source?.title ? `Citation ${num}: ${source.title}` : `Citation ${num}`}
        aria-expanded={show}
        aria-haspopup="dialog"
        aria-controls={show ? popoverId : undefined}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        // For keyboard users: open on Enter/Space (not on focus), so focus does not immediately toggle it closed.
        onFocus={() => setShow(false)}
        onBlur={() => setShow(false)}
        onClick={(e) => {
          // On mobile/tap we want a popover rather than immediate new tab.
          e.preventDefault();
          if (!source?.url) return;
          toggle();
        }}
        onKeyDown={(e) => {
          if (!source?.url) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
          if (e.key === 'Escape') setShow(false);
        }}
      >
        <span className="text-xs leading-none">[{num}]</span>
      </button>

      {show && source && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={`Citation ${num}`}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-elevated z-50 text-xs"
        >
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
            Open source
          </a>
          <p className="mt-1 text-[11px] text-gray-500 truncate">{source.url}</p>
        </div>
      )}
    </span>
  );
}
