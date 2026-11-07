import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface AgentHeaderProps {
  name: string;
  subtitle?: string;
  avatarSrc?: string;
  status?: "online" | "thinking";
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AgentHeader({
  name,
  subtitle,
  avatarSrc,
  status,
  onBack,
  rightSlot,
  className,
  contentClassName,
}: AgentHeaderProps) {
  const statusLabel = status === 'thinking' ? 'Analisando' : status === 'online' ? 'Online' : null;

  return (
    <header className={cn('border-b border-border/20 bg-transparent px-4 py-4 md:px-6', className)}>
      <div
        data-testid="agent-header-shell"
        className={cn('mx-auto flex w-full max-w-[880px] items-center gap-3', contentClassName)}
      >
        {onBack ? (
          <button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : null}

        <Avatar className={cn('h-10 w-10', status === 'thinking' && 'glow-primary-sm')}>
          {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
          <AvatarFallback className="gradient-primary text-primary-foreground">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <span className="block font-display text-base font-semibold text-foreground">{name}</span>
          {subtitle ? <span className="block text-sm text-muted-foreground">{subtitle}</span> : null}
        </div>

        {statusLabel ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                status === 'thinking' ? 'bg-primary motion-safe:animate-pulse' : 'bg-emerald-400',
              )}
            />
            {statusLabel}
          </span>
        ) : null}

        {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
