import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { lightColors, darkColors } from './tokens.js';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
  theme: typeof lightColors | typeof darkColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => {},
  theme: lightColors,
});

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('learnflow-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  const toggle = useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('learnflow-theme', next);
      return next;
    });
  }, []);

  // Apply dark class to <html> for Tailwind dark: variants
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  const theme = mode === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ mode, toggle, theme }}>
      <div
        data-theme={mode}
        style={{
          backgroundColor: theme.bg,
          color: theme.text,
          minHeight: '100vh',
          transition: 'background-color 0.2s, color 0.2s',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
