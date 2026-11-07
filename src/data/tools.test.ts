import { describe, expect, it } from 'vitest';

import { getToolBySlug, recommendedToolIds, recentToolIds } from './tools';

describe('commercial tools registry', () => {
  it('uses the unified proposal tool as the validation surface', () => {
    const proposalTool = getToolBySlug('proposta-comercial-smart');
    expect(proposalTool?.name).toBe('Caloni Propostas');
    expect(proposalTool?.shortDescription).toContain('valide propostas');
    expect(proposalTool?.longDescription).toContain('valide o material');
    expect(proposalTool?.tags).toContain('validação');

    expect(getToolBySlug('validacao-caloni')).toBeUndefined();
    expect(recentToolIds).not.toContain('21');
    expect(recommendedToolIds).not.toContain('21');

    const diagnosticoTool = getToolBySlug('diagnostico-comercial-caloni');
    expect(diagnosticoTool?.name).toBe('Raio-X Comercial');
    expect(diagnosticoTool?.longDescription).toContain('IA consultiva');
    expect(diagnosticoTool?.howToUse).toContain(
      'Abra um novo chat ou continue uma conversa recente com o Caloni',
    );
    expect(diagnosticoTool?.howToUse.join(' ')).not.toContain('nicho, cliente ideal');

    const leadQualificationTool = getToolBySlug('qualificacao-de-leads');
    expect(leadQualificationTool?.name).toBe('Radar de Leads');
    expect(leadQualificationTool?.shortDescription).toContain('fila priorizada');
  });
});
