import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCommercialDiagnosisChatAdapter } from '../useCommercialDiagnosisChatAdapter';

describe('createCommercialDiagnosisChatAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const diagnosisToolResult = {
    kind: 'commercial_diagnosis_report',
    report: {
      cenario: 'Funil gera conversas, mas perde decisao.',
      gargalo_principal: 'Follow-up sem compromisso.',
      etapa_critica_funil: 'Pos-reuniao',
      sintomas: ['Lead some', 'Proposta vira preco'],
      causa_provavel: 'Sem proximo passo verificavel.',
      acao_recomendada: 'Definir cadencia objetiva.',
      plano_prioritario: ['Revisar leads abertos', 'Criar cadencia'],
    },
  };

  it('calls the commercial diagnosis endpoint with auth and history', async () => {
    localStorage.setItem('seventools_token', 'token-diagnostico');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reply: 'Me conta onde o funil trava hoje.',
          tool_result: null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createCommercialDiagnosisChatAdapter({
      apiBaseUrl: 'https://api.test/api/v1',
    });
    const result = await adapter.send(
      [
        { role: 'user', content: 'Tenho muitos leads e poucas vendas' },
        { role: 'assistant', content: 'Onde eles travam?' },
        { role: 'user', content: 'Somem depois da proposta' },
      ],
      new AbortController().signal,
    );

    expect(result).toEqual({
      reply: 'Me conta onde o funil trava hoje.',
      toolResult: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/api/v1/ai/commercial-diagnosis-assistant',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-diagnostico',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Tenho muitos leads e poucas vendas' },
            { role: 'assistant', content: 'Onde eles travam?' },
            { role: 'user', content: 'Somem depois da proposta' },
          ],
        }),
      }),
    );
  });

  it('maps a structured commercial diagnosis report tool result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reply: 'Fechei o diagnostico.',
          tool_result: diagnosisToolResult,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createCommercialDiagnosisChatAdapter({
      apiBaseUrl: 'https://api.test/api/v1',
    });
    const ctrl = new AbortController();

    const result = await adapter.send([{ role: 'user', content: 'diagnostica meu funil' }], ctrl.signal);

    expect(result).toEqual({
      reply: 'Fechei o diagnostico.',
      toolResult: diagnosisToolResult,
    });
    expect(result.toolResult).toMatchObject({
      kind: 'commercial_diagnosis_report',
      report: diagnosisToolResult.report,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/api/v1/ai/commercial-diagnosis-assistant',
      expect.objectContaining({
        signal: ctrl.signal,
      }),
    );
  });

  it('throws when the backend rejects the request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('erro', { status: 502 })));
    const adapter = createCommercialDiagnosisChatAdapter({ apiBaseUrl: 'https://api.test/api/v1' });

    await expect(
      adapter.send([{ role: 'user', content: 'diagnostica' }], new AbortController().signal),
    ).rejects.toThrow('Commercial diagnosis assistant request failed with status 502');
  });
});
