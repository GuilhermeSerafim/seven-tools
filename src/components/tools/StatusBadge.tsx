import { STATUS_CONFIG, type ToolStatus } from '@/data/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ToolStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  );
}
