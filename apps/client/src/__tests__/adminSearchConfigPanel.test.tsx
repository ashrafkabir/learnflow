// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../design-system/ThemeProvider.js';
import { AppProvider } from '../context/AppContext.js';
import { ToastProvider } from '../components/Toast.js';
import { App } from '../App.js';

beforeEach(() => {
  localStorage.setItem('learnflow-onboarding-complete', 'true');
  localStorage.setItem(
    'learnflow-token',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
  );
  // Admin gating is server-driven; localStorage role should not be trusted.
  localStorage.setItem(
    'learnflow-student-context',
    JSON.stringify({ goals: [], topics: [], experience: 'beginner', role: 'student' }),
  );

  globalThis.fetch = (async (input: any) => {
    const url = String(input);
    if (url.includes('/api/v1/admin/search-config')) {
      return new Response(
        JSON.stringify({
          config: {
            stage1Templates: ['{courseTopic} overview'],
            stage2Templates: ['{lessonTitle} {courseTopic}'],
            layerTemplates: {
              L1_market: ['"{courseTopic} Gartner Forrester IDC analyst report 2025"'],
              L2_academic: ['"{courseTopic} peer reviewed research findings 2024 2025"'],
              L3_practitioner: ['"{courseTopic} real-world implementation case study enterprise"'],
            },
            enabledSources: { wikipedia: true },
            perQueryLimit: 5,
            maxSourcesPerLesson: 6,
            maxStage1Queries: 10,
            maxStage2Queries: 6,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/api/v1/profile/context')) {
      return new Response(JSON.stringify({ role: 'admin', subscriptionTier: 'pro' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as any;
});

afterEach(() => cleanup());

describe('Admin Search Config panel', () => {
  it('renders for admin role', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <ThemeProvider>
          <AppProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    await new Promise((r) => setTimeout(r, 600));
    expect(document.body.innerHTML).toContain('Admin Search Config');
    expect(document.body.innerHTML).toContain('Stage 1');
    expect(document.body.innerHTML).toContain('Stage 2');
  });
});
