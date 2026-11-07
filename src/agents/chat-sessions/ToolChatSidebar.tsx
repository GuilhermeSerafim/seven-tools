import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ToolChatSession } from './types';
import { ToolChatSearchInput } from './ToolChatSearchInput';
import { ToolChatSessionList } from './ToolChatSessionList';

interface ToolChatSidebarProps {
  sessions: ToolChatSession[];
  activeSessionId?: string | null;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onOpenSession: (sessionId: string) => void;
}

export function ToolChatSidebar({
  sessions,
  activeSessionId,
  searchQuery,
  loading,
  error,
  onSearchChange,
  onNewChat,
  onOpenSession,
}: ToolChatSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border/30 bg-sidebar/80 p-4">
      <Button
        type="button"
        onClick={onNewChat}
        className="h-10 w-full justify-start gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Novo chat
      </Button>

      <div className="mt-4">
        <ToolChatSearchInput value={searchQuery} onChange={onSearchChange} />
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
        <ToolChatSessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          onOpenSession={onOpenSession}
        />
      </div>
    </aside>
  );
}
