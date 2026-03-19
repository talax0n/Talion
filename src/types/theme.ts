export type AccentColor = 'indigo' | 'teal' | 'violet' | 'rose' | 'amber'

export interface AccentPreset {
  name: AccentColor
  label: string
  primary: string
  ring: string
}

export interface ThemeConfig {
  accent: AccentColor
  mode: 'light' | 'dark' | 'system'
}
