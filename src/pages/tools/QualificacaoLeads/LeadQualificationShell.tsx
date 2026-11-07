import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft, ListTodo } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getLeadQualificationAppPath,
  getLeadQualificationConfigPath,
  getLeadQualificationNewPath,
  getLeadQualificationOverviewPath,
} from "@/features/comercial/toolRoutes";

function navLinkClassName(isActive: boolean) {
  return [
    "rounded-full px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
  ].join(" ");
}

export default function LeadQualificationShell() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      <div className="border-b border-border/30 glass-strong sticky top-20 z-40">
        <div className="container flex min-h-14 flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link to={getLeadQualificationOverviewPath()}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar ao resumo</span>
              </Button>
            </Link>

            <div className="h-4 w-px bg-border/60" />

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ListTodo className="h-4 w-4" />
              </div>
              <span className="font-display font-semibold text-sm">Radar de Leads</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink
              to={getLeadQualificationAppPath()}
              end
              className={({ isActive }) => navLinkClassName(isActive)}
            >
              Fila
            </NavLink>
            <NavLink
              to={getLeadQualificationNewPath()}
              className={({ isActive }) => navLinkClassName(isActive)}
            >
              Novo lead
            </NavLink>
            <NavLink
              to={getLeadQualificationConfigPath()}
              className={({ isActive }) => navLinkClassName(isActive)}
            >
              Configuração
            </NavLink>
          </nav>
        </div>
      </div>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
