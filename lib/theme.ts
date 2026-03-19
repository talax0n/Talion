import type { AccentColor, ThemeConfig } from '@/types/theme';

const ACCENT_CSS_VARS: Record<AccentColor, { 500: string; 600: string; 100: string }> = {
  indigo: { 500: '#6366f1', 600: '#4f46e5', 100: '#e0e7ff' },
  teal:   { 500: '#14b8a6', 600: '#0d9488', 100: '#ccfbf1' },
  violet: { 500: '#8b5cf6', 600: '#7c3aed', 100: '#ede9fe' },
  rose:   { 500: '#f43f5e', 600: '#e11d48', 100: '#ffe4e6' },
  amber:  { 500: '#f59e0b', 600: '#d97706', 100: '#fef3c7' },
};

/**
 * Apply an accent color to the document root CSS variables.
 * Call from client-side code only.
 */
export function applyAccentColor(accent: AccentColor): void {
  if (typeof document === 'undefined') return;
  const vars = ACCENT_CSS_VARS[accent];
  const root = document.documentElement;
  root.style.setProperty('--accent-500', vars[500]);
  root.style.setProperty('--accent-600', vars[600]);
  root.style.setProperty('--accent-100', vars[100]);
  // Also override the main accent var used throughout the app
  root.style.setProperty('--accent', vars[500]);
  root.style.setProperty('--accent-hover', vars[600]);
  root.style.setProperty('--accent-subtle', vars[100]);
}

/**
 * Save theme config to localStorage.
 */
export function saveThemeConfig(config: Partial<ThemeConfig>): void {
  if (typeof localStorage === 'undefined') return;
  const existing = loadThemeConfig();
  localStorage.setItem('talion_theme_config', JSON.stringify({ ...existing, ...config }));
}

/**
 * Load theme config from localStorage.
 */
export function loadThemeConfig(): Partial<ThemeConfig> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem('talion_theme_config');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
