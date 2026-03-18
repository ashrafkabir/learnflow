/**
 * LearnFlow Design System — Design Tokens
 * Spec §5.3: Color Palette — exact hex values from spec
 * S08-A01: All color tokens defined and used consistently
 * S08-A02: Typography scale: 12/14/16/20/24/32px all defined
 */

export const colors = {
  // Primary — Spec §5.3
  primary: {
    light: '#1A1A2E',
    dark: '#F8FAFC',
  },
  // Accent — Spec §5.3
  accent: {
    light: '#2563EB',
    dark: '#60A5FA',
  },
  // Success — Spec §5.3
  success: {
    light: '#16A34A',
    dark: '#4ADE80',
  },
  // Warning — Spec §5.3
  warning: {
    light: '#F59E0B',
    dark: '#FCD34D',
  },
  // Error — Spec §5.3
  error: {
    light: '#DC2626',
    dark: '#F87171',
  },
  // Surface — Spec §5.3
  surface: {
    light: '#FFFFFF',
    dark: '#0F172A',
  },
  // Background — Spec §5.3
  background: {
    light: '#F8FAFC',
    dark: '#020617',
  },
  // Neutral (for borders, secondary text, etc.)
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const breakpoints = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
  xl: '0 20px 25px rgba(0,0,0,0.15)',
} as const;

/** Dark mode overrides — Spec §5.3 */
export const darkColors = {
  bg: colors.background.dark, // #020617
  surface: colors.surface.dark, // #0F172A
  surfaceHover: colors.neutral[700], // #334155
  text: colors.primary.dark, // #F8FAFC
  textSecondary: colors.neutral[400], // #94A3B8
  border: colors.neutral[700], // #334155
  accent: colors.accent.dark, // #60A5FA
  success: colors.success.dark, // #4ADE80
  warning: colors.warning.dark, // #FCD34D
  error: colors.error.dark, // #F87171
} as const;

/** Light mode defaults — Spec §5.3 */
export const lightColors = {
  bg: colors.background.light, // #F8FAFC
  surface: colors.surface.light, // #FFFFFF
  surfaceHover: colors.neutral[100], // #F1F5F9
  text: colors.primary.light, // #1A1A2E
  textSecondary: colors.neutral[500], // #64748B
  border: colors.neutral[200], // #E2E8F0
  accent: colors.accent.light, // #2563EB
  success: colors.success.light, // #16A34A
  warning: colors.warning.light, // #F59E0B
  error: colors.error.light, // #DC2626
} as const;
