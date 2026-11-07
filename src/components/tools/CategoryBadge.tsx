import { CATEGORY_MAP, type ToolCategory } from '@/data/types';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: ToolCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const info = CATEGORY_MAP[category];
  return (
    <span className={cn('inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted-foreground', className)}>
      {info.name}
    </span>
  );
}
