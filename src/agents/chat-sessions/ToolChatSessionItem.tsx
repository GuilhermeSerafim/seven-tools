import { MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ToolChatSession } from './types';

interface ToolChatSessionItemProps {
  session: ToolChatSession;
  active: boolean;
  onOpen: (sessionId: string) => void;
}

export function ToolChatSessionItem({ session, active, onOpen }: ToolChatSessionItemProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(session.id)}
      className={cn(
        'flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition',
        active
          ? 'bg-primary/10 text-foreground ring-1 ring-primary/30'
          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{session.title || 'Novo chat'}</span>
    </button>
  );
}
