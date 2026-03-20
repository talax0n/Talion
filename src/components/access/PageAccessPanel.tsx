'use client'
import { useState } from 'react'
import { usePageAccess } from '@/hooks/use-access-groups'
import { useAccessGroups } from '@/hooks/use-access-groups'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Lock, Globe, Users, User, Plus } from 'lucide-react'

interface Props {
  pageId: string
  workspaceId: string
  pageVisibility?: string
  onVisibilityChange?: (visibility: string) => void
  children?: React.ReactNode
}

const ROLE_OPTIONS = ['viewer', 'editor', 'admin']

function SubjectLabel({
  entry,
}: {
  entry: { subjectType: string; subjectId: string | null; group: { name: string } | null }
}) {
  if (entry.subjectType === 'group' && entry.group) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {entry.group.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm">{entry.group.name}</span>
        <Badge variant="outline" className="text-xs">group</Badge>
      </div>
    )
  }

  if (entry.subjectType === 'user' && entry.subjectId) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            <User size={12} />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-mono">{entry.subjectId.slice(0, 8)}...</span>
        <Badge variant="outline" className="text-xs">user</Badge>
      </div>
    )
  }

  return (
    <span className="text-sm text-muted-foreground capitalize">{entry.subjectType}</span>
  )
}

interface AddAccessFormProps {
  pageId: string
  workspaceId: string
  onAdd: (subjectType: string, subjectId: string | null, role: string) => Promise<void>
}

function AddAccessForm({ pageId, workspaceId, onAdd }: AddAccessFormProps) {
  const [open, setOpen] = useState(false)
  const [subjectType, setSubjectType] = useState<'group' | 'user'>('group')
  const [subjectId, setSubjectId] = useState('')
  const [role, setRole] = useState('viewer')
  const [saving, setSaving] = useState(false)
  const { groups } = useAccessGroups(workspaceId)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onAdd(subjectType, subjectId || null, role)
      setSubjectId('')
      setRole('viewer')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
        <Plus size={14} />
        Add Access
      </Button>
    )
  }

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="space-y-1">
        <Label>Type</Label>
        <div className="flex gap-2">
          <Button
            variant={subjectType === 'group' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubjectType('group')}
            className="gap-1"
          >
            <Users size={13} />
            Group
          </Button>
          <Button
            variant={subjectType === 'user' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubjectType('user')}
            className="gap-1"
          >
            <User size={13} />
            User
          </Button>
        </div>
      </div>

      {subjectType === 'group' ? (
        <div className="space-y-1">
          <Label>Group</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
          >
            <option value="">Select a group...</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-1">
          <Label>User ID</Label>
          <Input
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            placeholder="Enter user ID"
          />
        </div>
      )}

      <div className="space-y-1">
        <Label>Role</Label>
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {ROLE_OPTIONS.map(r => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={saving || (subjectType === 'group' && !subjectId)}
        >
          {saving ? 'Adding...' : 'Add'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function PageAccessPanel({
  pageId,
  workspaceId,
  pageVisibility = 'private',
  onVisibilityChange,
  children,
}: Props) {
  const { entries, loading, setAccess } = usePageAccess(pageId)
  const isPublic = pageVisibility === 'public'

  const handleVisibilityToggle = () => {
    const next = isPublic ? 'private' : 'public'
    onVisibilityChange?.(next)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="gap-1">
            <Lock size={14} />
            Access
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Page Access</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Visibility toggle */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              {isPublic ? <Globe size={16} /> : <Lock size={16} />}
              <div>
                <p className="text-sm font-medium">{isPublic ? 'Public' : 'Private'}</p>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? 'Anyone with the link can view'
                    : 'Only people with access can view'}
                </p>
              </div>
            </div>
            {onVisibilityChange && (
              <Switch checked={isPublic} onCheckedChange={handleVisibilityToggle} />
            )}
          </div>

          {/* Access entries */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Who has access</h4>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No explicit access entries.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <SubjectLabel entry={entry} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {entry.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <AddAccessForm pageId={pageId} workspaceId={workspaceId} onAdd={setAccess} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
