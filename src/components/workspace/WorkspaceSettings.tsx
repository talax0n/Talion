'use client'
import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'

interface WorkspaceSettingsProps {
  workspaceId: string
  initialName: string
  initialDescription: string | null
  onDeleted?: () => void
}

export function WorkspaceSettings({
  workspaceId,
  initialName,
  initialDescription,
  onDeleted,
}: WorkspaceSettingsProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [saving, setSaving] = useState(false)
  const { setWorkspace } = useWorkspaceContext()

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await fetch(`/api/workspaces/${workspaceId}`, { method: 'DELETE' })
    setWorkspace(null)
    onDeleted?.()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your workspace details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="settings-desc">Description</Label>
            <Input
              id="settings-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>These actions are irreversible</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 size={14} />
                Delete Workspace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the workspace and all its pages. This cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
