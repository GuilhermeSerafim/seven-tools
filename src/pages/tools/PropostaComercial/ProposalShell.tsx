import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProposalOverviewPath } from '@/features/comercial/toolRoutes';

export default function ProposalShell() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      <div className="border-b border-border/30 glass-strong sticky top-20 z-40">
        <div className="container flex h-14 items-center gap-4">
          <Link to={getProposalOverviewPath()}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar à visão geral</span>
            </Button>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-sm">Caloni Propostas</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
