import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { AppLoader } from "@/components/ui/app-loader";
import { ACTION_LABELS, STATUS_LABELS, TIER_LABELS } from "@/features/comercial/leadQualificationLabels";
import { leadQualificationService, type QualifiedLead } from "@/services/leadQualificationService";

export default function LeadQualificationDetail() {
  const { leadId } = useParams();
  const [lead, setLead] = useState<QualifiedLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLead() {
      if (!leadId) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        setHasLoadError(false);
        setIsNotFound(false);
        const currentLead = await leadQualificationService.getLead(leadId);
        if (isMounted) {
          setLead(currentLead);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const status =
          typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;

        setLead(null);
        if (status === 404) {
          setIsNotFound(true);
          return;
        }

        setHasLoadError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLead();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <AppLoader label="Carregando lead..." size="sm" className="py-10" />
      </div>
    );
  }

  if (hasLoadError) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Não foi possível carregar o lead
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tente novamente em instantes. Se o problema continuar, revise a disponibilidade da API.
          </p>
        </div>
      </div>
    );
  }

  if (isNotFound || !lead) {
    return (
      <div className="container py-10">
        <div className="rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
          <h1 className="font-display text-3xl font-bold text-foreground">Lead não encontrado</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Não foi possível localizar o lead solicitado.
          </p>
        </div>
      </div>
    );
  }

  const snapshotMatches =
    (lead.scoringSnapshot?.matches as Record<string, boolean> | undefined) ?? {};

  return (
    <div className="container py-10 space-y-6">
      <div className="rounded-3xl border border-border/30 bg-card p-8 shadow-depth">
        <h1 className="font-display text-3xl font-bold text-foreground">{lead.companyName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {lead.contactName} · {lead.contactRole} · {lead.segment}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-border/30 bg-card p-6 shadow-depth">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Score</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{lead.score}</p>
        </div>
        <div className="rounded-3xl border border-border/30 bg-card p-6 shadow-depth">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Faixa</p>
          <p className="mt-2 text-xl font-semibold text-foreground">{TIER_LABELS[lead.tier]}</p>
        </div>
        <div className="rounded-3xl border border-border/30 bg-card p-6 shadow-depth">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Acao</p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {ACTION_LABELS[lead.recommendedAction]}
          </p>
        </div>
        <div className="rounded-3xl border border-border/30 bg-card p-6 shadow-depth">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
          <p className="mt-2 text-xl font-semibold text-foreground">{STATUS_LABELS[lead.status]}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-border/30 bg-card p-6 shadow-depth">
          <h2 className="font-display text-xl font-semibold text-foreground">Ficha do lead</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Porte</p>
              <p className="mt-1 text-sm font-medium text-foreground">{lead.companySize}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Urgência</p>
              <p className="mt-1 text-sm font-medium text-foreground">{lead.urgency}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Timing</p>
              <p className="mt-1 text-sm font-medium text-foreground">{lead.timing}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nível de dor</p>
              <p className="mt-1 text-sm font-medium text-foreground">{lead.painLevel}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Observações</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {lead.notes || "Sem observações adicionais."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/30 bg-card p-6 shadow-depth">
          <h2 className="font-display text-xl font-semibold text-foreground">Snapshot do score</h2>
          <div className="mt-5 space-y-3 text-sm text-muted-foreground">
            {Object.entries(snapshotMatches).length > 0 ? (
              Object.entries(snapshotMatches).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-2xl bg-background/60 px-4 py-3"
                >
                  <span className="font-medium text-foreground">{key}</span>
                  <span>{value ? "Corresponde" : "Não corresponde"}</span>
                </div>
              ))
            ) : (
              <p>Nenhum snapshot detalhado disponível.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
