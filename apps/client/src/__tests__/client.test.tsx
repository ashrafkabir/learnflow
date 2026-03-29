// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { App } from '../App.js';
import { ThemeProvider } from '../design-system/ThemeProvider.js';
import { AppProvider } from '../context/AppContext.js';
import { ToastProvider } from '../components/Toast.js';
import { colors, typography, breakpoints } from '../design-system/tokens.js';

import { beforeEach } from 'vitest';

beforeEach(async () => {
  // Preload lazy-loaded onboarding modules so Suspense resolves deterministically in jsdom.
  await import('../screens/onboarding/Welcome.js');
  await import('../screens/onboarding/Goals.js');
  await import('../screens/onboarding/Topics.js');
  await import('../screens/onboarding/ApiKeys.js');
  await import('../screens/onboarding/SubscriptionChoice.js');
  await import('../screens/onboarding/FirstCourse.js');

  // Mark onboarding complete and set token so routes don't redirect
  localStorage.setItem('learnflow-onboarding-complete', 'true');
  localStorage.setItem(
    'learnflow-token',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoic3R1ZGVudCIsInRpZXIiOiJmcmVlIiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
  );
  // Mock fetch to prevent TypeError: Invalid URL on relative paths in Node test environment
  globalThis.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    // Provide deterministic agents so the Agent Marketplace renders a catalog in tests.
    if (url.includes('/api/v1/marketplace/agents')) {
      return new Response(
        JSON.stringify({
          agents: [
            {
              id: 'a1',
              name: 'Code Tutor',
              description: 'Helps explain and review code.',
              manifest: { tier: 'free', rating: 4.7, usageCount: 120 },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Return empty success responses for all other API calls
    if (url.includes('/api/') || url.startsWith('/')) {
      return new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

// S08-A01: Design system — all color tokens defined (updated for Spec §5.3)
describe('S08-A01: Design system color tokens', () => {
  it('has primary colors (light/dark)', async () => {
    expect(colors.primary.light).toBe('#1A1A2E');
    expect(colors.primary.dark).toBe('#F8FAFC');
  });
  it('has semantic colors', async () => {
    expect(colors.success).toBeDefined();
    expect(colors.warning).toBeDefined();
    expect(colors.error).toBeDefined();
    expect(colors.accent).toBeDefined();
  });
  it('has neutral scale', async () => {
    expect(Object.keys(colors.neutral).length).toBeGreaterThanOrEqual(10);
  });
});

// S08-A02: Typography scale
describe('S08-A02: Typography scale', () => {
  it('defines all required sizes: 12/14/16/20/24/32px', async () => {
    expect(typography.fontSize.xs).toBe('12px');
    expect(typography.fontSize.sm).toBe('14px');
    expect(typography.fontSize.base).toBe('16px');
    expect(typography.fontSize.lg).toBe('20px');
    expect(typography.fontSize.xl).toBe('24px');
    expect(typography.fontSize['2xl']).toBe('32px');
  });
  it('has font families', async () => {
    expect(typography.fontFamily.sans).toContain('Inter');
    expect(typography.fontFamily.mono).toContain('JetBrains');
  });
});

// S08-A03: Onboarding — all 6 screens
describe('S08-A03: Onboarding screens', () => {
  it('renders Welcome screen', async () => {
    renderAt('/onboarding/welcome');
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('Welcome to LearnFlow');
    });
  });
  it('renders Goals screen (conversational)', async () => {
    renderAt('/onboarding/goals');
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('What do you want to learn?');
    });
  });
  it('renders Topics screen', async () => {
    renderAt('/onboarding/topics');
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('What interests you?');
    });
  });
  it('renders API Keys screen', async () => {
    renderAt('/onboarding/api-keys');
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('Connect Your AI Provider');
    });
  });
  it('renders Ready screen', async () => {
    renderAt('/onboarding/ready');
    // Onboarding completion screen (no longer creates a course)
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Onboarding Complete"]')).not.toBeNull();
    });
  });
});

// S08-A04: Home dashboard
describe('S08-A04: Dashboard', () => {
  it('renders dashboard screen', async () => {
    renderAt('/dashboard');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Dashboard"]')).not.toBeNull();
    });
  });
  it('renders streak tracker', async () => {
    renderAt('/dashboard');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Learning streak"]')).not.toBeNull();
    });
  });
  it('renders create course input', async () => {
    renderAt('/dashboard');
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('Start Learning Something New');
    });
  });
  it('renders settings and chat buttons', async () => {
    renderAt('/dashboard');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Settings"]')).not.toBeNull();
      expect(document.querySelector('[aria-label="Chat"]')).not.toBeNull();
    });
  });
});

// S08-A05: Conversation interface
describe('S08-A05: Conversation', () => {
  it('renders conversation screen', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Conversation"]')).not.toBeNull();
    });
  });
  it('renders message input', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Message input"]')).not.toBeNull();
      expect(document.querySelector('[aria-label="Send message"]')).not.toBeNull();
    });
  });
  it('renders message list', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Messages"]')).not.toBeNull();
    });
  });
});

// S08-A06: Course view
describe('S08-A06: Course view', () => {
  it('renders course view screen', async () => {
    renderAt('/courses/c-1');
    await waitFor(() => {
      const el = document.querySelector('[data-screen="course-view"]');
      expect(el).not.toBeNull();
    });
  });
  it('renders lesson reader screen', async () => {
    renderAt('/courses/c-1/lessons/l1');
    await waitFor(() => {
      const el = document.querySelector('[data-screen="lesson-reader"]');
      expect(el).not.toBeNull();
    });
  });
});

// S08-A07: Mindmap explorer
describe('S08-A07: Mindmap explorer', () => {
  it('renders mindmap screen', async () => {
    renderAt('/mindmap');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Mindmap Explorer"]')).not.toBeNull();
    });
  });
  it('renders knowledge mindmap', async () => {
    renderAt('/mindmap');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Knowledge mindmap"]')).not.toBeNull();
    });
  });
});

// S08-A08: Agent marketplace
describe('S08-A08: Agent marketplace', () => {
  it('renders agent catalog', async () => {
    renderAt('/marketplace/agents');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Agent catalog"]')).not.toBeNull();
    });
  });
});

// S08-A09: Course marketplace
describe('S08-A09: Course marketplace', () => {
  it('renders course catalog', async () => {
    renderAt('/marketplace/courses');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Course catalog"]')).not.toBeNull();
    });
  });
});

// S08-A10: Profile & settings
describe('S08-A10: Profile & settings', () => {
  it('renders settings screen', async () => {
    renderAt('/settings');
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Profile Settings"]')).not.toBeNull();
    });
  });
  it('renders profile section', async () => {
    renderAt('/settings');
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('Profile');
    });
  });
  it('renders learning preferences', async () => {
    renderAt('/settings');
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('Learning Preferences');
    });
  });
  it('renders preference toggles', async () => {
    renderAt('/settings');
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('Dark Mode');
      expect(document.body.innerHTML).toContain('Push notifications');
    });
  });
});

// S08-A12: Responsive (structural — breakpoints defined)
describe('S08-A12: Responsive design', () => {
  it('breakpoints are defined for mobile/tablet/desktop', async () => {
    expect(breakpoints.mobile).toBe('375px');
    expect(breakpoints.tablet).toBe('768px');
    expect(breakpoints.desktop).toBe('1024px');
  });
});

// S08-A15: All UI components have at least one test
describe('S08-A15: Component test coverage', () => {
  it('all screens render without crashing', async () => {
    const routes = [
      '/dashboard',
      '/conversation',
      '/courses/c-1',
      '/courses/c-1/lessons/l1',
      '/mindmap',
      '/marketplace/courses',
      '/marketplace/agents',
      '/settings',
    ];
    for (const route of routes) {
      const { container } = renderAt(route);
      expect(container.innerHTML.length).toBeGreaterThan(0);
    }
  });
});
