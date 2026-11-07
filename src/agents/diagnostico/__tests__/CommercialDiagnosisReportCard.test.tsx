import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CommercialDiagnosisReportCard } from '../CommercialDiagnosisReportCard';
import type { CommercialDiagnosisReport } from '../types';

const report: CommercialDiagnosisReport = {
  cenario: 'Leads chegam, mas a decisao nao avanca depois da proposta.',
  gargalo_principal: 'Falta de follow-up com compromisso claro.',
  etapa_critica_funil: 'Pos-proposta',
  sintomas: ['Lead some depois da call', 'Proposta vira preco', 'Equipe nao mede retorno'],
  causa_provavel: 'A conversa termina sem proximo passo verificavel.',
  acao_recomendada: 'Criar uma cadencia curta com pergunta de decisao.',
  plano_prioritario: ['Mapear leads abertos', 'Definir follow-up de 7 dias', 'Medir taxa de resposta'],
};

describe('CommercialDiagnosisReportCard', () => {
  it('renders the structured diagnosis report', () => {
    render(<CommercialDiagnosisReportCard report={report} />);

    expect(screen.getByTestId('commercial-diagnosis-report-card')).toBeInTheDocument();
    expect(screen.getByText('Cenario')).toBeInTheDocument();
    expect(screen.getByText(report.cenario)).toBeInTheDocument();
    expect(screen.getByText('Gargalo principal')).toBeInTheDocument();
    expect(screen.getByText(report.gargalo_principal)).toBeInTheDocument();
    expect(screen.getByText('Pos-proposta')).toBeInTheDocument();
    expect(screen.getByText('Lead some depois da call')).toBeInTheDocument();
    expect(screen.getByText(report.causa_provavel)).toBeInTheDocument();
    expect(screen.getByText(report.acao_recomendada)).toBeInTheDocument();
    expect(screen.getByText('Medir taxa de resposta')).toBeInTheDocument();
  });
});
