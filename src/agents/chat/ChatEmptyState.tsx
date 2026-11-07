import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Suggestion } from './types';

export interface ChatEmptyStateProps {
  agentName: string;
  agentMission?: string;
  avatarSrc?: string;
  suggestions?: Suggestion[];
  onPick?: (suggestion: Suggestion) => void;
  className?: string;
  contentClassName?: string;
}

export function ChatEmptyState({
  agentName,
  agentMission,
  avatarSrc,
  suggestions,
  onPick,
  className,
  contentClassName,
}: ChatEmptyStateProps) {
  return (
    <div
      data-testid="chat-empty-state"
      className={cn(
        'mx-auto flex w-full max-w-[760px] flex-col items-center gap-5 px-4 py-12 text-center sm:px-6 md:py-16',
        contentClassName,
        className,
      )}
    >
      <Avatar className="h-20 w-20 glow-primary-sm">
        {avatarSrc ? <AvatarImage src={avatarSrc} alt={agentName} /> : null}
        <AvatarFallback className="gradient-primary text-2xl text-primary-foreground">
          {agentName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <h1 className="font-display text-2xl font-bold text-foreground">{agentName}</h1>
      {agentMission ? <p className="max-w-md text-sm text-muted-foreground">{agentMission}</p> : null}

      {suggestions && suggestions.length > 0 ? (
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <li key={s.label}>
              <Button variant="outline" size="sm" type="button" onClick={() => onPick?.(s)}>
                {s.label}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
