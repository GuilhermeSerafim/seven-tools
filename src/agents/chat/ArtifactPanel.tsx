import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface ArtifactPanelProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
  emptyState?: ReactNode;
  className?: string;
}

export function ArtifactPanel({
  title,
  subtitle,
  onClose,
  toolbar,
  children,
  emptyState,
  className,
}: ArtifactPanelProps) {
  const shouldRenderEmptyState =
    emptyState && (children === null || children === undefined || children === false);

  return (
    <section className={cn('flex h-full flex-col bg-card', className)} aria-label={title}>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
        </div>

        {toolbar ? <div className="flex items-center gap-2">{toolbar}</div> : null}

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </header>

      <div className="flex-1 overflow-auto p-6">
        {shouldRenderEmptyState ? emptyState : children}
      </div>
    </section>
  );
}
