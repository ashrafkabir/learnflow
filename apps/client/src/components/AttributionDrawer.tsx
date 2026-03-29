import React from 'react';

export type AttributionSource = {
  id?: string | number;
  title?: string;
  url?: string;

  // Newer SourceCard-style fields
  sourceType?: string;
  summary?: string;
  whyThisMatters?: string;

  // Credibility / provenance (best-effort)
  domain?: string;
  credibilityScore?: number;
  credibilityLabel?: 'High' | 'Medium' | 'Low' | 'Unknown' | string;
  whyCredible?: string;

  // Legacy / optional bibliographic fields
  author?: string;
  publication?: string;
  year?: number | string;
  license?: string;
  accessedAt?: string;
};

export type AttributionImage = {
  imageUrl: string;
  sourcePageUrl?: string;
  license?: string;
  attributionText?: string;
  provider?: string;
  createdAt?: string;
  imageReason?: string;
};

export function AttributionDrawer(props: {
  open: boolean;
  onClose: () => void;
  sources: AttributionSource[];
  images: AttributionImage[];
  sourcesMissingReason?: string;
  sourceMode?: 'real' | 'mock';
}) {
  const { open, onClose, sources, images, sourcesMissingReason, sourceMode } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Attribution">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close attribution"
      />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Sources & Attribution
            </h2>
            {sourceMode === 'mock' ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Provenance: demo mode (placeholder/mock sources).
              </p>
            ) : sourceMode === 'real' ? (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                Provenance: live sources.
              </p>
            ) : null}
            {sourcesMissingReason ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                {sourcesMissingReason}
              </p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
              Text sources
            </h3>
            {(!sources || sources.length === 0) && (
              <p className="text-xs text-gray-500 dark:text-gray-400">No sources available.</p>
            )}
            <div className="space-y-2">
              {(sources || []).map((s, i) => (
                <div
                  key={String(s.id ?? i)}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-3"
                >
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {s.title || s.url || 'Untitled'}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {[s.sourceType, s.author, s.publication, s.domain, s.year]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  {s.summary ? (
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">{s.summary}</p>
                  ) : null}

                  {s.whyThisMatters ? (
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-semibold">Why this matters:</span> {s.whyThisMatters}
                    </p>
                  ) : null}

                  {typeof s.credibilityScore === 'number' || s.credibilityLabel || s.whyCredible ? (
                    <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300 space-y-0.5">
                      <p>
                        <span className="font-semibold">Credibility:</span>{' '}
                        {s.credibilityLabel || 'Unknown'}
                        {typeof s.credibilityScore === 'number'
                          ? ` (${s.credibilityScore.toFixed(2)})`
                          : ''}
                      </p>
                      {s.whyCredible ? (
                        <p>
                          <span className="font-semibold">Why we trust it:</span> {s.whyCredible}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-700 dark:text-indigo-300 hover:underline break-words"
                    >
                      {s.url}
                    </a>
                  ) : null}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {s.license ? `License: ${s.license}` : ''}
                    {s.accessedAt ? ` · Accessed: ${new Date(s.accessedAt).toLocaleString()}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Images</h3>
            {(!images || images.length === 0) && (
              <p className="text-xs text-gray-500 dark:text-gray-400">No images available.</p>
            )}
            <div className="space-y-3">
              {(images || []).map((img, i) => (
                <div
                  key={`${img.imageUrl}-${i}`}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-3"
                >
                  <div className="flex gap-3">
                    <img
                      src={img.imageUrl}
                      alt="Illustration"
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-800"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-600 dark:text-gray-300">
                        {img.attributionText ||
                          `Provider: ${img.provider || 'unknown'} · License: ${img.license || 'unknown'}`}
                      </p>
                      {img.imageReason ? (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          Reason: {img.imageReason}
                        </p>
                      ) : null}
                      {img.sourcePageUrl ? (
                        <a
                          href={img.sourcePageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-700 dark:text-indigo-300 hover:underline break-words"
                        >
                          {img.sourcePageUrl}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
