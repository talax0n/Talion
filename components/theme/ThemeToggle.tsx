'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { ThemeMode } from '@/types/theme';

const MODES: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
  { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
  { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
];

interface ThemeToggleProps {
  /** Show label next to icon (default: false) */
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  function cycleTheme() {
    const current = MODES.findIndex((m) => m.value === theme);
    const next = MODES[(current + 1) % MODES.length];
    setTheme(next.value);
  }

  const currentMode = MODES.find((m) => m.value === theme) ?? MODES[2];

  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${currentMode.label} — click to change`}
      className={[
        'flex items-center gap-1.5 text-sm transition-colors',
        'text-zinc-500 hover:text-zinc-300',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {currentMode.icon}
      {showLabel && <span>{currentMode.label}</span>}
    </button>
  );
}
