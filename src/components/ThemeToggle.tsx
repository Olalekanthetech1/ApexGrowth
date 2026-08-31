import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4 text-emerald-400" /> },
    { mode: 'light', label: 'Light', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { mode: 'system', label: 'System', icon: <Laptop className="w-4 h-4 text-sky-400" /> },
  ];

  if (compact) {
    return (
      <button
        onClick={() => setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle Theme"
        className="p-2 rounded-lg bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white border border-slate-800 dark:border-slate-800 light:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {resolvedTheme === 'dark' ? <Moon className="w-4 h-4 text-emerald-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Select Theme Mode"
        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-800 hover:text-white dark:hover:text-white light:hover:text-slate-950 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition-colors"
      >
        {resolvedTheme === 'dark' ? <Moon className="w-3.5 h-3.5 text-emerald-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
        <span className="capitalize">{themeMode}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl z-50 py-1 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => {
                setThemeMode(opt.mode);
                setIsOpen(false);
              }}
              className={`flex items-center space-x-2.5 w-full px-3 py-2 text-xs text-left transition-colors ${
                themeMode === opt.mode
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold dark:text-emerald-400 light:text-emerald-600'
                  : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-800/60 dark:hover:bg-slate-800/60 light:hover:bg-slate-100'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
