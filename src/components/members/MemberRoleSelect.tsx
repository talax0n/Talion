'use client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MemberRoleSelectProps {
  userId: string
  workspaceId: string
  currentRole: string
  onRoleChange?: (role: string) => void
}

export function MemberRoleSelect({ userId, workspaceId, currentRole, onRoleChange }: MemberRoleSelectProps) {
  async function handleChange(role: string) {
    await fetch(`/api/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, role }),
    })
    onRoleChange?.(role)
  }

  return (
    <Select defaultValue={currentRole} onValueChange={handleChange}>
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="viewer">Viewer</SelectItem>
        <SelectItem value="editor">Editor</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  )
}
