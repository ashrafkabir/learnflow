import React, { useState } from 'react';

export interface Source {
  id: number;
  author: string;
  title: string;
  publication: string;
  year: number;
  url: string;
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 text-xs">
          <p className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {source.title}
          </p>
          <p className="text-gray-500">
            {source.author} · {source.publication} · {source.year}
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
