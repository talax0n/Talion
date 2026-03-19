'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from '@/components/shell/UserMenu';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/pages', label: 'Pages', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-full overflow-hidden border-r"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border, var(--border))' }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <Link href="/dashboard" className="text-lg font-bold text-white tracking-tight">
          Talion
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/10 flex items-center justify-between">
        <ThemeToggle />
        <UserMenu />
      </div>
    </aside>
  );
}
