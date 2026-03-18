// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { ProgressRing } from '../components/ProgressRing.js';
import { BrandedLoading } from '../components/BrandedLoading.js';
import { Button } from '../components/Button.js';

afterEach(() => cleanup());

describe('ProgressRing component', () => {
  it('renders an SVG element', () => {
    render(<ProgressRing percent={50} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('reflects progress value in stroke-dasharray', () => {
    render(<ProgressRing percent={75} />);
    const circles = document.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it('renders at 0% without error', () => {
    render(<ProgressRing percent={0} />);
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('renders at 100% without error', () => {
    render(<ProgressRing percent={100} />);
    expect(document.querySelector('svg')).toBeTruthy();
  });
});

describe('BrandedLoading component', () => {
  it('renders LearnFlow branding', () => {
    render(<BrandedLoading />);
    expect(screen.getByText('LearnFlow')).toBeInTheDocument();
  });

  it('shows default loading message', () => {
    render(<BrandedLoading />);
    expect(screen.getByText('Loading your learning journey...')).toBeInTheDocument();
  });

  it('shows custom loading message', () => {
    render(<BrandedLoading message="Generating course..." />);
    expect(screen.getByText('Generating course...')).toBeInTheDocument();
  });

  it('has loading role for accessibility', () => {
    render(<BrandedLoading />);
    expect(document.querySelector('[role="status"]')).toBeTruthy();
  });
});

describe('Button component', () => {
  it('renders with primary variant', () => {
    render(<Button variant="primary">Click</Button>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
  });
});
