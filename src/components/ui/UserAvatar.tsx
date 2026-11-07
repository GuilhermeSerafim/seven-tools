import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-16 w-16 text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export function UserAvatar({ name, avatarUrl, size = 'md', className }: UserAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('rounded-full object-cover shrink-0', sizeClass, className)}
        onError={(e) => {
          // On image load error, hide img and let fallback render
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = parent.querySelector('[data-avatar-fallback]') as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary font-display font-bold flex items-center justify-center shrink-0 select-none',
        sizeClass,
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

/** Logo da empresa: retângulo arredondado com imagem ou iniciais */
interface CompanyLogoProps {
  name: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const logoSizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export function CompanyLogo({ name, logoUrl, size = 'md', className }: CompanyLogoProps) {
  const sizeClass = logoSizeClasses[size];
  const initials = name.slice(0, 2).toUpperCase();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={cn('rounded-xl object-cover shrink-0', sizeClass, className)}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-muted text-muted-foreground font-display font-bold flex items-center justify-center shrink-0 select-none',
        sizeClass,
        className,
      )}
    >
      {initials}
    </div>
  );
}
