import { FileText } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getProposalDraftEntries, getProposalDraftFieldLabel } from './proposalDraftFields';
import type { ProposalDraft } from './useProposalDraft';

export interface ProposalDraftPreviewCardProps {
  patch: Partial<ProposalDraft>;
  missingRequired: string[];
  extractedFromPdf: boolean;
}

const MAX_VALUE_LENGTH = 160;

function truncateValue(value: string): string {
  const normalized = value.trim();

  if (normalized.length <= MAX_VALUE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_VALUE_LENGTH - 1).trimEnd()}...`;
}

export function ProposalDraftPreviewCard({
  patch,
  missingRequired,
  extractedFromPdf,
}: ProposalDraftPreviewCardProps) {
  const entries = getProposalDraftEntries(patch);

  return (
    <section
      data-testid="proposal-draft-preview-card"
      className={cn(
        'mt-4 overflow-hidden rounded-[28px] border border-border/30 bg-card/70 p-4 shadow-sm backdrop-blur sm:p-5',
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/20 pb-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">Rascunho da proposta</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Campos identificados para atualizar o rascunho.
            </p>
          </div>

          {extractedFromPdf ? (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <FileText className="h-3.5 w-3.5" />
              Extraído de PDF
            </span>
          ) : null}
        </div>

        {entries.length > 0 ? (
          <dl className="grid gap-3">
            {entries.map(([field, value]) => (
              <div key={field} className="grid min-w-0 gap-1 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {getProposalDraftFieldLabel(field)}
                </dt>
                <dd className="min-w-0 break-words text-sm leading-6 text-foreground">
                  {truncateValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum campo novo identificado.</p>
        )}

        {missingRequired.length > 0 ? (
          <section className="border-t border-border/20 pt-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Campos obrigatorios pendentes</p>
            <ul className="flex flex-wrap gap-2">
              {missingRequired.map((field) => (
                <li
                  key={field}
                  className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"
                >
                  {getProposalDraftFieldLabel(field)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </section>
  );
}
