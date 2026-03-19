'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface AutosaveOptions {
  pageId: string;
  title: string;
  content_md: string;
  content_html: string;
  enabled?: boolean;
  onSave?: () => void;
  onError?: (err: Error) => void;
}

export function useAutosave(options: AutosaveOptions): { saving: boolean } {
  const { pageId, title, content_md, content_html, enabled = true, onSave, onError } = options;
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const save = useCallback(
    async (t: string, md: string, html: string) => {
      if (!mountedRef.current) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/pages/${pageId}/save`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: t, content_md: md, content_html: html }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Save failed: ${res.status} ${text}`);
        }
        if (mountedRef.current) {
          onSave?.();
        }
      } catch (err) {
        if (mountedRef.current) {
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mountedRef.current) {
          setSaving(false);
        }
      }
    },
    [pageId, onSave, onError],
  );

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save(title, content_md, content_html);
    }, 1500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, title, content_md, content_html, save]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { saving };
}
