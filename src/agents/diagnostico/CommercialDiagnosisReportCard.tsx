import { AlertTriangle, CheckCircle2, ListChecks, Target } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { CommercialDiagnosisReport } from './types';

export interface CommercialDiagnosisReportCardProps {
  report: CommercialDiagnosisReport;
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-1">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm leading-6 text-foreground">{value}</dd>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className="flex min-w-0 gap-2 text-sm leading-6 text-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CommercialDiagnosisReportCard({ report }: CommercialDiagnosisReportCardProps) {
  return (
    <section
      data-testid="commercial-diagnosis-report-card"
      className={cn(
        'mt-4 overflow-hidden rounded-[28px] border border-border/30 bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5',
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">Diagnostico comercial</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Sintese do cenario, gargalo e plano prioritario.
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Target className="h-3.5 w-3.5" />
            Raio-X
          </span>
        </div>

        <dl className="grid gap-4">
          <FieldBlock label="Cenario" value={report.cenario} />
          <FieldBlock label="Gargalo principal" value={report.gargalo_principal} />
          <FieldBlock label="Etapa critica do funil" value={report.etapa_critica_funil} />
        </dl>

        <div className="grid gap-4 border-t border-border/20 pt-4 sm:grid-cols-2">
          <section className="min-w-0 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Sintomas
            </div>
            <BulletList items={report.sintomas} />
          </section>

          <section className="min-w-0 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListChecks className="h-4 w-4 text-primary" />
              Plano prioritario
            </div>
            <BulletList items={report.plano_prioritario} />
          </section>
        </div>

        <dl className="grid gap-4 border-t border-border/20 pt-4 sm:grid-cols-2">
          <FieldBlock label="Causa provavel" value={report.causa_provavel} />
          <div className="min-w-0 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Acao recomendada
            </div>
            <p className="min-w-0 break-words text-sm leading-6 text-foreground">{report.acao_recomendada}</p>
          </div>
        </dl>
      </div>
    </section>
  );
}
