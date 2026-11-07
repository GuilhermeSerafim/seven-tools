import { Link, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, Home, LayoutGrid, LogOut, User as UserIcon, Settings, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminPendingReviewsBell } from '@/components/admin/AdminPendingReviewsBell';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/auth/AuthContext';
import { tools } from '@/data/tools';
import { modules } from '@/data/modules';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ─── Brand logo ────────────────────────────────────────────────────────────────

function BrandLogo() {
  const [imgFailed, setImgFailed] = useState(false);
  if (imgFailed) {
    return (
      <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl gradient-primary flex items-center justify-center font-display font-extrabold text-primary-foreground text-lg shrink-0">
        S
      </div>
    );
  }
  return (
    <img
      src="/seven-logo.png"
      alt="SEVEN"
      className="h-12 md:h-14 w-auto object-contain drop-shadow-md shrink-0"
      onError={() => setImgFailed(true)}
    />
  );
}

interface SearchResult {
  type: 'module' | 'tool';
  name: string;
  description: string;
  path: string;
}

interface SearchResultsProps {
  query: string;
  onSelect: (path: string) => void;
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function SearchResults({ query, onSelect }: SearchResultsProps) {
  const q = normalizeSearchValue(query.trim());

  const results = useMemo<SearchResult[]>(() => {
    if (!q) return [];

    const matchedModules: SearchResult[] = modules
      .filter(m =>
        normalizeSearchValue(m.name).includes(q) ||
        normalizeSearchValue(m.description).includes(q),
      )
      .map(m => ({
        type: 'module',
        name: m.name,
        description: m.description,
        path: `/modules/${m.slug}`,
      }));

    const matchedTools: SearchResult[] = tools
      .filter(t =>
        normalizeSearchValue(t.name).includes(q) ||
        normalizeSearchValue(t.shortDescription).includes(q) ||
        t.tags.some(tag => normalizeSearchValue(tag).includes(q)),
      )
      .map(t => ({
        type: 'tool',
        name: t.name,
        description: t.shortDescription,
        path: `/tools/${t.slug}`,
      }));

    return [...matchedModules, ...matchedTools].slice(0, 8);
  }, [q]);

  if (!q || results.length === 0) {
    if (!q) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border/30 glass-strong shadow-xl p-4 z-50">
        <p className="text-sm text-muted-foreground text-center">
          Nenhum resultado para <span className="font-medium text-foreground">"{query}"</span>
        </p>
      </div>
    );
  }

  const moduleResults = results.filter(r => r.type === 'module');
  const toolResults = results.filter(r => r.type === 'tool');

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border/30 glass-strong shadow-xl overflow-hidden z-50">
      {moduleResults.length > 0 && (
        <div>
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Módulos
          </p>
          {moduleResults.map(r => (
            <button
              key={r.path}
              onClick={() => onSelect(r.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                M
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {toolResults.length > 0 && (
        <div className={moduleResults.length > 0 ? 'border-t border-border/30' : ''}>
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Ferramentas
          </p>
          {toolResults.map(r => (
            <button
              key={r.path}
              onClick={() => onSelect(r.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-bold">
                T
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="border-t border-border/30 px-3 py-2">
        <p className="text-[10px] text-muted-foreground/50">
          {results.length} resultado{results.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

interface SearchInputProps {
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}

function SearchInput({ className, inputClassName, autoFocus }: SearchInputProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setQuery('');
    setShowResults(false);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setShowResults(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
        onFocus={() => setShowResults(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar ferramentas"
        autoFocus={autoFocus}
        className={`w-full h-9 pl-9 pr-8 rounded-xl bg-surface border border-border/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors ${inputClassName ?? ''}`}
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setShowResults(false); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {showResults && query.trim().length >= 1 && (
        <SearchResults query={query} onSelect={handleSelect} />
      )}
    </div>
  );
}

const navLinks = [
  { to: '/hub', label: 'Home', icon: Home },
  { to: '/tools', label: 'Ferramentas', icon: LayoutGrid },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, company, logout, isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const shellHomePath = user ? '/hub' : '/';
  const isChatFocusRoute =
    matchPath({ path: '/tools/proposta-comercial-smart/app/chat', end: true }, location.pathname) !== null;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      data-variant={isChatFocusRoute ? 'chat-focus' : 'default'}
      className={cn(
        'sticky top-0 z-50 w-full border-b backdrop-blur',
        isChatFocusRoute
          ? 'border-border/20 bg-background/95 supports-[backdrop-filter]:bg-background/85'
          : 'border-border/30 glass-strong',
      )}
    >
      <div
        className={cn(
          'container flex items-center justify-between gap-4',
          isChatFocusRoute ? 'h-[4.5rem]' : 'h-20',
        )}
      >
        <Link to={shellHomePath} className="flex items-center gap-3.5 shrink-0">
          <BrandLogo />
          <span className="font-display font-extrabold text-xl hidden sm:block tracking-tight">
            SEVEN <span className="text-primary">Tools</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : isChatFocusRoute
                    ? 'text-muted-foreground/80 hover:bg-muted/40 hover:text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/5',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SearchInput className="hidden sm:block w-64" />

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>

          {user && (
            <div className="hidden md:flex items-center gap-2">
              {isAdmin && <AdminPendingReviewsBell />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus-visible:outline-none rounded-full">
                    <UserAvatar
                      name={user.name}
                      avatarUrl={user.avatarUrl}
                      size="md"
                      className="hover:shadow-[0_0_12px_rgba(255,140,26,0.2)] transition-all duration-200 cursor-pointer"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="font-semibold font-display truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <UserIcon className="h-4 w-4 mr-2" /> Meu perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card border-border/30 w-72">
              <SheetTitle className="font-display">Menu</SheetTitle>

              {user && company && (
                <div className="flex items-center gap-3 mt-4 mb-2 px-1">
                  <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{company.name}</p>
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-2 mt-4">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      location.pathname === link.to
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/profile"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    location.pathname === '/profile'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Meu perfil
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/membros-pendentes"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      location.pathname === '/admin/membros-pendentes'
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Revisões pendentes
                  </Link>
                )}
              </nav>

              {user && (
                <div className="absolute bottom-6 left-4 right-4">
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sair da conta
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {searchOpen && (
        <div className="sm:hidden px-4 pb-3">
          <SearchInput autoFocus inputClassName="h-10" />
        </div>
      )}
    </header>
  );
}
