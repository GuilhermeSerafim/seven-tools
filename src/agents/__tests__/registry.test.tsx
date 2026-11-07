import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { agentRegistry } from '../registry';
import type { CalonAnalysis } from '@/services/calonService';

const MOCK_RESULT: CalonAnalysis = {
  overallScore: 7.8,
  overallLabel: 'Proposta Forte',
  strongPoints: ['Boa abertura'],
  weakPoints: ['Falta prova social'],
  criteria: [{ name: 'Clareza', score: 8, comment: 'Bem estruturada' }],
  suggestions: ['Adicionar cases'],
  analysedAt: Date.now(),
};

describe('agentRegistry', () => {
  it('retorna null para payloads invalidos de proposta sem crashar', () => {
    const cfg = agentRegistry['proposta-comercial-smart'];

    expect(cfg.renderResult(null)).toBeNull();
    expect(cfg.renderResult({})).toBeNull();
    expect(cfg.renderResult({ kind: 12, patch: null, missing_required: 'clientEmail' })).toBeNull();
    expect(cfg.renderResult({ kind: 'proposal_draft_patch', patch: null, missing_required: [] })).toBeNull();
    expect(cfg.renderResult({ kind: 'proposal_draft_patch', patch: {}, missing_required: 'clientEmail' })).toBeNull();
    expect(cfg.renderResult({ kind: 'proposal_validation_report', report: null })).toBeNull();
  });

  it('remove a ferramenta separada validacao-caloni do registry', () => {
    expect(agentRegistry['validacao-caloni']).toBeUndefined();
  });

  it('contem config real para Radar de Leads sem exigir migracao do Raio-X', () => {
    const diagnostico = agentRegistry['diagnostico-comercial-caloni'];
    const radar = agentRegistry['qualificacao-de-leads'];

    expect(diagnostico).toBeDefined();
    expect(diagnostico.name).toBe('Raio-X Comercial');

    expect(radar).toBeDefined();
    expect(radar.id).toBe('qualificacao-de-leads');
    expect(radar.name).toBe('Radar de Leads');
    expect(radar.subtitle).toMatch(/priorizacao comercial/i);
    expect(radar.mission).toMatch(/qualificar leads/i);
    expect(radar.suggestions.map((item) => item.label)).toEqual([
      'Priorizar leads',
      'Qualificar inbound',
      'Revisar criterios',
    ]);
  });

  it('contem config completa para proposta-comercial-smart', () => {
    const cfg = agentRegistry['proposta-comercial-smart'];
    expect(cfg).toBeDefined();
    expect(cfg.id).toBe('proposta-comercial-smart');
    expect(cfg.name).toBe('Caloni');
    expect(cfg.subtitle).toBe('Decisor Comercial — Proposta');
    expect(cfg.avatarSrc).toBe('/caloni-photo.jpg.jpg');
    expect(cfg.mission).toContain('criar, editar ou validar uma proposta');
    expect(cfg.suggestions).toEqual([
      { label: 'Começar proposta nova', action: { kind: 'prefill', text: 'Quero montar uma proposta comercial nova' } },
      { label: 'Editar a última', action: { kind: 'prefill', text: 'Quero ajustar a última proposta que salvei' } },
      { label: 'Validar proposta', action: { kind: 'open-proposal-picker' } },
    ]);

    render(
      <div>
        {cfg.renderResult({
          kind: 'proposal_draft_patch',
          patch: {
            title: 'Plano Comercial 2026',
            clientName: 'Ana Silva',
            projectDescription: 'Implantacao do playbook comercial',
          },
          missing_required: ['clientEmail'],
        })}
      </div>,
    );

    expect(screen.getByTestId('proposal-draft-preview-card')).toBeInTheDocument();
    expect(screen.getByText('Plano Comercial 2026')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('E-mail do cliente')).toBeInTheDocument();

    render(
      <div>
        {cfg.renderResult({
          kind: 'proposal_validation_report',
          report: MOCK_RESULT,
          proposal_id: 'proposal-1',
        })}
      </div>,
    );

    expect(screen.getByTestId('caloni-guided-report')).toBeInTheDocument();
    expect(screen.getByText('7.8')).toBeInTheDocument();
    expect(screen.getAllByText('Proposta Forte')).not.toHaveLength(0);

    expect(cfg.renderResult({ kind: 'proposal_save_request', draft_summary: {} })).toBeNull();
    expect(cfg.renderResult({ kind: 'proposal_update_request', proposal_id: 'proposal-1', patch: {} })).toBeNull();
    expect(cfg.renderResult({ kind: 'proposal_open_existing', proposal_id: 'proposal-1' })).toBeNull();
  });

  it('mantem configs validas sem onToolResult', () => {
    expect(agentRegistry['proposta-comercial-smart'].onToolResult).toBeUndefined();
    expect(agentRegistry['diagnostico-comercial-caloni'].onToolResult).toBeUndefined();
    expect(agentRegistry['qualificacao-de-leads'].onToolResult).toBeUndefined();
  });

  it('Radar renderiza payload estruturado de fila priorizada', () => {
    const cfg = agentRegistry['qualificacao-de-leads'];

    render(
      <div>
        {cfg.renderResult?.({
          kind: 'lead_qualification_queue',
          summary: {
            total_leads: 1,
            highest_score: 91,
            primary_action: 'abordar_agora',
          },
          leads: [
            {
              lead_id: 'lead-91',
              company_name: 'ACME Growth',
              contact_name: 'Ana Silva',
              contact_role: 'CEO',
              segment: 'SaaS B2B',
              company_size: '51-200',
              urgency: 'alta',
              timing: 'este mes',
              pain_level: 'alta',
              notes: null,
              score: 91,
              tier: 'diamond',
              recommended_action: 'abordar_agora',
              qualification_reason: 'Dor clara e decisora envolvida.',
              risk: 'Validar budget.',
              recommended_next_step: 'Enviar mensagem consultiva hoje.',
            },
          ],
        })}
      </div>,
    );

    expect(screen.getByTestId('lead-qualification-queue-card')).toBeInTheDocument();
    expect(screen.getByText('ACME Growth')).toBeInTheDocument();
    expect(screen.getByText('91/100')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver detalhe acme growth/i })).toHaveAttribute(
      'href',
      '/tools/qualificacao-de-leads/app/lead-91',
    );
    expect(cfg.renderResult?.({ kind: 'other' })).toBeNull();
  });
});
