import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from '@/components/shell/UserMenu';

interface TopNavProps {
  title?: string;
}

export function TopNav({ title = 'Dashboard' }: TopNavProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-background">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
