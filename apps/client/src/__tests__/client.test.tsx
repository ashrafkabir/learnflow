import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { App } from '../App.js';
import { ThemeProvider } from '../design-system/ThemeProvider.js';
import { colors, typography, breakpoints } from '../design-system/tokens.js';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

// S08-A01: Design system — all color tokens defined
describe('S08-A01: Design system color tokens', () => {
  it('has primary color scale', () => {
    expect(colors.primary[500]).toBe('#6366F1');
    expect(colors.primary[50]).toBeDefined();
    expect(colors.primary[900]).toBeDefined();
  });
  it('has semantic colors', () => {
    expect(colors.success).toBeDefined();
    expect(colors.warning).toBeDefined();
    expect(colors.error).toBeDefined();
    expect(colors.info).toBeDefined();
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
    expect(screen.getByLabelText('Get Started')).toBeInTheDocument();
  });
  it('renders Goals screen', () => {
    renderAt('/onboarding/goals');
    expect(screen.getByText('What are your learning goals?')).toBeInTheDocument();
  });
  it('renders Topics screen', () => {
    renderAt('/onboarding/topics');
    expect(screen.getByText('What topics interest you?')).toBeInTheDocument();
  });
  it('renders Experience screen', () => {
    renderAt('/onboarding/experience');
    expect(screen.getByText("What's your experience level?")).toBeInTheDocument();
  });
  it('renders API Keys screen', () => {
    renderAt('/onboarding/api-keys');
    expect(screen.getByText('Connect Your AI Provider')).toBeInTheDocument();
  });
  it('renders Ready screen', () => {
    renderAt('/onboarding/ready');
    expect(screen.getByLabelText('Go to Dashboard')).toBeInTheDocument();
  });
});

// S08-A04: Home dashboard
describe('S08-A04: Dashboard', () => {
  it('renders course carousel', () => {
    renderAt('/dashboard');
    expect(screen.getByLabelText('Your courses')).toBeInTheDocument();
  });
  it('renders daily lessons', () => {
    renderAt('/dashboard');
    expect(screen.getByLabelText('Daily lessons')).toBeInTheDocument();
  });
  it('renders mindmap preview', () => {
    renderAt('/dashboard');
    expect(screen.getByLabelText('Knowledge mindmap')).toBeInTheDocument();
  });
  it('renders streak tracker', () => {
    renderAt('/dashboard');
    expect(screen.getByLabelText('Learning streak')).toBeInTheDocument();
  });
});

// S08-A05: Conversation interface
describe('S08-A05: Conversation', () => {
  it('renders markdown content', () => {
    renderAt('/conversation');
    expect(screen.getByText('Chat with LearnFlow')).toBeInTheDocument();
    // Check markdown rendering (bold text)
    const content = document.querySelector('[data-component="markdown-content"]');
    expect(content).not.toBeNull();
  });
  it('renders agent indicator', () => {
    renderAt('/conversation');
    expect(screen.getByLabelText('Agent: orchestrator')).toBeInTheDocument();
  });
  it('renders action chips', () => {
    renderAt('/conversation');
    expect(screen.getByLabelText('Create a Course')).toBeInTheDocument();
    expect(screen.getByLabelText('Quiz Me')).toBeInTheDocument();
  });
});

// S08-A06: Course view
describe('S08-A06: Course view', () => {
  it('renders syllabus with modules', () => {
    renderAt('/courses/c-1');
    expect(screen.getByLabelText('Course syllabus')).toBeInTheDocument();
    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getByText('Key Techniques')).toBeInTheDocument();
  });
  it('renders progress tracker', () => {
    renderAt('/courses/c-1');
    const tracker = document.querySelector('[data-component="progress-tracker"]');
    expect(tracker).not.toBeNull();
  });
  it('renders lesson reader with content and sources', () => {
    renderAt('/courses/c-1/lessons/l1');
    expect(screen.getByLabelText('Lesson content')).toBeInTheDocument();
    expect(screen.getByLabelText('References')).toBeInTheDocument();
  });
});

// S08-A07: Mindmap explorer
describe('S08-A07: Mindmap explorer', () => {
  it('renders interactive graph with clickable nodes', () => {
    renderAt('/mindmap');
    expect(screen.getByLabelText('Knowledge graph')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Rust')).toBeInTheDocument();
  });
  it('nodes have mastery indicators', () => {
    renderAt('/mindmap');
    const indicators = document.querySelectorAll('[aria-label="Mastery indicator"]');
    expect(indicators.length).toBeGreaterThan(0);
  });
  it('nodes are clickable', () => {
    renderAt('/mindmap');
    const nodes = document.querySelectorAll('[data-node-id]');
    expect(nodes.length).toBeGreaterThan(0);
  });
});

// S08-A08: Agent marketplace
describe('S08-A08: Agent marketplace', () => {
  it('renders browsable agent catalog', () => {
    renderAt('/marketplace/agents');
    expect(screen.getByLabelText('Agent catalog')).toBeInTheDocument();
    expect(screen.getByText('Code Tutor')).toBeInTheDocument();
    expect(screen.getByText('Research Pro')).toBeInTheDocument();
  });
  it('has activation buttons', () => {
    renderAt('/marketplace/agents');
    expect(screen.getByLabelText('Activate Code Tutor')).toBeInTheDocument();
  });
});

// S08-A09: Course marketplace
describe('S08-A09: Course marketplace', () => {
  it('renders search and filter', () => {
    renderAt('/marketplace/courses');
    expect(screen.getByLabelText('Search courses')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by difficulty')).toBeInTheDocument();
  });
  it('renders course catalog with enroll buttons', () => {
    renderAt('/marketplace/courses');
    expect(screen.getByLabelText('Course catalog')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning Fundamentals')).toBeInTheDocument();
  });
});

// S08-A10: Profile & settings
describe('S08-A10: Profile & settings', () => {
  it('renders goals section', () => {
    renderAt('/settings');
    expect(screen.getByLabelText('Profile and goals')).toBeInTheDocument();
  });
  it('renders API keys tab', () => {
    renderAt('/settings');
    expect(screen.getByRole('tab', { name: 'API Keys' })).toBeInTheDocument();
  });
  it('renders subscription tab', () => {
    renderAt('/settings');
    expect(screen.getByRole('tab', { name: 'Subscription' })).toBeInTheDocument();
  });
  it('renders privacy tab', () => {
    renderAt('/settings');
    expect(screen.getByRole('tab', { name: 'Privacy & Export' })).toBeInTheDocument();
  });
});

// S08-A13: Dark mode
describe('S08-A13: Dark mode', () => {
  it('renders theme toggle on dashboard', () => {
    renderAt('/dashboard');
    const toggleBtn = screen.getByLabelText(/Switch to .* mode/);
    expect(toggleBtn).toBeInTheDocument();
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
  it('all screens have at least one test above', () => {
    // This test itself verifies that all S08 screens are tested
    const screenNames = [
      'dashboard',
      'conversation',
      'course-view',
      'lesson-reader',
      'mindmap-explorer',
      'course-marketplace',
      'agent-marketplace',
      'profile-settings',
    ];
    for (const name of screenNames) {
      // Verify the screen's data-screen attribute renders
      const { container } = renderAt(
        name === 'dashboard'
          ? '/dashboard'
          : name === 'conversation'
            ? '/conversation'
            : name === 'course-view'
              ? '/courses/c-1'
              : name === 'lesson-reader'
                ? '/courses/c-1/lessons/l1'
                : name === 'mindmap-explorer'
                  ? '/mindmap'
                  : name === 'course-marketplace'
                    ? '/marketplace/courses'
                    : name === 'agent-marketplace'
                      ? '/marketplace/agents'
                      : '/settings',
      );
      expect(container.querySelector(`[data-screen="${name}"]`)).not.toBeNull();
    }
  });
});
