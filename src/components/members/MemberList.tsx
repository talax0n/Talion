'use client'
import { useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MemberRoleSelect } from './MemberRoleSelect'
import { Trash2 } from 'lucide-react'

interface Member {
  userId: string
  workspaceId: string
  role: string
  joinedAt: string
  name: string
  email: string
}

interface MemberListProps {
  members: Member[]
  ownerId: string
  currentUserId: string
}

function formatJoinedAt(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths === 1) return '1 month ago'
  if (diffMonths < 12) return `${diffMonths} months ago`
  const diffYears = Math.floor(diffMonths / 12)
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`
}

export function MemberList({ members: initialMembers, ownerId, currentUserId }: MemberListProps) {
  const [members, setMembers] = useState(initialMembers)

  async function handleRemove(userId: string) {
    const member = members.find(m => m.userId === userId)
    if (!member) return
    await fetch(`/api/members/${userId}?workspaceId=${member.workspaceId}`, {
      method: 'DELETE',
    })
    setMembers(prev => prev.filter(m => m.userId !== userId))
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map(member => {
          const isOwner = member.userId === ownerId
          const isSelf = member.userId === currentUserId
          return (
            <TableRow key={member.userId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{(member.name || member.email)[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.name || member.email}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {isOwner ? (
                  <Badge variant="default">Owner</Badge>
                ) : (
                  <MemberRoleSelect
                    userId={member.userId}
                    workspaceId={member.workspaceId}
                    currentRole={member.role}
                    onRoleChange={role => setMembers(prev =>
                      prev.map(m => m.userId === member.userId ? { ...m, role } : m)
                    )}
                  />
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatJoinedAt(member.joinedAt)}
              </TableCell>
              <TableCell>
                {!isOwner && !isSelf && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {member.name || member.email} from the workspace.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemove(member.userId)}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
