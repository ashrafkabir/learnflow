// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { App } from '../App.js';
import { ThemeProvider } from '../design-system/ThemeProvider.js';
import { AppProvider } from '../context/AppContext.js';
import { ToastProvider } from '../components/Toast.js';
import { colors, typography, breakpoints } from '../design-system/tokens.js';

import { afterEach } from 'vitest';

import { beforeEach } from 'vitest';

beforeEach(() => {
  // Mark onboarding complete and set token so routes don't redirect
  localStorage.setItem('learnflow-onboarding-complete', 'true');
  localStorage.setItem('learnflow-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoic3R1ZGVudCIsInRpZXIiOiJmcmVlIiwiZXhwIjo5OTk5OTk5OTk5fQ.test');
  // Mock fetch to prevent TypeError: Invalid URL on relative paths in Node test environment
  globalThis.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    // Return empty success responses for all API calls
    if (url.includes('/api/') || url.startsWith('/')) {
      return new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
});

afterEach(() => {
  cleanup();
});

function renderAt(path: string) {
  cleanup();
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
    expect(await screen.findByText('Welcome to LearnFlow')).toBeInTheDocument();
    expect(await screen.findByText('Get Started')).toBeInTheDocument();
  });
  it('renders Goals screen (conversational)', async () => {
    renderAt('/onboarding/goals');
    expect(await screen.findByText('What do you want to learn?')).toBeInTheDocument();
  });
  it('renders Topics screen', async () => {
    renderAt('/onboarding/topics');
    expect(await screen.findByText('What interests you?')).toBeInTheDocument();
  });
  it('renders API Keys screen', async () => {
    renderAt('/onboarding/api-keys');
    expect(await screen.findByText('Connect Your AI Provider')).toBeInTheDocument();
  });
  it('renders Ready screen', async () => {
    renderAt('/onboarding/ready');
    // Onboarding completion screen (no longer creates a course)
    expect(await screen.findByLabelText('Onboarding Complete')).toBeInTheDocument();
  });
});

// S08-A04: Home dashboard
describe('S08-A04: Dashboard', () => {
  it('renders dashboard screen', async () => {
    renderAt('/dashboard');
    expect(await screen.findByLabelText('Dashboard')).toBeInTheDocument();
  });
  it('renders streak tracker', async () => {
    renderAt('/dashboard');
    expect(await screen.findByLabelText('Learning streak')).toBeInTheDocument();
  });
  it('renders create course input', async () => {
    renderAt('/dashboard');
    expect(await screen.findByText('Start Learning Something New')).toBeInTheDocument();
  });
  it('renders settings and chat buttons', async () => {
    renderAt('/dashboard');
    expect(await screen.findByLabelText('Settings')).toBeInTheDocument();
    expect(await screen.findByLabelText('Chat')).toBeInTheDocument();
  });
});

// S08-A05: Conversation interface
describe('S08-A05: Conversation', () => {
  it('renders conversation screen', async () => {
    renderAt('/conversation');
    expect(await screen.findByLabelText('Conversation')).toBeInTheDocument();
  });
  it('renders message input', async () => {
    renderAt('/conversation');
    expect(await screen.findByLabelText('Message input')).toBeInTheDocument();
    expect(await screen.findByLabelText('Send message')).toBeInTheDocument();
  });
  it('renders message list', async () => {
    renderAt('/conversation');
    expect(await screen.findByLabelText('Messages')).toBeInTheDocument();
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
    expect(await screen.findByLabelText('Mindmap Explorer')).toBeInTheDocument();
  });
  it('renders knowledge mindmap', async () => {
    renderAt('/mindmap');
    expect(await screen.findByLabelText('Knowledge mindmap')).toBeInTheDocument();
  });
});

// S08-A08: Agent marketplace
describe('S08-A08: Agent marketplace', () => {
  it('renders agent catalog', async () => {
    renderAt('/marketplace/agents');
    expect(await screen.findByLabelText('Agent catalog')).toBeInTheDocument();
  });
});

// S08-A09: Course marketplace
describe('S08-A09: Course marketplace', () => {
  it('renders course catalog', async () => {
    renderAt('/marketplace/courses');
    expect(await screen.findByLabelText('Course catalog')).toBeInTheDocument();
  });
});

// S08-A10: Profile & settings
describe('S08-A10: Profile & settings', () => {
  it('renders settings screen', async () => {
    renderAt('/settings');
    expect(await screen.findByLabelText('Profile Settings')).toBeInTheDocument();
  });
  it('renders profile section', async () => {
    renderAt('/settings');
    expect(await screen.findByText('Profile')).toBeInTheDocument();
  });
  it('renders learning preferences', async () => {
    renderAt('/settings');
    expect(await screen.findByText('Learning Preferences')).toBeInTheDocument();
  });
  it('renders preference toggles', async () => {
    renderAt('/settings');
    expect(await screen.findByText('Dark Mode')).toBeInTheDocument();
    expect(await screen.findByText('Notifications')).toBeInTheDocument();
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
