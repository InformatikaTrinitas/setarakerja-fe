import React, { createContext, useContext } from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, toggle, isDark } = useTheme();
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme: toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
