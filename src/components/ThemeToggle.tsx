'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors select-none
        bg-[var(--surface)]
        border-[var(--border)]
        text-[var(--text)]
        hover:bg-[var(--surface-hover)]
        active:scale-95 shadow-xs ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[var(--accent)]" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
      )}
      {showLabel && (
        <span className="text-[11px] font-medium">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
