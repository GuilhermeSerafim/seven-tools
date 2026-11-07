import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProposalPickerSheet } from '../ProposalPickerSheet';
import type { Proposal } from '@/services/proposalService';

const BASE: Omit<Proposal, 'id' | 'title'> = {
  userId: 'u1',
  clientName: '',
  clientCompany: '',
  clientEmail: '',
  clientPhone: '',
  projectDescription: '',
  scope: '',
  value: '',
  deadline: '',
  notes: '',
  status: 'ready',
  createdAt: '',
  updatedAt: '',
};

describe('ProposalPickerSheet', () => {
  it('quando aberto e com propostas, lista os t\u00EDtulos', () => {
    const proposals: Proposal[] = [
      { ...BASE, id: 'p1', title: 'Cliente A' },
      { ...BASE, id: 'p2', title: 'Cliente B' },
    ];
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={() => {}}
        proposals={proposals}
        loading={false}
      />,
    );
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
  });

  it('quando a proposta tem clientName, exibe a linha secundária', () => {
    const proposals: Proposal[] = [
      { ...BASE, id: 'p1', title: 'Cliente A', clientName: 'Empresa XPTO' },
    ];
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={() => {}}
        proposals={proposals}
        loading={false}
      />,
    );
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Empresa XPTO')).toBeInTheDocument();
  });

  it('clicar numa proposta dispara onSelect com ela', () => {
    const onSelect = vi.fn();
    const proposals: Proposal[] = [{ ...BASE, id: 'p1', title: 'Cliente A' }];
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={onSelect}
        proposals={proposals}
        loading={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Cliente A/i }));
    expect(onSelect).toHaveBeenCalledWith(proposals[0]);
  });

  it('quando loading=true, mostra skeleton e n\u00E3o renderiza propostas', () => {
    const proposals: Proposal[] = [{ ...BASE, id: 'p1', title: 'Cliente A' }];
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={() => {}}
        proposals={proposals}
        loading
      />,
    );
    expect(screen.getByTestId('proposal-picker-loading')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cliente A/i })).not.toBeInTheDocument();
  });

  it('quando n\u00E3o h\u00E1 propostas e loading=false, mostra empty state', () => {
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={() => {}}
        proposals={[]}
        loading={false}
      />,
    );
    expect(screen.getByText(/ainda n\u00E3o tem propostas/i)).toBeInTheDocument();
  });
});
