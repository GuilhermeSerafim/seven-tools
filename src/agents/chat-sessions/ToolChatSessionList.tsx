import { Clock } from 'lucide-react';

import type { ToolChatSession } from './types';
import { ToolChatSessionItem } from './ToolChatSessionItem';

interface ToolChatSessionListProps {
  sessions: ToolChatSession[];
  activeSessionId?: string | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onOpenSession: (sessionId: string) => void;
}

export function ToolChatSessionList({
  sessions,
  activeSessionId,
  loading,
  error,
  searchQuery,
  onOpenSession,
}: ToolChatSessionListProps) {
  if (loading) {
    return (
      <div className="space-y-2" aria-label="Carregando conversas">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-muted/30" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="rounded-md border border-border/40 p-3 text-sm text-muted-foreground">{error}</p>;
  }

  if (sessions.length === 0) {
    return (
      <p className="rounded-md border border-border/40 p-3 text-sm text-muted-foreground">
        {searchQuery.trim() ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Recentes
      </div>
      <div className="space-y-1">
        {sessions.map((session) => (
          <ToolChatSessionItem
            key={session.id}
            session={session}
            active={session.id === activeSessionId}
            onOpen={onOpenSession}
          />
        ))}
      </div>
    </section>
  );
}
