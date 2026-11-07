import { PackageOpen, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({ message = 'Nenhuma ferramenta encontrada', actionLabel, onAction }: {
  message?: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,140,26,0.1)] mb-4">
        <PackageOpen className="h-8 w-8" />
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="mt-4 hover:-translate-y-0.5 transition-all">{actionLabel}</Button>
      )}
    </div>
  );
}

export function ErrorState({ message = 'Algo deu errado', onRetry }: {
  message?: string; onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <p className="text-muted-foreground font-medium">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4 hover:-translate-y-0.5 transition-all">Tentar novamente</Button>
      )}
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/30 bg-card p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-surface" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface rounded w-2/3" />
              <div className="h-3 bg-surface rounded w-1/3" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-surface rounded w-full" />
            <div className="h-3 bg-surface rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
