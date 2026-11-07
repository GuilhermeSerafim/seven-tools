import { Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getProposalDraftEntries, getProposalDraftFieldLabel } from './proposalDraftFields';
import type { ProposalDraft } from './useProposalDraft';

export interface ProposalUpdateCardProps {
  proposalId: string;
  patch: Partial<ProposalDraft>;
  applying: boolean;
  onApply: () => void;
  onCancel: () => void;
}

export function ProposalUpdateCard({
  proposalId,
  patch,
  applying,
  onApply,
  onCancel,
}: ProposalUpdateCardProps) {
  const entries = getProposalDraftEntries(patch);

  return (
    <section
      data-testid="proposal-update-card"
      className={cn('mt-4 overflow-hidden rounded-[28px] border border-border/30 bg-card/70 p-4 shadow-sm backdrop-blur')}
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0 border-b border-border/20 pb-3">
          <p className="text-sm font-semibold text-foreground">Atualizar proposta?</p>
          <p className="mt-1 break-words text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">
            Revise as alteracoes para a proposta {proposalId}.
          </p>
        </div>

        {entries.length > 0 ? (
          <dl className="grid gap-2">
            {entries.map(([field, value]) => (
              <div key={field} className="grid min-w-0 gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
                <dt className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground [overflow-wrap:anywhere]">
                  <span className="font-mono text-foreground">{field}</span>
                  <span className="uppercase tracking-[0.12em]">{getProposalDraftFieldLabel(field)}</span>
                </dt>
                <dd className="min-w-0 break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
                  {value.trim()}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma alteracao identificada.</p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border/20 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={applying}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={onApply} disabled={applying} aria-busy={applying}>
            <Check className="mr-2 h-4 w-4" />
            Aplicar
          </Button>
        </div>
      </div>
    </section>
  );
}
