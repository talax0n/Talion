'use client';

import { Loader2, CheckCircle2 } from 'lucide-react';

interface SaveStatusProps {
  saving: boolean;
  lastSaved?: Date | null;
}

export function SaveStatus({ saving, lastSaved }: SaveStatusProps) {
  if (saving) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving...
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3" />
        Saved
      </span>
    );
  }

  return null;
}
