'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Share2, Copy, Check } from 'lucide-react'

interface ShareLinkDialogProps {
  pageId: string
}

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: '1day', label: '1 Day' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
]

function getExpiresAt(expiry: string): string | undefined {
  const now = new Date()
  switch (expiry) {
    case '1day':
      now.setDate(now.getDate() + 1)
      return now.toISOString()
    case '7days':
      now.setDate(now.getDate() + 7)
      return now.toISOString()
    case '30days':
      now.setDate(now.getDate() + 30)
      return now.toISOString()
    default:
      return undefined
  }
}

export function ShareLinkDialog({ pageId }: ShareLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [expiry, setExpiry] = useState('never')
  const [password, setPassword] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    setError(null)

    try {
      const body: Record<string, unknown> = { pageId, role: 'viewer' }
      const expiresAt = getExpiresAt(expiry)
      if (expiresAt) body.expiresAt = expiresAt
      if (password.trim()) body.password = password.trim()

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create link')
        return
      }

      setGeneratedUrl(data.url)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedUrl) return
    await navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) {
      setGeneratedUrl(null)
      setPassword('')
      setExpiry('never')
      setError(null)
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create share link</DialogTitle>
        </DialogHeader>

        {!generatedUrl ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Link expiry</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="expiry">
                  <SelectValue placeholder="Select expiry" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave blank for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button onClick={handleCreate} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with anyone you want to give access to.
            </p>
            <div className="flex items-center gap-2">
              <Input value={generatedUrl} readOnly className="flex-1 text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
