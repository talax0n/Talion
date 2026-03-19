'use client';

import { useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw } from 'lucide-react';

interface Version {
  id: string;
  title: string;
  created_at: string;
  author_id: string;
}

interface VersionHistoryProps {
  pageId: string;
  onRestore: (content_md: string, content_html: string) => void;
}

export function VersionHistory({ pageId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/versions`);
      if (!res.ok) throw new Error('Failed to fetch versions');
      const data = await res.json();
      setVersions(data.versions ?? []);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = useCallback(
    async (versionId: string) => {
      setRestoringId(versionId);
      try {
        const res = await fetch(`/api/pages/${pageId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore', version_id: versionId }),
        });
        if (!res.ok) throw new Error('Failed to restore version');
        const data = await res.json();
        onRestore(data.page.content_md, data.page.content_html);
        await fetchVersions();
      } catch {
        // silently fail; caller may handle via onRestore not being called
      } finally {
        setRestoringId(null);
      }
    },
    [pageId, onRestore, fetchVersions],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Version History</span>
        {!loading && (
          <Badge variant="secondary" className="text-xs">
            {versions.length}
          </Badge>
        )}
      </div>

      <ScrollArea className="h-64 rounded-md border">
        <div className="flex flex-col gap-1 p-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))
          ) : versions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No versions yet.</p>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted/50"
              >
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate font-medium leading-tight">
                    {version.title || 'Untitled'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(version.created_at).toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 shrink-0"
                  disabled={restoringId === version.id}
                  onClick={() => handleRestore(version.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="sr-only">Restore</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
