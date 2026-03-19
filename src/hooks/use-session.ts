'use client'

import { useSession as useAuthSession } from '@/lib/auth-client'

export function useSession() {
  const { data, isPending, error } = useAuthSession()
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    isPending,
    error,
  }
}
