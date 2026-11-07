import { AlertTriangle, ArrowRight, Building2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ACTION_LABELS, TIER_LABELS } from '@/features/comercial/leadQualificationLabels';
import { getLeadQualificationDetailPath } from '@/features/comercial/toolRoutes';
import { normalizeLeadQualificationQueuePayload } from './types';

export interface LeadQualificationQueueCardProps {
  payload: unknown;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
      <dt className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm leading-6 text-foreground">{value || 'Nao informado'}</dd>
    </div>
  );
}

export function LeadQualificationQueueCard({ payload }: LeadQualificationQueueCardProps) {
  const queue = normalizeLeadQualificationQueuePayload(payload);

  if (!queue) {
    return null;
  }

  return (
    <section
      data-testid="lead-qualification-queue-card"
      className="mt-4 overflow-hidden rounded-lg border border-border/40 bg-card/70 shadow-sm backdrop-blur"
    >
      <header className="flex flex-col gap-3 border-b border-border/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Fila priorizada</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Leads ordenados por fit, urgencia e proxima melhor acao.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {queue.summary.totalLeads} lead{queue.summary.totalLeads === 1 ? '' : 's'}
          </Badge>
          {queue.summary.highestScore !== null ? (
            <Badge variant="outline">Maior score: {queue.summary.highestScore}</Badge>
          ) : null}
          {queue.summary.primaryAction ? (
            <Badge>{ACTION_LABELS[queue.summary.primaryAction]}</Badge>
          ) : null}
        </div>
      </header>

      <ol className="divide-y divide-border/30">
        {queue.leads.map((lead, index) => (
          <li key={`${lead.leadId || lead.companyName}-${index}`} className="p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="break-words text-base font-semibold text-foreground">{lead.companyName}</h3>
                  </div>
                  <p className="mt-1 break-words text-sm text-muted-foreground">
                    {[lead.contactName, lead.contactRole, lead.segment].filter(Boolean).join(' / ')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Badge variant="outline">{lead.score}/100</Badge>
                  <Badge variant="secondary">{TIER_LABELS[lead.tier]}</Badge>
                  <Badge>{ACTION_LABELS[lead.recommendedAction]}</Badge>
                </div>
              </div>

              <dl className="grid gap-3">
                <DetailRow icon={CheckCircle2} label="Motivo" value={lead.qualificationReason} />
                <DetailRow icon={ShieldAlert} label="Risco" value={lead.risk} />
                <DetailRow icon={Sparkles} label="Proxima acao" value={lead.recommendedNextStep} />
                <DetailRow
                  icon={AlertTriangle}
                  label="Contexto"
                  value={[
                    lead.companySize,
                    lead.urgency ? `urgencia ${lead.urgency}` : '',
                    lead.timing,
                    lead.painLevel ? `dor ${lead.painLevel}` : '',
                  ]
                    .filter(Boolean)
                    .join(' / ')}
                />
              </dl>

              {lead.leadId ? (
                <div>
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={getLeadQualificationDetailPath(lead.leadId)}
                      aria-label={`Ver detalhe ${lead.companyName}`}
                    >
                      Ver detalhe
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
