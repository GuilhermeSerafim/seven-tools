import type { ProposalDraft } from './useProposalDraft';

export const PROPOSAL_DRAFT_FIELD_LABELS: Record<keyof ProposalDraft, string> = {
  title: 'Titulo',
  clientName: 'Nome do cliente',
  clientCompany: 'Empresa do cliente',
  clientEmail: 'E-mail do cliente',
  clientPhone: 'Telefone do cliente',
  projectDescription: 'Descricao do projeto',
  scope: 'Escopo',
  value: 'Valor',
  deadline: 'Prazo',
  notes: 'Observacoes',
};

export const PROPOSAL_DRAFT_FIELD_ORDER = Object.keys(
  PROPOSAL_DRAFT_FIELD_LABELS,
) as (keyof ProposalDraft)[];

export type ProposalDraftEntry = readonly [keyof ProposalDraft, string];

export function getProposalDraftFieldLabel(field: string): string {
  return PROPOSAL_DRAFT_FIELD_LABELS[field as keyof ProposalDraft] ?? field;
}

function isDraftEntry(
  entry: readonly [keyof ProposalDraft, string | undefined],
): entry is ProposalDraftEntry {
  const [, value] = entry;

  return typeof value === 'string' && value.trim().length > 0;
}

export function getProposalDraftEntries(patch: Partial<ProposalDraft>): ProposalDraftEntry[] {
  return PROPOSAL_DRAFT_FIELD_ORDER.map((field) => [field, patch[field]] as const).filter(isDraftEntry);
}
