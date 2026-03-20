'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ACCENT_PRESETS, applyAccentColor } from '@/lib/theme'
import type { AccentColor } from '@/types/theme'
import { cn } from '@/lib/utils'

interface ThemeCustomizerProps {
  workspaceId: string
  initialTheme?: {
    accent?: AccentColor
    fontFamily?: string
    customCss?: string
  }
}

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
  { value: 'system', label: 'System' },
]

export function ThemeCustomizer({ workspaceId, initialTheme }: ThemeCustomizerProps) {
  const [accent, setAccent] = useState<AccentColor>(initialTheme?.accent ?? 'indigo')
  const [fontFamily, setFontFamily] = useState(initialTheme?.fontFamily ?? 'inter')
  const [customCss, setCustomCss] = useState(initialTheme?.customCss ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleAccentChange(value: AccentColor) {
    setAccent(value)
    applyAccentColor(value)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: { accent, fontFamily, customCss } }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleAccentChange(preset.name)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg p-2 border-2 transition-colors',
                  accent === preset.name
                    ? 'border-foreground'
                    : 'border-transparent hover:border-muted-foreground/30'
                )}
              >
                <span
                  className="w-8 h-8 rounded-full"
                  style={{
                    background: `hsl(${preset.primary})`,
                  }}
                />
                <span className="text-xs text-muted-foreground">{preset.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font Family</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[150px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y"
            placeholder="/* Add custom CSS here */"
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="self-start">
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save theme'}
      </Button>
    </div>
  )
}
