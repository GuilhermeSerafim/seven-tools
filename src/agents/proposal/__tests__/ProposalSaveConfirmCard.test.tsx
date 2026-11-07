import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProposalSaveConfirmCard } from '../ProposalSaveConfirmCard';
import type { ProposalDraft } from '../useProposalDraft';

const DRAFT: ProposalDraft = {
  title: 'Proposta SEVEN',
  clientName: 'Ana Silva',
  value: 'R$ 12.000',
  deadline: '30 dias',
};

describe('ProposalSaveConfirmCard', () => {
  it('renders draft summary fields', () => {
    render(<ProposalSaveConfirmCard draft={DRAFT} saving={false} onSave={vi.fn()} onAdjust={vi.fn()} />);

    expect(screen.getByTestId('proposal-save-confirm-card')).toBeInTheDocument();
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Proposta SEVEN')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('R$ 12.000')).toBeInTheDocument();
    expect(screen.getByText('Prazo')).toBeInTheDocument();
    expect(screen.getByText('30 dias')).toBeInTheDocument();
  });

  it('calls onSave when Salvar clicked', () => {
    const onSave = vi.fn();

    render(<ProposalSaveConfirmCard draft={DRAFT} saving={false} onSave={onSave} onAdjust={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables Salvar while saving', () => {
    render(<ProposalSaveConfirmCard draft={DRAFT} saving onSave={vi.fn()} onAdjust={vi.fn()} />);

    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
  });

  it('calls onAdjust when Ajustar clicked', () => {
    const onAdjust = vi.fn();

    render(<ProposalSaveConfirmCard draft={DRAFT} saving={false} onSave={vi.fn()} onAdjust={onAdjust} />);

    fireEvent.click(screen.getByRole('button', { name: /ajustar/i }));

    expect(onAdjust).toHaveBeenCalledTimes(1);
  });
});
