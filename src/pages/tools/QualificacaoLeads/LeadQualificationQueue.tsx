import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Settings2 } from "lucide-react";

import { AppLoader } from "@/components/ui/app-loader";
import { Button } from "@/components/ui/button";
import {
  ACTION_LABELS,
  GROUP_ORDER,
  STATUS_LABELS,
  TIER_LABELS,
  groupLeadAction,
} from "@/features/comercial/leadQualificationLabels";
import {
  getLeadQualificationConfigPath,
  getLeadQualificationDetailPath,
  getLeadQualificationNewPath,
} from "@/features/comercial/toolRoutes";
import {
  type LeadQualificationConfig,
  type QualifiedLead,
  leadQualificationService,
} from "@/services/leadQualificationService";

export default function LeadQualificationQueue() {
  const [config, setConfig] = useState<LeadQualificationConfig | null>(null);
  const [leads, setLeads] = useState<QualifiedLead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadQueue() {
      try {
        setHasLoadError(false);
        const currentConfig = await leadQualificationService.getConfig();
        if (!isMounted) {
          return;
        }

        setConfig(currentConfig);
        if (!currentConfig) {
          setLeads([]);
          setTotalLeads(0);
          return;
        }

        const queue = await leadQualificationService.listLeads();
        if (!isMounted) {
          return;
        }

        setLeads(queue.items);
        setTotalLeads(queue.total);
      } catch {
        if (!isMounted) {
          return;
        }
        setLeads([]);
        setTotalLeads(0);
        setHasLoadError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container py-10">
        <AppLoader label="Carregando fila..." size="sm" className="py-10" />
      </div>
    );
  }

  if (hasLoadError) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Settings2 className="h-6 w-6" />
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground">
            Não foi possível carregar a fila comercial
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tente novamente em instantes. Se o problema continuar, revise a configuração da
            ferramenta ou a disponibilidade da API.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={getLeadQualificationConfigPath()}>
              <Button className="gap-2">
                Abrir configuração
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (config) {
    const groupedLeads = GROUP_ORDER.map((action) => ({
      action,
      items: leads
        .filter((lead) => lead.recommendedAction === action)
        .sort((left, right) => right.score - left.score),
    })).filter((group) => group.items.length > 0);

    return (
      <div className="container py-10 space-y-6">
        <div className="rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Fila priorizada</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Trabalhe a operação comercial a partir da ação recomendada pelo método configurado
                para a empresa.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={getLeadQualificationNewPath()}>
                <Button className="gap-2">
                  Novo lead
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={getLeadQualificationConfigPath()}>
                <Button variant="outline" className="gap-2">
                  Ajustar configuração
                  <Settings2 className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-border/30 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Leads</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{totalLeads}</p>
            </div>
            <div className="rounded-2xl border border-border/30 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Segmentos ICP</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {config.idealSegments.join(", ") || "Não definido"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/30 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Porte ICP</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {config.idealCompanySizes.join(", ") || "Não definido"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/30 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Perfis ICP</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {config.idealRoles.join(", ") || "Não definido"}
              </p>
            </div>
          </div>
        </div>

        {groupedLeads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/40 bg-card/70 p-8 shadow-depth">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Ainda não existem leads na fila compartilhada
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              O método já está configurado. Agora o SDR pode cadastrar o primeiro lead manual
              para iniciar a priorização.
            </p>
            <div className="mt-6">
              <Link to={getLeadQualificationNewPath()}>
                <Button className="gap-2">
                  Cadastrar primeiro lead
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {totalLeads > leads.length ? (
              <p className="text-sm text-muted-foreground">
                Mostrando {leads.length} de {totalLeads} leads na primeira carga.
              </p>
            ) : null}
            {groupedLeads.map((group) => (
              <section key={group.action} className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    {groupLeadAction(group.action)}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {group.items.length} lead{group.items.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {group.items.map((lead) => (
                    <Link key={lead.id} to={getLeadQualificationDetailPath(lead.id)}>
                      <article className="rounded-3xl border border-border/30 bg-card p-6 shadow-depth transition hover:-translate-y-0.5 hover:border-primary/30">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-display text-xl font-semibold text-foreground">
                              {lead.companyName}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {lead.contactName} · {lead.contactRole}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-semibold text-foreground">{lead.score}/100</p>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {TIER_LABELS[lead.tier]}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-background/60 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Ação
                            </p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                              {ACTION_LABELS[lead.recommendedAction]}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-background/60 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Status
                            </p>
                            <p className="mt-1 text-sm font-medium text-foreground">
                              {STATUS_LABELS[lead.status]}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-background/60 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Segmento
                            </p>
                            <p className="mt-1 text-sm font-medium text-foreground">{lead.segment}</p>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Settings2 className="h-6 w-6" />
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground">
          Configure o método da empresa antes de classificar leads
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Defina ICP, pesos, faixas e ações para liberar a fila compartilhada.
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Assim que a configuração estiver pronta, esta área passa a exibir a fila priorizada do time comercial.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={getLeadQualificationConfigPath()}>
            <Button className="gap-2">
              Ir para configuração
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
