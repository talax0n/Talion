export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor = 'indigo' | 'teal' | 'violet' | 'rose' | 'amber';

export type FontFamily = 'sans' | 'serif' | 'mono';

export interface ThemeConfig {
  mode: ThemeMode;
  accent: AccentColor;
  fontFamily: FontFamily;
}

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'system',
  accent: 'indigo',
  fontFamily: 'sans',
};

export const ACCENT_COLORS: Record<AccentColor, { label: string; value: string }> = {
  indigo: { label: 'Indigo', value: '#6366f1' },
  teal:   { label: 'Teal',   value: '#14b8a6' },
  violet: { label: 'Violet', value: '#8b5cf6' },
  rose:   { label: 'Rose',   value: '#f43f5e' },
  amber:  { label: 'Amber',  value: '#f59e0b' },
};
