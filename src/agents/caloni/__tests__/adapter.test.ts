import { describe, expect, it, vi, beforeEach } from 'vitest';
import { caloniAdapter, buildIntroFromResult } from '../adapter';
import calonService, { type CalonAnalysis } from '@/services/calonService';

const MOCK_RESULT: CalonAnalysis = {
  overallScore: 7.8,
  overallLabel: 'Proposta Forte',
  strongPoints: ['Boa estrutura'],
  weakPoints: ['Falta prova social'],
  criteria: [{ name: 'Clareza', score: 8, comment: 'Ok' }],
  suggestions: ['Adicionar casos'],
  analysedAt: Date.now(),
};

describe('caloniAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('com context.proposalId chama analyzeByProposalId e retorna text + payload', async () => {
    vi.spyOn(calonService, 'analyzeByProposalId').mockResolvedValue(MOCK_RESULT);
    const ctrl = new AbortController();

    const res = await caloniAdapter.send(
      { text: '', attachments: [], context: { proposalId: 'p1' } },
      ctrl.signal,
    );

    expect(calonService.analyzeByProposalId).toHaveBeenCalledWith('p1');
    expect(res.payload).toEqual(MOCK_RESULT);
    expect(res.text).toContain('7.8');
    expect(res.text).toContain('Proposta Forte');
  });

  it('com anexo PDF chama analyzeFile e retorna text + payload', async () => {
    vi.spyOn(calonService, 'analyzeFile').mockResolvedValue(MOCK_RESULT);
    const ctrl = new AbortController();
    const file = new File(['x'], 'p.pdf', { type: 'application/pdf' });

    const res = await caloniAdapter.send(
      {
        text: '',
        attachments: [{ id: 'a1', type: 'pdf', file, name: 'p.pdf', sizeBytes: 1 }],
      },
      ctrl.signal,
    );

    expect(calonService.analyzeFile).toHaveBeenCalledWith(file);
    expect(res.payload).toEqual(MOCK_RESULT);
  });

  it('sem proposalId e sem PDF retorna mensagem de recusa sem chamar API', async () => {
    const analyzeSpy = vi.spyOn(calonService, 'analyzeFile');
    const byIdSpy = vi.spyOn(calonService, 'analyzeByProposalId');
    const ctrl = new AbortController();

    const res = await caloniAdapter.send(
      { text: 'olá', attachments: [] },
      ctrl.signal,
    );

    expect(analyzeSpy).not.toHaveBeenCalled();
    expect(byIdSpy).not.toHaveBeenCalled();
    expect(res.payload).toBeUndefined();
    expect(res.text).toMatch(/proposta salva|PDF/i);
  });
});

describe('buildIntroFromResult', () => {
  it('monta frase com score e label', () => {
    const text = buildIntroFromResult(MOCK_RESULT);
    expect(text).toContain('7.8');
    expect(text).toContain('Proposta Forte');
  });
});
