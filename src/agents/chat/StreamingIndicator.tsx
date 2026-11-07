import { cn } from '@/lib/utils';

export interface StreamingIndicatorProps {
  readonly variant?: 'dots' | 'pulse';
  readonly label?: string;
  readonly className?: string;
}

export function StreamingIndicator({
  variant = 'pulse',
  label = 'Pensando...',
  className,
}: StreamingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
    >
      <div className="flex gap-1" aria-hidden="true">
        {[0, 150, 300].map((delay) => (
          <span
            key={`dot-${delay}`}
            data-dot
            className={cn(
              'h-1.5 w-1.5 rounded-full bg-primary',
              variant === 'pulse' && 'motion-safe:animate-pulse motion-reduce:animate-none',
            )}
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
