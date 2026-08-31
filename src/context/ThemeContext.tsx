import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('apexgrowth_theme') as ThemeMode;
      if (saved && ['dark', 'light', 'system'].includes(saved)) {
        return saved;
      }
    }
    return 'dark'; // Default dark theme for ApexGrowth Digital
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;

    const updateTheme = () => {
      let active: 'dark' | 'light' = 'dark';
      if (themeMode === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = isSystemDark ? 'dark' : 'light';
      } else {
        active = themeMode;
      }

      setResolvedTheme(active);

      if (active === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    updateTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('apexgrowth_theme', mode);
  };

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setThemeMode('light');
    } else {
      setThemeMode('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
