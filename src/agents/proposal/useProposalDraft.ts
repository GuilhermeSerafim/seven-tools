import { useCallback, useMemo, useState } from 'react';

export interface ProposalDraft {
  title?: string;
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectDescription?: string;
  scope?: string;
  value?: string;
  deadline?: string;
  notes?: string;
}

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function useProposalDraft() {
  const [draft, setDraft] = useState<ProposalDraft | null>(null);

  const patch = useCallback((partial: Partial<ProposalDraft>) => {
    setDraft((currentDraft) => {
      return currentDraft ? { ...currentDraft, ...partial } : { ...partial };
    });
  }, []);

  const reset = useCallback(() => {
    setDraft(null);
  }, []);

  const isSavable = useMemo(
    () =>
      hasValue(draft?.title) &&
      hasValue(draft?.clientName) &&
      hasValue(draft?.projectDescription),
    [draft],
  );

  return { draft, patch, reset, isSavable };
}
