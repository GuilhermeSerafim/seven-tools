import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LeadQualificationQueueCard } from '../LeadQualificationQueueCard';

const snakeCasePayload = {
  kind: 'lead_qualification_queue',
  summary: {
    total_leads: 2,
    highest_score: 94,
    primary_action: 'abordar_agora',
  },
  leads: [
    {
      lead_id: 'lead-1',
      company_name: 'ACME Growth',
      contact_name: 'Ana Silva',
      contact_role: 'CEO',
      segment: 'SaaS B2B',
      company_size: '51-200',
      urgency: 'alta',
      timing: 'este mes',
      pain_level: 'alta',
      notes: 'Chegou por inbound',
      score: 94,
      tier: 'diamond',
      recommended_action: 'abordar_agora',
      qualification_reason: 'Dor clara e decisora envolvida.',
      risk: 'Validar budget antes da proposta.',
      recommended_next_step: 'Enviar mensagem consultiva hoje.',
    },
    {
      lead_id: '',
      company_name: 'Beta Ops',
      contact_name: 'Bruno Costa',
      contact_role: 'Head Comercial',
      segment: 'Servicos',
      company_size: '11-50',
      urgency: 'media',
      timing: 'proximo trimestre',
      pain_level: 'media',
      notes: null,
      score: 72,
      tier: 'gold',
      recommended_action: 'nutrir',
      qualification_reason: 'Fit bom, timing menos urgente.',
      risk: 'Pode esfriar sem cadencia.',
      recommended_next_step: 'Entrar em cadencia de nutricao.',
    },
  ],
};

describe('LeadQualificationQueueCard', () => {
  it('renders a prioritized queue from a fresh snake_case payload', () => {
    render(<LeadQualificationQueueCard payload={snakeCasePayload} />);

    expect(screen.getByTestId('lead-qualification-queue-card')).toBeInTheDocument();
    expect(screen.getByText('Fila priorizada')).toBeInTheDocument();
    expect(screen.getByText('2 leads')).toBeInTheDocument();
    expect(screen.getByText('Maior score: 94')).toBeInTheDocument();

    expect(screen.getByText('ACME Growth')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva / CEO / SaaS B2B')).toBeInTheDocument();
    expect(screen.getByText('94/100')).toBeInTheDocument();
    expect(screen.getByText('Diamante')).toBeInTheDocument();
    expect(screen.getAllByText('Abordar agora')).toHaveLength(2);
    expect(screen.getByText('Dor clara e decisora envolvida.')).toBeInTheDocument();
    expect(screen.getByText('Validar budget antes da proposta.')).toBeInTheDocument();
    expect(screen.getByText('Enviar mensagem consultiva hoje.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver detalhe acme growth/i })).toHaveAttribute(
      'href',
      '/tools/qualificacao-de-leads/app/lead-1',
    );

    expect(screen.getByText('Beta Ops')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ver detalhe beta ops/i })).not.toBeInTheDocument();
  });

  it('renders a rehydrated camelCase payload', () => {
    render(
      <LeadQualificationQueueCard
        payload={{
          kind: 'lead_qualification_queue',
          summary: {
            totalLeads: 1,
            highestScore: 88,
            primaryAction: 'revisar_manualmente',
          },
          leads: [
            {
              leadId: 'lead-2',
              companyName: 'Gamma Clinic',
              contactName: 'Carla Lima',
              contactRole: 'Diretora',
              segment: 'Saude',
              companySize: '201-500',
              urgency: 'media',
              timing: '60 dias',
              painLevel: 'alta',
              notes: null,
              score: 88,
              tier: 'gold',
              recommendedAction: 'revisar_manualmente',
              qualificationReason: 'Precisa validar autoridade de compra.',
              risk: 'Ciclo de decisao longo.',
              recommendedNextStep: 'Pedir organograma de decisores.',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Gamma Clinic')).toBeInTheDocument();
    expect(screen.getByText('Carla Lima / Diretora / Saude')).toBeInTheDocument();
    expect(screen.getAllByText('Revisar manualmente')).toHaveLength(2);
    expect(screen.getByText('Ouro')).toBeInTheDocument();
  });

  it('returns null for invalid payloads', () => {
    const { container } = render(<LeadQualificationQueueCard payload={{ kind: 'other' }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
