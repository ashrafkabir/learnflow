import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { IconInfo, IconLock, IconShieldKey } from '../components/icons/index.js';

/**
 * MVP truth panel (Iteration 117):
 * - Marketplace agents do not run third-party code.
 * - This build is web-first and intentionally minimal.
 */
export function AboutMvpTruth() {
  const nav = useNavigate();

  return (
    <section
      aria-label="About this MVP"
      data-screen="about-mvp"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconInfo className="w-5 h-5 text-accent" />
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              MVP truth
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => nav('/settings')}>
            ← Back to Settings
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Marketplace agents do not execute third‑party code
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            In this MVP, “agents” in the marketplace are UI-level preferences and routing helpers.
            They do <span className="font-medium">not</span> run arbitrary code, spawn containers,
            or connect to an agent SDK.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <IconShieldKey className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">BYOAI only</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            LearnFlow uses <span className="font-medium">your</span> API keys. This build does not
            provide managed LLM keys.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <IconLock className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Where to verify</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            For the canonical description of what ships in the MVP (and what is future-state), see
            the in-app docs and the product spec’s MVP architecture section.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => nav('/docs')}>
              Open docs
            </Button>
            <a
              href="/docs/mvp-truth"
              className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 hover:border-accent/40"
            >
              About MVP truth
            </a>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
            Tip: if you have the repo checked out, open{' '}
            <span className="font-medium">LearnFlow_Product_Spec.md</span> and jump to §3.2.0 “MVP
            architecture”.
          </p>
        </div>
      </div>
    </section>
  );
}
