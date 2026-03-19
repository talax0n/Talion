import type { AccentPreset, AccentColor } from '@/types/theme'

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    name: 'indigo',
    label: 'Indigo',
    primary: '238.7 83.5% 66.7%',
    ring: '238.7 83.5% 66.7%',
  },
  {
    name: 'teal',
    label: 'Teal',
    primary: '173 80% 40%',
    ring: '173 80% 40%',
  },
  {
    name: 'violet',
    label: 'Violet',
    primary: '270 95% 75%',
    ring: '270 95% 75%',
  },
  {
    name: 'rose',
    label: 'Rose',
    primary: '347 77% 50%',
    ring: '347 77% 50%',
  },
  {
    name: 'amber',
    label: 'Amber',
    primary: '43 96% 56%',
    ring: '43 96% 56%',
  },
]

export function applyAccentColor(accent: AccentColor) {
  const preset = ACCENT_PRESETS.find((p) => p.name === accent)
  if (!preset) return
  const root = document.documentElement
  root.style.setProperty('--primary', preset.primary)
  root.style.setProperty('--ring', preset.ring)
}
