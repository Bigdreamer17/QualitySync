import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ClipboardList,
  Bug,
  Rss,
  LogOut,
  User,
  Users,
  ChevronRight,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/pm',
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['PM'],
  },
  {
    label: 'Master Test List',
    href: '/pm/tests',
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ['PM'],
  },
  {
    label: 'User Management',
    href: '/pm/users',
    icon: <Users className="h-5 w-5" />,
    roles: ['PM'],
  },
  {
    label: 'My Assignments',
    href: '/qa',
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ['QA'],
  },
  {
    label: 'Report Bug',
    href: '/qa/report-bug',
    icon: <Bug className="h-5 w-5" />,
    roles: ['QA'],
  },
  {
    label: 'Global Feed',
    href: '/engineering',
    icon: <Rss className="h-5 w-5" />,
    roles: ['ENG'],
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  const roleLabels: Record<UserRole, string> = {
    PM: 'Product Manager',
    QA: 'QA Tester',
    ENG: 'Engineering',
  };

  const roleBadgeColors: Record<UserRole, string> = {
    PM: 'bg-blue-100 text-blue-800',
    QA: 'bg-green-100 text-green-800',
    ENG: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">QS</span>
              </div>
              <span className="font-semibold text-lg">QualitySync</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {item.icon}
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', roleBadgeColors[user.role])}>
                  {roleLabels[user.role]}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
