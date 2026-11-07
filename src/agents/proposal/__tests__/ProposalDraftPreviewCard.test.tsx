import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProposalDraftPreviewCard } from '../ProposalDraftPreviewCard';

describe('ProposalDraftPreviewCard', () => {
  it('renders fields from patch', () => {
    render(
      <ProposalDraftPreviewCard
        patch={{
          title: 'Proposta SEVEN',
          clientName: 'Ana Silva',
          projectDescription: 'Implantacao de hub comercial',
          notes: '',
        }}
        missingRequired={[]}
        extractedFromPdf={false}
      />,
    );

    expect(screen.getByTestId('proposal-draft-preview-card')).toBeInTheDocument();
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Proposta SEVEN')).toBeInTheDocument();
    expect(screen.getByText('Nome do cliente')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Descricao do projeto')).toBeInTheDocument();
    expect(screen.getByText('Implantacao de hub comercial')).toBeInTheDocument();
    expect(screen.queryByText('Observacoes')).not.toBeInTheDocument();
  });

  it('shows missing required fields', () => {
    render(
      <ProposalDraftPreviewCard
        patch={{ clientName: 'Ana Silva' }}
        missingRequired={['title', 'projectDescription']}
        extractedFromPdf={false}
      />,
    );

    expect(screen.getByText('Campos obrigatorios pendentes')).toBeInTheDocument();
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Descricao do projeto')).toBeInTheDocument();
  });

  it('shows pdf-extracted flag', () => {
    render(
      <ProposalDraftPreviewCard
        patch={{ title: 'Proposta extraida' }}
        missingRequired={[]}
        extractedFromPdf
      />,
    );

    expect(screen.getByText(/extraído de PDF/i)).toBeInTheDocument();
  });
});
