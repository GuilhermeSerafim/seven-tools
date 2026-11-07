import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createLeadQualificationChatAdapter } from '../adapter';
import { normalizeLeadQualificationQueuePayload } from '../types';
import type { Attachment, ChatMessage } from '@/agents/chat';

function makeJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function makeTextAttachment(name = 'lead.txt'): Attachment {
  const file = new File(['Dados do lead'], name, { type: 'text/plain' });

  return {
    id: 'att-1',
    type: 'text',
    file,
    name,
    sizeBytes: 13,
  };
}

describe('createLeadQualificationChatAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('posts full chat history to the lead qualification assistant endpoint', async () => {
    localStorage.setItem('seventools_token', 'token-leads');
    const fetchMock = vi.fn().mockResolvedValue(
      makeJsonResponse({
        reply: 'Fila priorizada pronta.',
        tool_result: {
          kind: 'lead_qualification_queue',
          summary: {
            total_leads: 1,
            highest_score: 100,
            primary_action: 'abordar_agora',
          },
          leads: [
            {
              lead_id: 'lead-1',
              company_name: 'ACME',
              contact_name: 'Ana',
              contact_role: 'Founder',
              segment: 'Tech',
              company_size: '11-50',
              urgency: 'alta',
              timing: 'imediato',
              pain_level: 'alta',
              notes: 'Inbound',
              score: 100,
              tier: 'diamond',
              recommended_action: 'abordar_agora',
              qualification_reason: 'Fit alto.',
              risk: 'Validar budget.',
              recommended_next_step: 'Abordar agora.',
            },
          ],
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createLeadQualificationChatAdapter({
      apiBaseUrl: 'http://api.test/api/v1/',
    });
    const attachment = makeTextAttachment();
    const history: ChatMessage[] = [
      { id: 'm1', role: 'system', content: 'Contexto interno', createdAt: 1 },
      { id: 'm2', role: 'user', content: 'Tenho leads inbound', createdAt: 2 },
      { id: 'm3', role: 'assistant', content: 'Me envie os dados.', createdAt: 3 },
      { id: 'm4', role: 'user', content: 'Ana da ACME', createdAt: 4, attachments: [attachment] },
    ];

    const response = await adapter.send(
      {
        text: 'Ana da ACME',
        attachments: [attachment],
        history,
      },
      new AbortController().signal,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/ai/lead-qualification-assistant',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-leads',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'Contexto interno', attachments: [] },
            { role: 'user', content: 'Tenho leads inbound', attachments: [] },
            { role: 'assistant', content: 'Me envie os dados.', attachments: [] },
            {
              role: 'user',
              content: 'Ana da ACME',
              attachments: [
                {
                  filename: 'lead.txt',
                  mime_type: 'text/plain',
                  size_bytes: 13,
                  text_content: 'Dados do lead',
                },
              ],
            },
          ],
        }),
      }),
    );
    expect(response).toEqual({
      text: 'Fila priorizada pronta.',
      payload: expect.objectContaining({ kind: 'lead_qualification_queue' }),
    });
  });

  it('falls back to input text when history is empty and omits authorization without token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeJsonResponse({
        reply: 'Me passe porte e timing para qualificar.',
        tool_result: null,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createLeadQualificationChatAdapter({ apiBaseUrl: 'http://api.test/api/v1' });
    const response = await adapter.send(
      { text: 'Lead ACME', attachments: [] },
      new AbortController().signal,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/ai/lead-qualification-assistant',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Lead ACME', attachments: [] }],
        }),
      }),
    );
    expect(response).toEqual({ text: 'Me passe porte e timing para qualificar.' });
  });

  it('attaches files only to the latest user message in history', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse({ reply: 'Ok', tool_result: null }));
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createLeadQualificationChatAdapter({ apiBaseUrl: 'http://api.test/api/v1' });
    await adapter.send(
      {
        text: 'Complemento',
        attachments: [makeTextAttachment('extra.txt')],
        history: [
          { id: 'm1', role: 'user', content: 'Primeiro lead', createdAt: 1 },
          { id: 'm2', role: 'assistant', content: 'Entendi.', createdAt: 2 },
          { id: 'm3', role: 'user', content: 'Complemento', createdAt: 3 },
          { id: 'm4', role: 'assistant', content: 'Processando.', createdAt: 4 },
        ],
      },
      new AbortController().signal,
    );

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      messages: [
        { role: 'user', content: 'Primeiro lead', attachments: [] },
        { role: 'assistant', content: 'Entendi.', attachments: [] },
        {
          role: 'user',
          content: 'Complemento',
          attachments: [
            {
              filename: 'extra.txt',
              mime_type: 'text/plain',
              size_bytes: 13,
              text_content: 'Dados do lead',
            },
          ],
        },
        { role: 'assistant', content: 'Processando.', attachments: [] },
      ],
    });
  });

  it('sends prior queue payloads as compact assistant context for follow-ups', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeJsonResponse({ reply: 'O primeiro ganhou por urgencia.', tool_result: null }));
    vi.stubGlobal('fetch', fetchMock);

    const adapter = createLeadQualificationChatAdapter({ apiBaseUrl: 'http://api.test/api/v1' });
    await adapter.send(
      {
        text: 'Por que o primeiro lead ficou no topo?',
        attachments: [],
        history: [
          { id: 'm1', role: 'user', content: 'Qualifique meus leads', createdAt: 1 },
          {
            id: 'm2',
            role: 'assistant',
            content: 'Fila priorizada pronta.',
            createdAt: 2,
            payload: {
              kind: 'lead_qualification_queue',
              summary: {
                totalLeads: 1,
                highestScore: 100,
                primaryAction: 'abordar_agora',
              },
              leads: [
                {
                  leadId: 'lead-1',
                  companyName: 'ACME',
                  contactName: 'Ana',
                  contactRole: 'Founder',
                  segment: 'SaaS',
                  companySize: '11-50',
                  urgency: 'alta',
                  timing: 'imediato',
                  painLevel: 'alta',
                  notes: null,
                  score: 100,
                  tier: 'diamond',
                  recommendedAction: 'abordar_agora',
                  qualificationReason: 'Fit alto.',
                  risk: 'Validar budget.',
                  recommendedNextStep: 'Abordar agora.',
                },
              ],
            },
          },
          { id: 'm3', role: 'user', content: 'Por que o primeiro lead ficou no topo?', createdAt: 3 },
        ],
      },
      new AbortController().signal,
    );

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      messages: [
        { role: 'user', content: 'Qualifique meus leads', attachments: [] },
        {
          role: 'assistant',
          content: 'Fila priorizada pronta.',
          payload: {
            kind: 'lead_qualification_queue',
            summary: {
              total_leads: 1,
              highest_score: 100,
              primary_action: 'abordar_agora',
            },
            leads: [
              {
                lead_id: 'lead-1',
                company_name: 'ACME',
                contact_name: 'Ana',
                contact_role: 'Founder',
                segment: 'SaaS',
                company_size: '11-50',
                urgency: 'alta',
                timing: 'imediato',
                pain_level: 'alta',
                notes: null,
                score: 100,
                tier: 'diamond',
                recommended_action: 'abordar_agora',
                qualification_reason: 'Fit alto.',
                risk: 'Validar budget.',
                recommended_next_step: 'Abordar agora.',
              },
            ],
          },
          attachments: [],
        },
        {
          role: 'user',
          content: 'Por que o primeiro lead ficou no topo?',
          attachments: [],
        },
      ],
    });
  });

  it('propagates the abort signal and throws when the endpoint returns an error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('nope', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal;
    const adapter = createLeadQualificationChatAdapter({ apiBaseUrl: 'http://api.test/api/v1' });

    await expect(adapter.send({ text: 'Lead', attachments: [] }, signal)).rejects.toThrow(
      'Lead qualification assistant request failed with status 503',
    );
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal }));
  });
});

describe('normalizeLeadQualificationQueuePayload', () => {
  it('normalizes fresh snake_case payloads and rehydrated camelCase history payloads', () => {
    const snake = normalizeLeadQualificationQueuePayload({
      kind: 'lead_qualification_queue',
      summary: {
        total_leads: 1,
        highest_score: 88,
        primary_action: 'abordar_agora',
      },
      leads: [
        {
          lead_id: 'lead-1',
          company_name: 'ACME',
          contact_name: 'Ana',
          contact_role: 'Founder',
          segment: 'Tech',
          company_size: '11-50',
          urgency: 'alta',
          timing: 'imediato',
          pain_level: 'alta',
          notes: '',
          score: 88,
          tier: 'gold',
          recommended_action: 'abordar_agora',
          qualification_reason: 'Fit alto.',
          risk: 'Validar budget.',
          recommended_next_step: 'Ligar hoje.',
        },
      ],
    });
    const camel = normalizeLeadQualificationQueuePayload({
      kind: 'lead_qualification_queue',
      summary: {
        totalLeads: 1,
        highestScore: 88,
        primaryAction: 'abordar_agora',
      },
      leads: [
        {
          leadId: 'lead-1',
          companyName: 'ACME',
          contactName: 'Ana',
          contactRole: 'Founder',
          segment: 'Tech',
          companySize: '11-50',
          urgency: 'alta',
          timing: 'imediato',
          painLevel: 'alta',
          notes: null,
          score: 88,
          tier: 'gold',
          recommendedAction: 'abordar_agora',
          qualificationReason: 'Fit alto.',
          risk: 'Validar budget.',
          recommendedNextStep: 'Ligar hoje.',
        },
      ],
    });

    expect(snake).toEqual(camel);
    expect(camel).toEqual({
      kind: 'lead_qualification_queue',
      summary: {
        totalLeads: 1,
        highestScore: 88,
        primaryAction: 'abordar_agora',
      },
      leads: [
        {
          leadId: 'lead-1',
          companyName: 'ACME',
          contactName: 'Ana',
          contactRole: 'Founder',
          segment: 'Tech',
          companySize: '11-50',
          urgency: 'alta',
          timing: 'imediato',
          painLevel: 'alta',
          notes: null,
          score: 88,
          tier: 'gold',
          recommendedAction: 'abordar_agora',
          qualificationReason: 'Fit alto.',
          risk: 'Validar budget.',
          recommendedNextStep: 'Ligar hoje.',
        },
      ],
    });
  });

  it('returns null for unrelated payloads', () => {
    expect(normalizeLeadQualificationQueuePayload({ kind: 'other' })).toBeNull();
    expect(normalizeLeadQualificationQueuePayload(null)).toBeNull();
  });
});
