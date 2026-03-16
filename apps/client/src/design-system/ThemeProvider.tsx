import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { lightColors, darkColors } from './tokens.js';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
  theme: typeof lightColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => {},
  theme: lightColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const toggle = useCallback(() => setMode((m) => (m === 'light' ? 'dark' : 'light')), []);
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
