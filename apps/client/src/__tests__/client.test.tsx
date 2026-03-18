// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
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
  it('has primary colors (light/dark)', () => {
    expect(colors.primary.light).toBe('#1A1A2E');
    expect(colors.primary.dark).toBe('#F8FAFC');
  });
  it('has semantic colors', () => {
    expect(colors.success).toBeDefined();
    expect(colors.warning).toBeDefined();
    expect(colors.error).toBeDefined();
    expect(colors.accent).toBeDefined();
  });
  it('has neutral scale', () => {
    expect(Object.keys(colors.neutral).length).toBeGreaterThanOrEqual(10);
  });
});

// S08-A02: Typography scale
describe('S08-A02: Typography scale', () => {
  it('defines all required sizes: 12/14/16/20/24/32px', () => {
    expect(typography.fontSize.xs).toBe('12px');
    expect(typography.fontSize.sm).toBe('14px');
    expect(typography.fontSize.base).toBe('16px');
    expect(typography.fontSize.lg).toBe('20px');
    expect(typography.fontSize.xl).toBe('24px');
    expect(typography.fontSize['2xl']).toBe('32px');
  });
  it('has font families', () => {
    expect(typography.fontFamily.sans).toContain('Inter');
    expect(typography.fontFamily.mono).toContain('JetBrains');
  });
});

// S08-A03: Onboarding — all 6 screens
describe('S08-A03: Onboarding screens', () => {
  it('renders Welcome screen', () => {
    renderAt('/onboarding/welcome');
    expect(screen.getByText('Welcome to LearnFlow')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
  it('renders Goals screen (conversational)', () => {
    renderAt('/onboarding/goals');
    expect(screen.getByText('What do you want to learn?')).toBeInTheDocument();
  });
  it('renders Topics screen', () => {
    renderAt('/onboarding/topics');
    expect(screen.getByText('What interests you?')).toBeInTheDocument();
  });
  it('renders API Keys screen', () => {
    renderAt('/onboarding/api-keys');
    expect(screen.getByText('Connect Your AI Provider')).toBeInTheDocument();
  });
  it('renders Ready screen', () => {
    renderAt('/onboarding/ready');
    // Onboarding completion screen (no longer creates a course)
    expect(screen.getByLabelText('Onboarding Complete')).toBeInTheDocument();
  });
});

// S08-A04: Home dashboard
describe('S08-A04: Dashboard', () => {
  it('renders dashboard screen', () => {
    renderAt('/dashboard');
    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
  });
  it('renders streak tracker', () => {
    renderAt('/dashboard');
    expect(screen.getByLabelText('Learning streak')).toBeInTheDocument();
  });
  it('renders create course input', () => {
    renderAt('/dashboard');
    expect(screen.getByText('Start Learning Something New')).toBeInTheDocument();
  });
  it('renders settings and chat buttons', () => {
    renderAt('/dashboard');
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat')).toBeInTheDocument();
  });
});

// S08-A05: Conversation interface
describe('S08-A05: Conversation', () => {
  it('renders conversation screen', () => {
    renderAt('/conversation');
    expect(screen.getByLabelText('Conversation')).toBeInTheDocument();
  });
  it('renders message input', () => {
    renderAt('/conversation');
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });
  it('renders message list', () => {
    renderAt('/conversation');
    expect(screen.getByLabelText('Messages')).toBeInTheDocument();
  });
});

// S08-A06: Course view
describe('S08-A06: Course view', () => {
  it('renders course view screen', () => {
    renderAt('/courses/c-1');
    // Shows loading or course data
    const el = document.querySelector('[data-screen="course-view"]');
    expect(el).not.toBeNull();
  });
  it('renders lesson reader screen', () => {
    renderAt('/courses/c-1/lessons/l1');
    const el = document.querySelector('[data-screen="lesson-reader"]');
    expect(el).not.toBeNull();
  });
});

// S08-A07: Mindmap explorer
describe('S08-A07: Mindmap explorer', () => {
  it('renders mindmap screen', () => {
    renderAt('/mindmap');
    expect(screen.getByLabelText('Mindmap Explorer')).toBeInTheDocument();
  });
  it('renders knowledge mindmap', () => {
    renderAt('/mindmap');
    expect(screen.getByLabelText('Knowledge mindmap')).toBeInTheDocument();
  });
});

// S08-A08: Agent marketplace
describe('S08-A08: Agent marketplace', () => {
  it('renders agent catalog', () => {
    renderAt('/marketplace/agents');
    expect(screen.getByLabelText('Agent catalog')).toBeInTheDocument();
  });
});

// S08-A09: Course marketplace
describe('S08-A09: Course marketplace', () => {
  it('renders course catalog', () => {
    renderAt('/marketplace/courses');
    expect(screen.getByLabelText('Course catalog')).toBeInTheDocument();
  });
});

// S08-A10: Profile & settings
describe('S08-A10: Profile & settings', () => {
  it('renders settings screen', () => {
    renderAt('/settings');
    expect(screen.getByLabelText('Profile Settings')).toBeInTheDocument();
  });
  it('renders profile section', () => {
    renderAt('/settings');
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
  it('renders learning preferences', () => {
    renderAt('/settings');
    expect(screen.getByText('Learning Preferences')).toBeInTheDocument();
  });
  it('renders preference toggles', () => {
    renderAt('/settings');
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});

// S08-A12: Responsive (structural — breakpoints defined)
describe('S08-A12: Responsive design', () => {
  it('breakpoints are defined for mobile/tablet/desktop', () => {
    expect(breakpoints.mobile).toBe('375px');
    expect(breakpoints.tablet).toBe('768px');
    expect(breakpoints.desktop).toBe('1024px');
  });
});

// S08-A15: All UI components have at least one test
describe('S08-A15: Component test coverage', () => {
  it('all screens render without crashing', () => {
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
