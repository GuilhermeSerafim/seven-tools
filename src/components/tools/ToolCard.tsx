import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { type Tool } from '@/data/types';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { FavoriteButton } from './FavoriteButton';
import { getIconByName } from '@/lib/iconRegistry';

interface ToolCardProps {
  tool: Tool;
  featured?: boolean;
}

export function ToolCard({ tool, featured }: ToolCardProps) {
  const IconComponent = getIconByName(tool.icon);

  return (
    <Link
      to={`/tools/${tool.slug}`}
      className={`group relative flex flex-col rounded-xl border border-border/30 bg-card shadow-depth p-5 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${
        featured ? 'md:col-span-2 md:flex-row md:items-center md:gap-6' : ''
      }`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none glow-primary-sm" />

      <div className={`relative flex flex-col gap-3 ${featured ? 'md:flex-1' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-semibold leading-tight line-clamp-2 break-words sm:line-clamp-1">
                {tool.name}
              </h3>
              <CategoryBadge category={tool.category} className="mt-1" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StatusBadge status={tool.status} />
            <FavoriteButton toolId={tool.id} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{tool.shortDescription}</p>

        {featured && (
          <p className="text-xs text-primary font-medium">{tool.mainBenefit}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-2 pt-2">
          <span className="text-xs font-medium text-primary group-hover:underline inline-flex items-center gap-1">
            Acessar <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </span>
          {tool.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs text-muted-foreground bg-surface rounded-full px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
