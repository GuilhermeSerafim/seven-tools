import { PanelLeft } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { ToolChatSession } from './types';
import { ToolChatSidebar } from './ToolChatSidebar';

interface ToolChatShellProps {
  sessions: ToolChatSession[];
  activeSessionId?: string | null;
  searchQuery: string;
  loadingSessions: boolean;
  sessionsError: string | null;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onOpenSession: (sessionId: string) => void;
  children: ReactNode;
}

export function ToolChatShell({
  sessions,
  activeSessionId,
  searchQuery,
  loadingSessions,
  sessionsError,
  onSearchChange,
  onNewChat,
  onOpenSession,
  children,
}: ToolChatShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <ToolChatSidebar
      sessions={sessions}
      activeSessionId={activeSessionId}
      searchQuery={searchQuery}
      loading={loadingSessions}
      error={sessionsError}
      onSearchChange={onSearchChange}
      onNewChat={() => {
        onNewChat();
        setMobileOpen(false);
      }}
      onOpenSession={(sessionId) => {
        onOpenSession(sessionId);
        setMobileOpen(false);
      }}
    />
  );

  return (
    <div className="grid h-full min-h-0 bg-background md:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden min-h-0 md:block">{sidebar}</div>
      <div className="relative min-h-0">
        <div className="absolute left-4 top-4 z-20 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Abrir historico">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-border/30 bg-sidebar p-0">
              <SheetTitle className="sr-only">Historico de conversas</SheetTitle>
              <SheetDescription className="sr-only">
                Lista de conversas recentes e busca do historico do chat.
              </SheetDescription>
              <div className="h-full pt-10">{sidebar}</div>
            </SheetContent>
          </Sheet>
        </div>
        {children}
      </div>
    </div>
  );
}
