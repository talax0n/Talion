'use client'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
  id: string
  body: string
  resolved: boolean
  createdAt: string
  author: { fullName?: string | null; email: string }
}

interface CommentThreadProps {
  pageId: string
}

export function CommentThread({ pageId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/pages/${pageId}/comments`)
      .then(r => r.json())
      .then(data => { setComments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [pageId])

  async function submit() {
    if (!newComment.trim()) return
    const res = await fetch(`/api/pages/${pageId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment }),
    })
    const c = await res.json()
    setComments(prev => [...prev, c])
    setNewComment('')
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading comments...</div>
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="font-semibold text-sm">Comments</h3>
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}
      {comments.map(c => (
        <div key={c.id} className="flex gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">
              {(c.author.fullName ?? c.author.email)[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                {c.author.fullName ?? c.author.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
              </span>
              {c.resolved && (
                <Badge variant="secondary" className="text-xs">Resolved</Badge>
              )}
            </div>
            <p className="text-sm mt-1">{c.body}</p>
          </div>
        </div>
      ))}
      <div className="flex flex-col gap-2 mt-2">
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none min-h-[80px]"
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <Button size="sm" onClick={submit} disabled={!newComment.trim()}>
          Comment
        </Button>
      </div>
    </div>
  )
}
