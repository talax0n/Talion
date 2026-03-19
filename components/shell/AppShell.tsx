import { cn } from '@/lib/utils';

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ sidebar, children, className }: AppShellProps) {
  return (
    <div className={cn('flex h-screen overflow-hidden', className)}>
      {sidebar}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
