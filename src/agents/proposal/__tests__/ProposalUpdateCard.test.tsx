import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProposalUpdateCard } from '../ProposalUpdateCard';

describe('ProposalUpdateCard', () => {
  it('renders patch keys and values', () => {
    render(
      <ProposalUpdateCard
        proposalId="proposal-123"
        patch={{
          title: 'Proposta revisada',
          clientName: 'Ana Silva',
          value: 'R$ 12.000',
          notes: '',
        }}
        applying={false}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId('proposal-update-card')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('Proposta revisada')).toBeInTheDocument();
    expect(screen.getByText('clientName')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('value')).toBeInTheDocument();
    expect(screen.getByText('R$ 12.000')).toBeInTheDocument();
    expect(screen.queryByText('notes')).not.toBeInTheDocument();
  });

  it('calls onApply when Aplicar clicked', () => {
    const onApply = vi.fn();

    render(
      <ProposalUpdateCard
        proposalId="proposal-123"
        patch={{ title: 'Proposta revisada' }}
        applying={false}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /aplicar/i }));

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('disables Aplicar while applying', () => {
    render(
      <ProposalUpdateCard
        proposalId="proposal-123"
        patch={{ title: 'Proposta revisada' }}
        applying
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /aplicar/i })).toBeDisabled();
  });

  it('calls onCancel when Cancelar clicked', () => {
    const onCancel = vi.fn();

    render(
      <ProposalUpdateCard
        proposalId="proposal-123"
        patch={{ title: 'Proposta revisada' }}
        applying={false}
        onApply={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
