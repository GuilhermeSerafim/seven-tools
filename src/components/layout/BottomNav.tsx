import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Search, User } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/tools', label: 'Ferramentas', icon: LayoutGrid },
  { to: '/tools?search=', label: 'Busca', icon: Search },
  { to: '/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/30 glass-strong pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              className="flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors duration-200"
            >
              <div
                className={`p-1.5 rounded-xl transition-colors duration-200 ${
                  isActive ? 'bg-primary/10' : ''
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              </div>
              <span
                className={
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
