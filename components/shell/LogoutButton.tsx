'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth-client';

interface LogoutButtonProps {
  className?: string;
  showLabel?: boolean;
}

export function LogoutButton({ className, showLabel = true }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={[
        'flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300',
        'hover:bg-white/5 px-2 py-1.5 rounded-md transition-colors w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <LogOut className="w-3.5 h-3.5 shrink-0" />
      {showLabel && <span>Sign out</span>}
    </button>
  );
}
