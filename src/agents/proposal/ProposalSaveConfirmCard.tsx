import { Pencil, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProposalDraft } from './useProposalDraft';

export interface ProposalSaveConfirmCardProps {
  draft: ProposalDraft;
  saving: boolean;
  onSave: () => void;
  onAdjust: () => void;
}

const SUMMARY_FIELDS = [
  ['title', 'Titulo'],
  ['clientName', 'Cliente'],
  ['value', 'Valor'],
  ['deadline', 'Prazo'],
] as const satisfies readonly (readonly [keyof ProposalDraft, string])[];

function getSummaryValue(value: string | undefined): string {
  const normalized = value?.trim();

  return normalized ? normalized : 'Nao informado';
}

export function ProposalSaveConfirmCard({ draft, saving, onSave, onAdjust }: ProposalSaveConfirmCardProps) {
  return (
    <section
      data-testid="proposal-save-confirm-card"
      className={cn('mt-4 overflow-hidden rounded-[28px] border border-border/30 bg-card/70 p-4 shadow-sm backdrop-blur')}
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0 border-b border-border/20 pb-3">
          <p className="text-sm font-semibold text-foreground">Salvar proposta?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Confira o resumo antes de gravar o rascunho.</p>
        </div>

        <dl className="grid gap-2">
          {SUMMARY_FIELDS.map(([field, label]) => (
            <div key={field} className="grid min-w-0 gap-1 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words text-sm leading-6 text-foreground">{getSummaryValue(draft[field])}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col-reverse gap-2 border-t border-border/20 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onAdjust} disabled={saving}>
            <Pencil className="mr-2 h-4 w-4" />
            Ajustar
          </Button>
          <Button type="button" size="sm" onClick={onSave} disabled={saving} aria-busy={saving}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>
    </section>
  );
}
